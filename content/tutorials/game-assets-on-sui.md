---
type: tutorial
title: "Game assets on Sui — Tutorial sample (Piotr Oszenda)"
description: "Hands-on tutorial showing how a game backend and client can model octopus identities, unique assets, communal structures, and transaction flows on Sui."
eyebrow: "Developer documentation sample"
primary_link_href: "#what-this-tutorial-demonstrates"
primary_link_label: "Read tutorial"
secondary_link_href: "octopus-society-on-sui.html"
secondary_link_label: "Start with membership onboarding"
hero_stats: "Sui blockchain | Game backend | Move objects | Transaction flows"
hero_panel_id: "game-assets-proof-title"
hero_panel_label: "Build status"
hero_panel_style: "default"
hero_panel_items: "Markdown source::game-assets-on-sui.md | Generated HTML::Built locally before publication. | Checked output::Structure follows the API tutorial baseline and local links are validated in CI."
footer_tag: "Built from Markdown source"
uses_mermaid: false
accent_sections: "what-this-tutorial-demonstrates|overview|architecture-at-a-glance|before-you-start|define-the-core-game-objects|model-shared-structures|connect-the-api-layer|follow-a-transaction-flow|what-the-reader-leaves-with"
spaced_articles: false
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

Imagine you are building a game where each player is one octopus living among other octopi, trading shells and pebbles, tending communal mussel farms, and building a reputation in a shared tide pool.

In a traditional Web2 stack, that world is often represented as rows in a studio-controlled database. The octopus identity, the shells it owns, and the farm it helps maintain may all be stored as records the developer controls directly.

On Sui, those parts of the world can be modeled as on-chain objects defined in Move. The player can hold an octopus object in a wallet, own unique shells and pebbles directly, and interact with shared structures through explicit transaction logic.

The examples stay intentionally simplified and focus on object shape, transaction flow, and system boundaries rather than full production concerns such as sponsored transactions, indexing pipelines, retries, observability, or custody design.

## Architecture at a glance

This section maps the application flow before the tutorial moves into object and transaction examples.

### Client, backend, wallet, and network

**Game client · Backend service · Wallet · Sui network**

One common Sui integration pattern still follows a familiar structure: the backend validates request context and prepares transaction data, while signing happens in a wallet or another explicitly trusted signer.

- The game client calls your API, for example `POST /api/octopus/v1/shells` or `POST /api/octopus/v1/farms/{farmId}/harvest`.
- Your backend validates the request, resolves current on-chain object inputs, and builds a transaction payload.
- The payload is returned to the client for [wallet approval](https://docs.sui.io/develop/transactions/transaction-auth/auth-overview), or routed to an authorized signer when the product flow requires service-controlled minting.
- The signed transaction is submitted to the Sui network.
- Your backend stores transaction digests, reads effects, and reconciles local metadata with the resulting on-chain object state.

This can keep the API familiar for application developers while making it clear that ownership, transfer, and mutation ultimately follow the Sui object model.

## Before you start

This section lists the minimum setup for following the examples safely.

### Requirements

**Requirements · Wallet · Endpoint · Package · Indexing**

Before you begin, make sure you have:

- A Sui wallet on testnet with SUI for gas, unless your flow uses sponsored transactions.
- A current Sui full node or provider endpoint.
- A published Move package for your octopus, shell, pebble, and farm types.
- A backend service that can build transaction payloads and track transaction results.

Replace `packageId`, `octopusObjectId`, `shellObjectId`, `farmObjectId`, and wallet addresses with values from your environment. Keep private keys, admin capabilities, and RPC secrets out of client code and out of source control.

The REST-shaped endpoints in this sample are fictional orchestration endpoints, not Sui APIs. A backend may prepare a transaction, but a player-owned action still needs the player’s wallet approval unless the product explicitly uses sponsorship or a trusted service signer.

## Define the core game objects

This section introduces the main owned objects in the model.

### Octopus identity and unique belongings

**Smart contract logic · Identity object · Unique belongings**

In this game, the first important object is not a weapon. It is the octopus itself. That object represents the player’s identity in the society, while shells and pebbles are unique belongings the octopus can own, trade, and carry between interactions.

On Sui, owned objects need a [`UID`](https://docs.sui.io/develop/sui-architecture/object-model) field and the [`key`](https://docs.sui.io/develop/objects/) ability. If you want an object to be transferable with [`transfer::public_transfer`](https://docs.sui.io/references/framework/sui_sui/transfer), it must also have the `store` ability.

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

    public fun mint_octopus(name: vector<u8>, ctx: &mut TxContext) {
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

This section shows where a game world needs shared state rather than only player-owned state.

### Farms, markets, and communal state

**Shared objects · Cooperative mechanics · Mutation rules**

Not every game object should belong to one player. A mussel farm, market stall, or public bulletin stone may be a shared structure that multiple octopi can interact with under controlled rules.

Shared objects are useful when many users need to read or mutate the same state. They should still have narrow mutation paths so each transaction expresses a clear game rule rather than unrestricted writes.

```move
public struct MusselFarm has key {
    id: UID,
    mussel_count: u64,
    last_harvest_epoch: u64,
}
```

A shared farm could be harvested by eligible players, replenished according to game logic, or affected by cooperative tasks. The important design choice is to make the mutation rule explicit in Move instead of hiding it only in backend code.

## Connect the API layer

This section explains how a familiar API can orchestrate game actions without pretending to be the source of truth.

### Backend endpoints and transaction preparation

**API orchestration · Transaction building · Trusted boundaries**

Many teams still want a backend API even when game assets live on-chain. That is reasonable, as long as the API is treated as an orchestration layer rather than a replacement for object ownership.

- `POST /api/octopus/v1/octopi` can prepare an octopus creation flow.
- `POST /api/octopus/v1/shells` can prepare shell minting inputs.
- `POST /api/octopus/v1/farms/{farmId}/harvest` can resolve the current farm object and build a harvest transaction.

The backend can validate request context, enforce off-chain business rules, and return the transaction bytes or arguments the client needs for signing. It should not silently impersonate the player for player-owned actions.

## Follow a transaction flow

This section connects the model to an end-to-end example.

### From API request to object read

**Transaction flow · Wallet approval · Result handling**

A typical player-owned flow might look like this:

1. The client requests a harvest or trade action from the backend.
2. The backend validates the request and builds a transaction.
3. The client asks the wallet to sign and submit it.
4. The application stores the transaction digest and waits for confirmation.
5. The client or backend reads the resulting object state and updates the game UI.

```typescript
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
```

The exact signing path depends on your product. A browser game should usually hand the transaction to the player’s wallet, while backend-controlled signing should be reserved for explicit service-owned flows.

## What the reader leaves with

This closing section makes the design takeaway explicit.

### Outcome

**Reusable game-state tutorial**

By the end of the tutorial, the reader has a compact model for representing a player identity, unique belongings, shared structures, and transaction flow boundaries on Sui. The key point is not the octopus theme itself, but how the object model supports ownership, mutation, and coordination in a game-oriented system.
