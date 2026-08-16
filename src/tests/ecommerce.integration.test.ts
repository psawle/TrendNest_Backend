import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import { after, before, beforeEach, test } from "node:test";

const sourceUri = process.env.TEST_MONGODB_URI ?? process.env.MONGODB_URI;
if (!sourceUri) {
  throw new Error("Set TEST_MONGODB_URI to a MongoDB replica-set URI before running integration tests.");
}

// Never use the configured database directly: each run gets an isolated test database.
const testUri = new URL(sourceUri);
testUri.pathname = `/trendnest_test_${randomUUID().replaceAll("-", "")}`;
process.env.MONGODB_URI = testUri.toString();
process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-that-is-at-least-32-characters";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-that-is-at-least-32-characters";

const [
  { default: app },
  { connectDB },
  mongooseModule,
  { User },
  { Product },
  { CartItem },
  { Order },
  { RefreshSession },
] = await Promise.all([
  import("../app.js"),
  import("../config/db.js"),
  import("mongoose"),
  import("../modules/users/user.model.js"),
  import("../modules/products/product.model.js"),
  import("../modules/cart/cartItem.model.js"),
  import("../modules/orders/order.model.js"),
  import("../modules/auth/refreshSession.model.js"),
]);

let server: Server;
let baseUrl: string;

type ApiResult = { response: Response; body: any };

async function api(path: string, init: RequestInit = {}): Promise<ApiResult> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("content-type", "application/json");
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  const text = await response.text();
  return { response, body: text ? JSON.parse(text) : undefined };
}

function refreshCookie(response: Response) {
  const getSetCookie = (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const cookies = getSetCookie
    ? getSetCookie.call(response.headers)
    : [response.headers.get("set-cookie") ?? ""];
  const cookie = cookies.find((value) => value.startsWith("refreshToken="));
  assert.ok(cookie, "Expected a refresh-token cookie");
  return cookie.split(";", 1)[0];
}

async function createUser(role: "customer" | "admin" = "customer") {
  const email = `${role}-${randomUUID()}@example.test`;
  const registration = await api("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Test User", email, password: "correct-horse-battery-staple" }),
  });
  assert.equal(registration.response.status, 201);
  if (role === "admin") await User.updateOne({ email }, { $set: { role: "admin" } });

  const login = await api("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: "correct-horse-battery-staple" }),
  });
  assert.equal(login.response.status, 200);
  return { accessToken: login.body.accessToken as string, refreshCookie: refreshCookie(login.response) };
}

async function createProduct(adminToken: string, stock = 10) {
  const result = await api("/api/v1/products", {
    method: "POST",
    headers: { authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      title: "Test jacket",
      description: "A product used by the integration test suite.",
      price: 199.99,
      category: "clothing",
      image: "https://example.test/jacket.jpg",
      stock,
    }),
  });
  assert.equal(result.response.status, 201);
  return result.body.product as { id: string };
}

before(async () => {
  await connectDB();
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

beforeEach(async () => {
  await Promise.all([
    RefreshSession.deleteMany({}),
    CartItem.deleteMany({}),
    Order.deleteMany({}),
    Product.deleteMany({}),
    User.deleteMany({}),
  ]);
});

after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await mongooseModule.connection.dropDatabase();
  await mongooseModule.disconnect();
});

test("product administration requires an authenticated admin", async () => {
  const payload = JSON.stringify({
    title: "Blocked product",
    description: "This product must be created by an administrator.",
    price: 1,
    category: "clothing",
    image: "https://example.test/product.jpg",
  });
  const unauthenticated = await api("/api/v1/products", { method: "POST", body: payload });
  assert.equal(unauthenticated.response.status, 401);

  const customer = await createUser();
  const forbidden = await api("/api/v1/products", {
    method: "POST",
    headers: { authorization: `Bearer ${customer.accessToken}` },
    body: payload,
  });
  assert.equal(forbidden.response.status, 403);
});

test("invalid resource IDs return validation errors", async () => {
  const product = await api("/api/v1/products/not-an-object-id");
  assert.equal(product.response.status, 400);
  assert.equal(product.body.error.code, "INVALID_ID");

  const customer = await createUser();
  const cart = await api("/api/v1/cart/not-an-object-id", {
    method: "PATCH",
    headers: { authorization: `Bearer ${customer.accessToken}` },
    body: JSON.stringify({ quantity: 1 }),
  });
  assert.equal(cart.response.status, 400);
  assert.equal(cart.body.error.code, "VALIDATION_ERROR");
});

