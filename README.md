# pay2run

A secure, scalable platform for monetizing API calls using payment rails. This monorepo contains the public SDK packages for pay2.run.

## Architecture Overview

pay2.run enables creators (sellers) to monetize API endpoints by requiring payment before execution. Runners (buyers) pay using their preferred payment method and receive a JWT token that authorizes the API call.

### Core Flow

1. **Creator Flow**: A seller defines an Action (API endpoint configuration) through the web dashboard or the SDK.
2. **Runner Flow**: A buyer uses the React SDK to execute an Action:
   - SDK requests execution → receives 402 Payment Required
   - User completes payment through their preferred payment method
   - Payment Verifier confirms payment
   - SDK receives JWT and makes authorized API call
   - Result is returned to the user

## Packages

This monorepo contains three public npm packages:

### `@pay2run/types`

The foundational TypeScript definitions shared across all packages. Uses **viem** for EVM chain types and supports Solana natively. Contains:

- `CreatorPaymentConfig`: Discriminated union for EVM or Solana payments
  - `EVMPaymentConfig`: Uses viem's `Chain` type for type-safe EVM chains
  - `SolanaPaymentConfig`: Native Solana cluster and SPL token support
- `PaymentMethodDetails`: Payment protocol details (Solana Pay, EIP-681, etc.)
- `ActionConfig`: Public-facing Action details
- `ActionConfigPayload`: Configuration payload for creating Actions
- `RunActionOptions`: Options for running Actions

**Peer Dependencies**: `viem ^2.0.0`

### `@pay2run/node`

The backend/admin SDK for creating and managing Actions. Requires a secret API key and should only be used in server environments.

```typescript
import { Pay2Run } from "@pay2run/node";
import { base } from "viem/chains";

const client = new Pay2Run({ apiKey: "your-api-key" });

// Create an Action with Base (EVM) payment
const action = await client.actions.create({
  name: "Translate to Spanish",
  targetUrl: "https://api.example.com/translate",
  httpMethod: "POST",
  secrets: { API_KEY: "sk_123..." },
  headers: { Authorization: "Bearer {{API_KEY}}" },
  price: "0.05",
  currency: "USD",
  payment: {
    type: "evm",
    chain: base, // Use any chain from viem/chains
    token: {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    },
    destinationAddress: "0x1234...5678",
  },
});

// Create with Solana payment
const solanaAction = await client.actions.create({
  name: "Translate to French",
  targetUrl: "https://api.example.com/translate",
  httpMethod: "POST",
  secrets: { API_KEY: "sk_123..." },
  headers: { Authorization: "Bearer {{API_KEY}}" },
  price: "0.05",
  currency: "USD",
  payment: {
    type: "solana",
    cluster: "mainnet-beta",
    token: {
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    },
    destinationAddress: "7ZpZu...seller-wallet-address",
  },
});
```

### `@pay2run/react`

The client-side SDK for running Actions in React applications. Provides hooks and providers for handling the payment flow.

```typescript
import { Pay2RunProvider, useAction } from '@pay2run/react';

function App() {
  return (
    <Pay2RunProvider
      renderPaymentUI={(details, onComplete, onCancel) => (
        <PaymentModal
          paymentDetails={details}
          onComplete={onComplete}
          onCancel={onCancel}
        />
      )}
    >
      <YourComponent />
    </Pay2RunProvider>
  );
}

function YourComponent() {
  const { run, status, data, error } = useAction('action-id');

  const handleRun = async () => {
    await run({ body: { text: 'Hello' } });
  };

  return (
    <div>
      <button onClick={handleRun}>Run Action</button>
      {status === 'success' && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
```

## Development

### Prerequisites

- Node.js >= 18
- pnpm 9.0.0

### Setup

```bash
# Install dependencies
pnpm install

# Run type checking
pnpm run check-types

# Build all packages
pnpm run build

# Run linting
pnpm run lint
```

### Package Structure

```
pay2run/
├── packages/
│   └── types/          # @pay2run/types
├── sdks/
│   ├── node/           # @pay2run/node
│   └── react/          # @pay2run/react
└── apps/               # (Default Next.js apps - can be removed)
```

## Publishing

All packages are configured for public npm publishing:

```bash
# Build packages
pnpm run build

# Publish (from each package directory)
cd packages/types && pnpm publish --access public
cd ../../sdks/node && pnpm publish --access public
cd ../react && pnpm publish --access public
```

## License

MIT
