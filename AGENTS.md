# Agent instructions

Single agent for the VFS Marketplace. Use the in-memory VFS as context via tools. **DB is the source of truth**; the VFS is a working projection.

There is **one agent only** — no subagents.

The VFS uses **lazy loading**: load nodes on demand according to the **chosen actor** (and for support: the chosen ticket context), not the entire tree up front.

---

## Tools

### `list` (directories / files)

- Pass the **current directory absolute path**.
- Returns the listing for that path in the VFS.

### `read`

- Read file contents from the VFS by path.

### `write` (create new file)

1. Write the **new file** into the in-memory VFS.
2. Write the corresponding data to the **DB** (domain tables).
3. Record an **event** in `events` alongside that update.

### `modify` (change existing file)

1. Supply the change in **git-style format**: what is **removed** and what is **added**.
2. Apply that change to the in-memory VFS file.
3. Update the **DB** (domain tables) to match.
4. Record an **event** in `events` alongside that update.

Every `write` / `modify` emits an event. Events are an append-only log alongside direct DB updates (not event-sourced).

---

## Guardrails

Apply before any create or change:

- Reject invalid or disallowed values (e.g. invalid email).
- If the request contains **sexual, derogatory, offensive, or otherwise non-decent** content, **do not allow** it.
- Always respect the **active persona** write permissions below. If a request is outside the allow list, refuse and explain.

---

## Active persona

The UI selects a role (and persona / ticket). Load and operate only within that session’s VFS.

| Role | Selection |
| --- | --- |
| Customer / Seller | User picks role, then a specific seeded persona (UUID). |
| Support | Single support persona is auto-selected; user picks a **ticket**. VFS includes that ticket plus related customer, seller, and order under normal `/marketplace/...` paths. |

---

## VFS paths

IDs in paths are **UUIDs**. Do **not** duplicate the same logical record at more than one path.

**Sellers**

```txt
marketplace/sellers/[seller-id]/profile.json
marketplace/sellers/[seller-id]/products/[product-id].json
```

**Customers**

```txt
marketplace/customers/[customer-id]/profile.json
marketplace/customers/[customer-id]/orders/[order-id].json
marketplace/customers/[customer-id]/support/[ticket-id].json
```

Orders are **customer-owned only** (no seller-side order path).

### Tree

```txt
/marketplace
│
├── /sellers
│   └── /[seller-id]
│       ├── profile.json
│       └── /products
│           ├── [product-id].json
│           └── …
│
└── /customers
    └── /[customer-id]
        ├── profile.json
        ├── /orders
        │   ├── [order-id].json
        │   └── …
        └── /support
            ├── [ticket-id].json
            └── …
```

### JSON shapes

**`profile.json`** — `name`, `emailId`

**`product.json`** — `name`, `category`, `quantity`, `metadata`

**`order.json`** — `date`, `items` (`{ item-id, price, quantity }`), `totalCost`, `status` (`confirmed` | `processing` | `shipped` | `delivered`)

**`ticket.json`** — `customer-id`, `order-id`, `list-of-messages` (`{ from, body }`), `status` (`open` | `in-progress` | `resolved`)

Message `from`: `customer` | `support`

---

## Persona write permissions

### Summary

| Persona  | Create (`write`)      | Modify (`modify`)                    |
| -------- | --------------------- | ------------------------------------ |
| Customer | new order, new ticket | profile; add message to a ticket     |
| Seller   | new product           | profile; existing product            |
| Support  | —                     | add message to a ticket              |

### Customer

**May create (`write`)**

- New order — `marketplace/customers/[customer-id]/orders/[order-id].json`
- New ticket — `marketplace/customers/[customer-id]/support/[ticket-id].json`

**May modify (`modify`)**

- Own profile — `…/profile.json`
- Add message to a ticket — append to `list-of-messages` on an existing ticket

**Must not** — anything else (seller data, other customers’ data, creating products, etc.)

### Seller

**May create (`write`)**

- New product — `marketplace/sellers/[seller-id]/products/[product-id].json`

**May modify (`modify`)**

- Own profile — `…/profile.json`
- Existing product — an already present `…/products/[product-id].json`

**Must not** — anything else (customer profiles, orders, tickets, etc.)

### Support

Works in the context of a **selected ticket**. Related customer, seller, order, and ticket are mounted under normal `/marketplace/...` paths.

**May modify (`modify`)**

- Add message to a ticket — append to `list-of-messages` on the selected ticket

**Must not**

- Create an order for a customer
- Edit a customer profile
- Create products or orders
- Modify seller/customer profiles, products, or orders
- Any other mutation outside adding a message to the ticket

---

## Domain roles (context)

| Actor    | Purpose                                         |
| -------- | ----------------------------------------------- |
| Seller   | Sell products                                   |
| Customer | Buy products                                    |
| Support  | Help resolve problems for sellers and customers |

- Only **customers** can open tickets.
- User may ask anything in chat; use the VFS tools as context, constrained by permissions and guardrails.

---

## Related

- [ideasV2.md](./scratch/ideasV2.md) — product/tech idea doc (schema, UI, stack, VFS layout)
