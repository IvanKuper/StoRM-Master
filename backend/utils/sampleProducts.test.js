import test from 'node:test'
import assert from 'node:assert'
import addSampleProductsIfEmpty from './sampleProducts.js'
import products from '../data/products.js'

const fakeProduct = (count) => {
  const calls = []
  return {
    calls,
    countDocuments: async () => count,
    insertMany: async (docs) => calls.push(docs),
  }
}
const noAdmin = { findOne: async () => null }

test('fills an empty catalog with the sample products', async () => {
  const Product = fakeProduct(0)
  assert.equal(await addSampleProductsIfEmpty(Product, noAdmin), products.length)
  assert.equal(Product.calls[0].length, products.length)
  assert.ok(Product.calls[0].every((p) => p.user))
})

test('leaves an existing catalog alone', async () => {
  const Product = fakeProduct(3)
  assert.equal(await addSampleProductsIfEmpty(Product, noAdmin), 0)
  assert.equal(Product.calls.length, 0)
})