test("concurrent checkouts cannot oversell stock", async () => {
  const admin = await createUser("admin");
  const product = await createProduct(admin.accessToken, 1);
  const firstCustomer = await createUser();
  const secondCustomer = await createUser();

  for (const customer of [firstCustomer, secondCustomer]) {
    const add = await api("/api/v1/cart", {
      method: "POST",
      headers: { authorization: `Bearer ${customer.accessToken}` },
      body: JSON.stringify({ productId: product.id, quantity: 1 }),
    });
    assert.equal(add.response.status, 201);
  }

  const results = await Promise.all([firstCustomer, secondCustomer].map((customer) => api("/api/v1/orders/checkout", {
    method: "POST",
    headers: { authorization: `Bearer ${customer.accessToken}` },
  })));
  assert.deepEqual(results.map((result) => result.response.status).sort(), [201, 400]);
  assert.equal(await Order.countDocuments(), 1);
  assert.equal((await Product.findById(product.id))!.stock, 0);
});

test("cancelling a pending order restores stock", async () => {
  const admin = await createUser("admin");
  const product = await createProduct(admin.accessToken, 5);
  const customer = await createUser();
  await api("/api/v1/cart", {
    method: "POST",
    headers: { authorization: `Bearer ${customer.accessToken}` },
    body: JSON.stringify({ productId: product.id, quantity: 2 }),
  });
  const checkout = await api("/api/v1/orders/checkout", {
    method: "POST",
    headers: { authorization: `Bearer ${customer.accessToken}` },
  });
  assert.equal(checkout.response.status, 201);
  assert.equal((await Product.findById(product.id))!.stock, 3);

  const cancellation = await api(`/api/v1/orders/${checkout.body.order.id}/cancel`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${customer.accessToken}` },
  });
  assert.equal(cancellation.response.status, 200);
  assert.equal(cancellation.body.order.status, "cancelled");
  assert.equal((await Product.findById(product.id))!.stock, 5);
});

test("a refresh token is single-use after rotation", async () => {
  const customer = await createUser();
  const firstRefresh = await api("/api/v1/auth/refresh", {
    method: "POST",
    headers: { cookie: customer.refreshCookie },
  });
  assert.equal(firstRefresh.response.status, 200);
  const rotatedCookie = refreshCookie(firstRefresh.response);

  const replay = await api("/api/v1/auth/refresh", {
    method: "POST",
    headers: { cookie: customer.refreshCookie },
  });
  assert.equal(replay.response.status, 401);

  const rotatedRefresh = await api("/api/v1/auth/refresh", {
    method: "POST",
    headers: { cookie: rotatedCookie },
  });
  assert.equal(rotatedRefresh.response.status, 200);
});

test("soft deletion clears carts while preserving historical orders", async () => {
  const admin = await createUser("admin");
  const product = await createProduct(admin.accessToken, 3);
  const buyer = await createUser();
  await api("/api/v1/cart", {
    method: "POST",
    headers: { authorization: `Bearer ${buyer.accessToken}` },
    body: JSON.stringify({ productId: product.id, quantity: 1 }),
  });
  const checkout = await api("/api/v1/orders/checkout", {
    method: "POST",
    headers: { authorization: `Bearer ${buyer.accessToken}` },
  });
  assert.equal(checkout.response.status, 201);

  const shopper = await createUser();
  const addToCart = await api("/api/v1/cart", {
    method: "POST",
    headers: { authorization: `Bearer ${shopper.accessToken}` },
    body: JSON.stringify({ productId: product.id, quantity: 1 }),
  });
  assert.equal(addToCart.response.status, 201);
  const deletion = await api(`/api/v1/products/${product.id}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${admin.accessToken}` },
  });
  assert.equal(deletion.response.status, 204);

  assert.equal(await CartItem.countDocuments({ productId: product.id }), 0);
  assert.equal((await Product.findById(product.id))!.isActive, false);
  assert.equal((await Order.findById(checkout.body.order.id))!.items[0].pricePaise, 19999);
});
