---
type: tutorial
title: "Build an octopus society on Sui — Piotr Oszenda"
description: "Hands-on tutorial showing how a game backend and client can model octopus identities, unique assets, communal structures, and transaction flows on Sui."
eyebrow: "Developer documentation sample"
primary_link_href: "#what-this-tutorial-demonstrates"
primary_link_label: "Read tutorial"
secondary_link_href: "octopus-society-on-sui.html"
secondary_link_label: "Start with membership onboarding"
hero_stats: "Sui blockchain | Game backend | Move objects | Transaction flows"
hero_panel_id: "game-assets-proof-title"
hero_panel_label: "Use this guide"
hero_panel_style: "default"
hero_panel_items: "Scope::A fictional Sui game with player-owned and shared objects. | Prerequisites::A testnet wallet, a published package, and a Sui provider endpoint. | Outcome::Model ownership, shared state, and wallet-signed transactions."
footer_tag: "Built from Markdown source"
uses_mermaid: false
accent_sections: "what-this-tutorial-demonstrates|overview|architecture-at-a-glance|before-you-start|define-the-core-game-objects|model-shared-structures|connect-the-api-layer|follow-a-transaction-flow|outcome"
output: "game-assets-on-sui.html"
---

# Build an octopus society on Sui

A technical tutorial that uses a fictional game world to explain how Move modules, wallet signing, [Sui objects](https://docs.sui.io/develop/sui-architecture/object-model), shared objects, and transaction flows can support game logic on Sui.

## What this tutorial demonstrates

- **A game-oriented object model on Sui.** The reader sees how identities, assets, and communal structures can map to owned and shared objects.
- **A separation between API orchestration and wallet signing.** The tutorial keeps backend, client, and signer responsibilities distinct.
- **A practical flow from model to transaction.** The examples connect object design, API endpoints, and transaction submission in one sequence.

## Overview

This tutorial uses a fictional octopus society to explain how game assets and shared state can be represented on Sui.

**Tutorial sample · Fictional game backend**

Imagine a game where each player controls an octopus, owns shells and pebbles, and helps tend a communal mussel farm. In a traditional Web2 stack, those are studio-controlled database records. On Sui, they can be on-chain objects: player identities and belongings can be address-owned, while the farm can be shared through explicit Move rules.

The examples focus on object shape, transaction flow, and system boundaries rather than full production concerns such as sponsored transactions, indexing pipelines, retries, observability, or custody design.

## Architecture at a glance

### Client, backend, wallet, and network

**Game client · Backend service · Wallet · Sui network**

One common Sui integration pattern still follows a familiar structure: the backend validates request context and prepares transaction data, while signing happens in a wallet or another explicitly trusted signer.

- The game client calls your API, for example `POST /api/octopus/v1/shells` or `POST /api/octopus/v1/farms/{farmId}/harvest`.
- Your backend validates the request and resolves the current on-chain object inputs.
- For a player-owned action, it returns the approved inputs or an unsigned transaction for [wallet approval](https://docs.sui.io/develop/transactions/transaction-auth/auth-overview). For a sponsored or service-owned action, an authorized server-side signer executes the transaction instead.
- The signed transaction is submitted to the Sui network.
- Your backend stores transaction digests, reads effects, and reconciles local metadata with the resulting on-chain object state.

This can keep the API familiar for application developers while making it clear that ownership, transfer, and mutation ultimately follow the Sui object model.

## Before you start

### Requirements

**Requirements · Wallet · Endpoint · Package · Indexing**

Before you begin, make sure you have:

- A Sui wallet on testnet with SUI for gas, unless your flow uses sponsored transactions.
- A current Sui full node or provider endpoint.
- A published Move package for your octopus, shell, pebble, and farm types.
- A backend service that can build transaction payloads and track transaction results.

Replace `packageId`, `octopusObjectId`, `shellObjectId`, `farmObjectId`, and wallet addresses with values from your environment. Keep private keys, admin capabilities, and RPC secrets out of client code and out of source control.

The REST-shaped endpoints in this sample are fictional orchestration endpoints, not Sui APIs. A backend can prepare player-owned actions, but the player’s wallet sets the sender, selects gas, and signs. Sponsored or service-owned flows need an explicitly authorized server-side signer.

**Terms used here:** an *address-owned object* belongs to one address; a *shared object* can be referenced by many users; a *PTB* is the transaction that groups the Move calls; and `TxContext` identifies the current transaction and sender in Move.

## Define the core game objects

### Octopus identity and unique belongings

**Smart contract logic · Identity object · Unique belongings**

In this game, the first important object is not a weapon. It is the octopus itself. That object represents the player’s identity in the society, while shells and pebbles are unique belongings the octopus can own, trade, and carry between interactions.

On Sui, owned objects need a [`UID`](https://docs.sui.io/develop/sui-architecture/object-model) field and the [`key`](https://docs.sui.io/develop/objects/) ability. If you want an object to be transferable with [`transfer::public_transfer`](https://docs.sui.io/references/framework/sui_sui/transfer), it must also have the `store` ability. Use `public_transfer` only when any holder may transfer the object; use module-controlled transfer rules when the game needs tighter restrictions.

```move
module octopus_society::assets {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    public struct Octopus has key, store {
        id: UID,
        name: vector<u8>,
        reputation: u64,
    }

    public struct Shell has key, store {
        id: UID,
        color: vector<u8>,
        rarity: u8,
    }

    public entry fun mint_octopus(name: vector<u8>, ctx: &mut TxContext) {
        let octopus = Octopus {
            id: object::new(ctx),
            name,
            reputation: 0,
        };

        transfer::public_transfer(octopus, tx_context::sender(ctx));
    }
}
```

This example stays intentionally small. In a production package, you would usually add clearer error handling, capability checks, and a more explicit model for progression and balance.

## Model shared structures

### Farms, markets, and communal state

**Shared objects · Cooperative mechanics · Mutation rules**

Not every game object should belong to one player. A mussel farm, market stall, or public bulletin stone may be a shared structure that multiple octopi can interact with under controlled rules.

Shared objects are useful when many users need to read or mutate the same state. They use consensus ordering, so reserve them for genuinely communal state and keep their mutation paths narrow.

```move
use sui::object::{Self, UID};
use sui::transfer;
use sui::tx_context::TxContext;

public struct MusselFarm has key {
    id: UID,
    mussel_count: u64,
    last_harvest_epoch: u64,
}

fun init(ctx: &mut TxContext) {
    transfer::share_object(MusselFarm {
        id: object::new(ctx),
        mussel_count: 0,
        last_harvest_epoch: 0,
    });
}
```

`transfer::share_object` is the step that makes this `key` object shared. A production package would then expose a narrowly scoped `harvest` entry function, with eligibility and state-transition checks in Move rather than only in backend code.

## Connect the API layer

### Backend endpoints and transaction preparation

**API orchestration · Transaction building · Trusted boundaries**

Many teams still want a backend API even when game assets live on-chain. That is reasonable, as long as the API is treated as an orchestration layer rather than a replacement for object ownership.

- `POST /api/octopus/v1/octopi` can prepare an octopus creation flow.
- `POST /api/octopus/v1/shells` can prepare shell minting inputs.
- `POST /api/octopus/v1/farms/{farmId}/harvest` can resolve the current farm object and build a harvest transaction.

For player-owned actions, the backend can validate request context and return the allowed object IDs and pure-value inputs; the browser then builds and submits the transaction through the wallet. For sponsored or service-owned actions, the backend can build and sign only after applying explicit authorization. It should not silently impersonate the player.

## Follow a transaction flow

### From API request to object read

**Transaction flow · Wallet approval · Result handling**

A typical player-owned flow might look like this:

1. The client requests a harvest or trade action from the backend.
2. The backend validates the request and returns the current farm and octopus object IDs.
3. The client asks the wallet to sign and submit it.
4. The application stores the transaction digest and waits for confirmation.
5. The client or backend reads the resulting object state and updates the game UI.

The following is a backend or local-test-script fragment. It assumes that `client`, `keypair`, `packageId`, `farmObjectId`, and `octopusObjectId` are configured from your environment.

```typescript
import { Transaction } from '@mysten/sui/transactions';

// Backend or local test script only: load keypair from a server-side secret.
const tx = new Transaction();

tx.moveCall({
  target: `${packageId}::farm::harvest`,
  arguments: [tx.object(farmObjectId), tx.object(octopusObjectId)],
});

const result = await client.signAndExecuteTransaction({
  signer: keypair,
  transaction: tx,
  include: { effects: true },
});

await client.waitForTransaction({ result });
console.log(result.Transaction.digest);
```

For a browser game, pass the same `Transaction` to the player’s wallet instead of using a keypair. After `waitForTransaction`, read the farm and octopus objects again and update the UI from the confirmed state.

## Outcome

You have a model for player identities, unique belongings, shared structures, and transaction boundaries on Sui. The same pattern applies to other game themes where ownership, mutation, and coordination belong on-chain.
