// End-to-end API test: starts the real server against a throwaway database.
// Needs a MongoDB: TEST_MONGO_URI (default mongodb://127.0.0.1:27017). Run: npm test
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import mongoose from 'mongoose'

const MONGO_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017'
const DB_NAME = `storm_test_${process.pid}`
const PORT = 5600 + (process.pid % 300)
const BASE = `http://127.0.0.1:${PORT}/api`

let server
const api = async (path, { method = 'GET', body, token } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body && JSON.stringify(body),
  })
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  return { status: res.status, data }
}

const register = async (name) =>
  (
    await api('/users', {
      method: 'POST',
      body: { name, email: `${name}-${DB_NAME}@example.com`, password: 'Test#pass1' },
    })
  ).data.token

let products, alice, bob

before(async () => {
  server = spawn(process.execPath, ['backend/server.js'], {
    env: { ...process.env, MONGO_URI, DB_NAME, PORT: String(PORT), JWT_SECRET: 'test-secret', NODE_ENV: 'test', PAYPAL_CLIENT_ID: '', PAYPAL_APP_SECRET: '' },
    stdio: 'ignore',
  })
  // Wait for the server and the sample catalog it adds to an empty database.
  for (let i = 0; i < 60; i++) {
    try {
      const r = await api('/products')
      if (r.status === 200 && r.data.products.length) {
        products = r.data.products
        break
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 250))
  }
  assert.ok(products, 'server did not start with sample products')
  alice = await register('alice')
  bob = await register('bob')
})

after(async () => {
  server.kill()
  await mongoose.connect(MONGO_URI, { dbName: DB_NAME })
  await mongoose.connection.db.dropDatabase()
  await mongoose.disconnect()
})

const byName = (name) => products.find((p) => p.name.includes(name))
const order = (items, token = alice) =>
  api('/orders', {
    method: 'POST',
    token,
    body: {
      orderItems: items,
      shippingAddress: { address: 'Test 1', city: 'Haifa', postalCode: '1', country: 'IL' },
      paymentMethod: 'PayPal',
    },
  })

test('sample catalog has 7 products', () => {
  assert.equal(products.length, 7)
})

test('order total uses database prices, not the browser price', async () => {
  const p = products.find((x) => x.price === 29.99)
  const r = await order([{ product: p._id, qty: 2, price: 0.01, name: 'x' }])
  assert.equal(r.status, 201)
  assert.equal(r.data.orderItems[0].price, 29.99)
  // 59.98 items, $10 shipping (under $100), 15% tax 9.00 -> 78.98
  assert.equal(r.data.shippingPrice, 10)
  assert.equal(r.data.taxPrice, 9)
  assert.equal(r.data.totalPrice, 78.98)
})

test('free shipping over $100', async () => {
  const p = products.find((x) => x.price === 59.99)
  const r = await order([{ product: p._id, qty: 2 }])
  assert.equal(r.status, 201)
  // 119.98 items, free shipping, tax 18.00 -> 137.98
  assert.equal(r.data.shippingPrice, 0)
  assert.equal(r.data.totalPrice, 137.98)
})

test('rejects bad quantities, out of stock and unknown products', async () => {
  const p = products.find((x) => x.countInStock === 7)
  const out = products.find((x) => x.countInStock === 0)
  assert.equal((await order([{ product: p._id, qty: 8 }])).status, 400)
  assert.equal((await order([{ product: p._id, qty: 4 }, { product: p._id, qty: 4 }])).status, 400)
  assert.equal((await order([{ product: p._id, qty: 0 }])).status, 400)
  assert.equal((await order([{ product: out._id, qty: 1 }])).status, 400)
  assert.equal((await order([{ product: 'nope', qty: 1 }])).status, 400)
  assert.equal((await order([{ product: new mongoose.Types.ObjectId().toString(), qty: 1 }])).status, 400)
  assert.equal((await order([])).status, 400)
})

test('needs a login', async () => {
  assert.equal((await api('/orders/myorders')).status, 401)
  assert.equal((await order([{ product: products[0]._id, qty: 1 }], 'bad-token')).status, 401)
})

test('another user cannot see or pay my order', async () => {
  const mine = (await order([{ product: products[0]._id, qty: 1 }])).data
  assert.equal((await api(`/orders/${mine._id}`, { token: bob })).status, 404)
  assert.equal((await api(`/orders/${mine._id}/pay`, { method: 'PUT', token: bob, body: { demo: true } })).status, 404)
  assert.equal((await api(`/orders/${mine._id}`, { token: alice })).status, 200)
  const bobs = (await api('/orders/myorders', { token: bob })).data
  assert.equal(bobs.length, 0)
})

test('demo payment pays once', async () => {
  const mine = (await order([{ product: products[0]._id, qty: 1 }])).data
  const pay = (body) => api(`/orders/${mine._id}/pay`, { method: 'PUT', token: alice, body })
  assert.equal((await pay({ id: 'FAKE' })).status, 400)
  const paid = await pay({ demo: true })
  assert.equal(paid.status, 200)
  assert.equal(paid.data.isPaid, true)
  assert.equal(paid.data.paymentResult.id, `DEMO-${mine._id}`)
  assert.equal((await pay({ demo: true })).status, 400)
})

test('admin-only routes refuse a normal user', async () => {
  assert.equal((await api('/orders', { token: alice })).status, 401)
  assert.equal((await api('/users', { token: alice })).status, 401)
  assert.equal((await api(`/products/${products[0]._id}`, { method: 'DELETE', token: alice })).status, 401)
})

test('login: right password works, wrong one is refused', async () => {
  const email = `alice-${DB_NAME}@example.com`
  assert.equal((await api('/users/login', { method: 'POST', body: { email, password: 'Test#pass1' } })).status, 200)
  assert.equal((await api('/users/login', { method: 'POST', body: { email, password: 'nope' } })).status, 401)
})

test('admin can delete a product and a user', async () => {
  await mongoose.connect(MONGO_URI, { dbName: DB_NAME })
  await mongoose.connection.db
    .collection('users')
    .updateOne({ email: `bob-${DB_NAME}@example.com` }, { $set: { isAdmin: true } })
  await mongoose.disconnect()
  const victim = products.find((x) => x.countInStock === 0)
  assert.equal((await api(`/products/${victim._id}`, { method: 'DELETE', token: bob })).status, 200)
  assert.equal((await api(`/products/${victim._id}`)).status, 404)
  const temp = await register('temp')
  const users = (await api('/users', { token: bob })).data
  const tempUser = users.find((u) => u.email.startsWith('temp-'))
  assert.equal((await api(`/users/${tempUser._id}`, { method: 'DELETE', token: bob })).status, 200)
  assert.equal((await api('/orders/myorders', { token: temp })).status, 401)
})
