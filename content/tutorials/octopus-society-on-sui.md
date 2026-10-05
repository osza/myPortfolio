---
type: tutorial
title: "Octopus Society on Sui — Tutorial sample (Piotr Oszenda)"
description: "Hands-on Sui tutorial showing a fictional membership flow for joining Octopus Society, verifying an on-chain object, and claiming a member reward."
eyebrow: "Developer documentation sample"
primary_link_href: "#overview"
primary_link_label: "Read tutorial"
secondary_link_href: "index.html#samples"
secondary_link_label: "Back to selected work"
hero_panel_id: "sui-tutorial-proof-title"
hero_panel_label: "Build status"
hero_panel_style: "default"
hero_panel_items: "Markdown source::octopus-society-on-sui.md | Generated HTML::Built locally before publication. | Checked output::Structure follows the API tutorial baseline and local links are validated in CI."
footer_tag: "Built from Markdown source"
uses_mermaid: false
accent_sections: "what-this-tutorial-demonstrates|overview|environment-and-setup|join-and-verify|cli-and-typescript-examples|what-the-reader-leaves-with"
spaced_articles: false
output: "octopus-society-on-sui.html"
---

# Join the Octopus Society on Sui

A hands-on tutorial illustrating a fictional membership flow for connecting a wallet, joining Octopus Society, verifying a membership [object on-chain](https://docs.sui.io/develop/sui-architecture/object-model), and claiming a member reward.

## What this tutorial demonstrates

- **A complete membership flow on Sui.** The reader follows one path from wallet setup to reward claim.
- **Parallel CLI and TypeScript examples.** The same flow is shown for terminal use and application code.
- **A practical object-based model.** The tutorial connects transactions, ownership checks, and object reads in one sequence.

## Overview

This tutorial is structured as a compact onboarding-style flow for a fictional membership module on Sui.

**Tutorial sample · Fictional Move package**

This tutorial demonstrates a sample workflow for joining Octopus Society, a fictional membership module built with Move on Sui. The package ID, object IDs, and example data are included to illustrate structure, flow, and documentation style.

By the end of the tutorial, you will have walked through connecting a wallet, minting a membership object, verifying ownership on-chain, and claiming a reward tied to that membership.

## Environment and setup

This section helps new Sui developers verify their local setup before they run the tutorial.

### Requirements

**CLI · Wallet · TypeScript tooling**

Before you begin, make sure you have the following in place:

- The [Sui CLI](https://docs.sui.io/references/cli) installed and configured for the target network, such as testnet.
- A wallet with [test SUI for gas fees](https://docs.sui.io/getting-started/onboarding/get-coins).
- Node.js installed if you plan to run the TypeScript examples.
- A code editor and a terminal for running Sui commands.
- The package ID for the fictional Octopus Society Move module used in the examples below.

If you are new to Sui, treat this as a quick readiness check: once the CLI works, the wallet is funded, and the package ID is available, you are ready to follow the tutorial as written.

The examples below use placeholder IDs and sample responses so the structure stays clear and reusable.

```bash
sui client active-env
sui client active-address
sui client gas
```

Run these checks before the tutorial. The active environment, active address, and available gas coins must all refer to the same testnet account. The package and object IDs below are fictional, so use them as a structure to adapt rather than commands to run unchanged.

## Join and verify

The core of the tutorial is a practical sequence that follows the membership flow from joining to on-chain verification and reward claim.

### 1. Connect a wallet

Start by connecting a compatible wallet in Sui Wallet or another supported browser extension. For app-based integrations, follow the official [dApp Kit frontend pattern](https://docs.sui.io/getting-started/examples/dapp-kit-frontend) or the [Wallet Standard](https://docs.sui.io/onchain-finance/asset-custody/wallets/wallet-standard). This keeps the first step lightweight so the reader can focus on the membership flow itself.

- Confirm the wallet is set to the intended network.
- Check that the account has enough test SUI for gas.

### 2. Join Octopus Society

Submit the join transaction against the Move module to mint a membership object. The sender is derived from the signer; it should not be passed as an untrusted, separate argument.

- Capture the transaction digest.
- Store the newly created membership object ID.

### 3. Verify membership

Wait for the transaction to become readable, then use the object ID to confirm ownership and inspect membership fields. This avoids treating an accepted submission as immediately indexed state and aligns with how the [Sui object model](https://docs.sui.io/develop/sui-architecture/object-model) exposes object ownership and history.

- Query the object through the CLI.
- Repeat the check with the SDK response.

### 4. Claim the reward

Finish by claiming a reward tied to the membership. This closes the onboarding loop with a concrete outcome.

- Confirm the reward transaction succeeded.
- Review the updated object state after the claim.

## CLI and TypeScript examples

The examples below are for a local script or backend signer. A browser application should build the same `Transaction` and hand it to a connected wallet or dApp kit; it must never receive a private key.

### 1. Join with Sui CLI

**Run the transaction from the terminal**

Use the CLI when you want to validate the contract entry point quickly and inspect the transaction output before wiring the flow into an app.

```bash
sui client call \
 --package <PACKAGE_ID> \
 --module octopus_society \
 --function join \
 --gas-budget 10000000
```

The sender comes from the active CLI address and the Move function receives `TxContext` implicitly. Record the transaction digest, then identify the created membership object from the transaction effects before moving to the next step.

### 2. Verify the membership object

**Check ownership and state**

After the join transaction succeeds, inspect the object directly so the reader can review the same state the app will later consume.

```bash
sui client object <MEMBERSHIP_OBJECT_ID>
```

Confirm that the object type is the expected membership type and that its owner is the active address. The exact fields depend on the package; do not assume a fixed schema from a fictional example.

### 3. Join from TypeScript

**Embed the flow in an app**

This version shows how the same action can be represented from application code using [the current TypeScript PTB pattern](https://docs.sui.io/develop/transactions/ptbs/ts-sdk-ptb-template).

```typescript
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { Transaction } from '@mysten/sui/transactions';

const client = new SuiGrpcClient({
  network: 'testnet',
  baseUrl: 'https://fullnode.testnet.sui.io:443',
});

const tx = new Transaction();

tx.moveCall({
  target: `${packageId}::octopus_society::join`,
  arguments: [],
});

const result = await client.signAndExecuteTransaction({
  signer: keypair,
  transaction: tx,
  include: { effects: true },
});

if (result.$kind === 'FailedTransaction') {
  throw new Error(result.FailedTransaction.status.error?.message);
}

await client.waitForTransaction({ result });
console.log(result.Transaction.digest);
```

This example uses a keypair only because it represents a script or backend. In a browser, construct the transaction but let the user's wallet sign and execute it through [dApp Kit](https://docs.sui.io/getting-started/examples/dapp-kit-frontend).

### 4. Read the object in TypeScript

**Fetch the result and render it in UI**

Use the object ID from the transaction result to fetch the current membership state for an app or game UI. After submission, wait for confirmation before reading indexed state, as described in [the transaction-building guidance](https://docs.sui.io/develop/transactions/ptbs/building-ptb).

```typescript
const { object } = await client.getObject({
  objectId: membershipObjectId,
  include: { json: true },
});

console.log(object.owner);
console.log(object.json);
```

This closes the loop from transaction result to object inspection. JSON is convenient for a demo; production code should use generated BCS bindings when it needs a stable, typed object shape.

## What the reader leaves with

This closing section makes the hand-off to the game-state tutorial explicit.

### Outcome

**Reusable onboarding sample**

By the end of the tutorial, the reader can prepare a testnet account, submit a membership transaction from a trusted signer, wait for indexed state, and inspect the resulting object. Continue to the game-state tutorial to apply the same ownership model to player assets and shared structures.

[Continue to game assets on Sui →](game-assets-on-sui.html)
