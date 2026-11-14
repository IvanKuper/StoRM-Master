import test from 'node:test'
import assert from 'node:assert/strict'
import calcPrices from './calcPrices.js'
import { checkPayPalOrder } from './paypal.js'

test('small order pays $10 shipping and 15% tax', () => {
  assert.deepEqual(calcPrices([{ price: 29.99, qty: 2 }]), {
    itemsPrice: 59.98,
    shippingPrice: 10,
    taxPrice: 9,
    totalPrice: 78.98,
  })
})

test('order over $100 ships free', () => {
  assert.deepEqual(calcPrices([{ price: 89.99, qty: 1 }, { price: 19.99, qty: 1 }]), {
    itemsPrice: 109.98,
    shippingPrice: 0,
    taxPrice: 16.5,
    totalPrice: 126.48,
  })
})

test('exactly $100 still pays shipping', () => {
  assert.equal(calcPrices([{ price: 100, qty: 1 }]).shippingPrice, 10)
  assert.equal(calcPrices([{ price: 100.01, qty: 1 }]).shippingPrice, 0)
})

const paid = (value, currency_code = 'USD', status = 'COMPLETED') => ({
  status,
  purchase_units: [{ amount: { currency_code, value } }],
})

test('PayPal check accepts a full payment', () => {
  assert.equal(checkPayPalOrder(paid('126.48'), { totalPrice: 126.48 }), null)
})

test('PayPal check rejects a lower amount, other currency or unfinished payment', () => {
  const order = { totalPrice: 126.48 }
  assert.match(checkPayPalOrder(paid('0.01'), order), /does not match/)
  assert.match(checkPayPalOrder(paid('126.48', 'EUR'), order), /currency/)
  assert.match(checkPayPalOrder(paid('126.48', 'USD', 'APPROVED'), order), /not completed/)
  assert.match(checkPayPalOrder({ status: 'COMPLETED' }, order), /currency/)
  const pending = paid('126.48')
  pending.purchase_units[0].payments = { captures: [{ status: 'PENDING' }] }
  assert.match(checkPayPalOrder(pending, order), /pending/)
})
