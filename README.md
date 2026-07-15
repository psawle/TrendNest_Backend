# TrendNest Backend

## Local MongoDB

Checkout and order cancellation use MongoDB transactions so that stock, cart, and
order records are changed together. Transactions require a replica set, even for
local development. Start the included single-node replica set:

```bash
docker compose up -d
```

Set your local environment value to include the replica-set name:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/trendnest?replicaSet=rs0
```

The application checks this at startup and exits with a clear error if it is
connected to standalone MongoDB. For production, use a managed replica set (for
example MongoDB Atlas) or an intentionally configured self-managed replica set.

## Money values

All API and database money fields use integer paise: `pricePaise` for products
and order items, and `subtotalPaise` for orders. For example, ₹199.99 is sent
as `19999`; format it as currency only in the client.

If the database already contains data from the former decimal `price`/`subtotal`
format, back it up and run this once before starting the new API version:

```bash
npm run migrate:money
```

## Integration tests

The integration suite uses a separate, randomly named database and requires a
MongoDB replica set because it tests checkout transactions. Point it at a safe
test or local replica-set URI, then run:

```bash
TEST_MONGODB_URI=mongodb://127.0.0.1:27017/trendnest?replicaSet=rs0 npm test
```
