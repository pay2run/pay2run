import React, { createContext, useContext, ReactNode } from 'react';
import { PaymentRequestDetails } from '@pay2run/types';

interface Pay2RunProviderProps {
  children: ReactNode;
  /**
   * This function is called when the SDK requires a payment.
   * You should use it to render your payment UI (e.g., a modal with a QR code).
   * @param details - The payment details needed to construct the payment request.
   * @param onComplete - A function your UI must call when the payment is submitted by the user.
   * @param onCancel - A function your UI must call if the user closes the modal.
   */
  renderPaymentUI: (
    details: PaymentRequestDetails,
    onComplete: () => void,
    onCancel: () => void
  ) => ReactNode;
}

interface Pay2RunContextValue {
  renderPaymentUI: Pay2RunProviderProps['renderPaymentUI'];
}

const Pay2RunContext = createContext<Pay2RunContextValue | null>(null);

export const Pay2RunProvider = ({
  children,
  renderPaymentUI,
}: Pay2RunProviderProps) => {
  return (
    <Pay2RunContext.Provider value={{ renderPaymentUI }}>
      {children}
    </Pay2RunContext.Provider>
  );
};

export const usePay2RunContext = () => {
  const context = useContext(Pay2RunContext);
  if (!context) {
    throw new Error('usePay2RunContext must be used within Pay2RunProvider');
  }
  return context;
};

