import type { PaymentRequestDetails, RunActionOptions } from "@pay2run/types";
import { useCallback, useState } from "react";
import { usePay2RunContext } from "./provider";

type ActionStatus = "idle" | "requires_payment" | "pending" | "success" | "error";

interface UseActionResult<T> {
  /** The function to call to start the Action execution. */
  run: (options?: RunActionOptions) => Promise<void>;
  /** The current status of the Action execution. */
  status: ActionStatus;
  /** The final data returned from the target API upon success. */
  data: T | null;
  /** Any error that occurred during the process. */
  error: Error | null;
  /** Payment details, available when status is 'requires_payment'. */
  paymentDetails: PaymentRequestDetails | null;
}

const API_BASE_URL = "https://api.pay2.run";

export const useAction = <T = any>(actionId: string): UseActionResult<T> => {
  const { renderPaymentUI } = usePay2RunContext();
  const [status, setStatus] = useState<ActionStatus>("idle");
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentRequestDetails | null>(
    null
  );

  const pollForPayment = useCallback(
    async (paymentRequestId: string): Promise<string> => {
      const maxAttempts = 120; // 2 minutes max (1 second intervals)
      const pollInterval = 1000; // 1 second

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/v1/payments/${paymentRequestId}/status`,
            {
              method: "GET",
            }
          );

          if (response.status === 200) {
            const result = await response.json();
            if (result.status === "completed" && result.jwt) {
              return result.jwt;
            }
          }

          // Wait before next poll
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
        } catch (err) {
          // Continue polling on error
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }
      }

      throw new Error("Payment verification timeout");
    },
    []
  );

  const run = useCallback(
    async (options?: RunActionOptions) => {
      setStatus("pending");
      setError(null);
      setData(null);
      setPaymentDetails(null);

      try {
        // 1. Make the initial POST request to `/execute/{actionId}`
        const executeUrl = `${API_BASE_URL}/v1/execute/${actionId}`;
        const executeResponse = await fetch(executeUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(options?.headers || {}),
          },
          body: options?.body ? JSON.stringify(options.body) : undefined,
        });

        // 2. If 402 response (Payment Required)
        if (executeResponse.status === 402) {
          const paymentDetails: PaymentRequestDetails = await executeResponse.json();
          setPaymentDetails(paymentDetails);
          setStatus("requires_payment");

          // Await user interaction via the renderPaymentUI callback
          return new Promise<void>((resolve, reject) => {
            let paymentCompleted = false;
            let paymentCancelled = false;

            const onComplete = async () => {
              if (paymentCompleted || paymentCancelled) return;
              paymentCompleted = true;

              try {
                // Start polling for payment confirmation
                const jwt = await pollForPayment(paymentDetails.paymentRequestId);

                // Make the second, authorized request with JWT
                const finalResponse = await fetch(executeUrl, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${jwt}`,
                    ...(options?.headers || {}),
                  },
                  body: options?.body ? JSON.stringify(options.body) : undefined,
                });

                if (!finalResponse.ok) {
                  throw new Error(
                    `Failed to execute action: ${finalResponse.statusText}`
                  );
                }

                const result = await finalResponse.json();
                setData(result);
                setStatus("success");
                resolve();
              } catch (err) {
                setError(err as Error);
                setStatus("error");
                reject(err);
              }
            };

            const onCancel = () => {
              if (paymentCompleted || paymentCancelled) return;
              paymentCancelled = true;
              setStatus("idle");
              setPaymentDetails(null);
              reject(new Error("Payment cancelled by user"));
            };

            // Render the payment UI
            renderPaymentUI(paymentDetails, onComplete, onCancel);
          });
        }

        // 3. If 200 OK response (already paid or free action)
        if (executeResponse.ok) {
          const result = await executeResponse.json();
          setData(result);
          setStatus("success");
          return;
        }

        // Handle other error statuses
        throw new Error(`Unexpected response status: ${executeResponse.status}`);
      } catch (e) {
        setError(e as Error);
        setStatus("error");
        throw e;
      }
    },
    [actionId, renderPaymentUI, pollForPayment]
  );

  return { run, status, data, error, paymentDetails };
};
