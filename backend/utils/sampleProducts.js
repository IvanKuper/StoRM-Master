import mongoose from 'mongoose'
import products from '../data/products.js'

// A fresh database shows the sample catalog instead of an empty shop.
// Only inserts when there are no products, so it never touches real data.
const addSampleProductsIfEmpty = async (Product, User) => {
  if ((await Product.countDocuments()) > 0) return 0
  const admin = await User.findOne({ isAdmin: true })
  const owner = admin ? admin._id : new mongoose.Types.ObjectId()
  await Product.insertMany(products.map((p) => ({ ...p, user: owner })))
  return products.length
}

export default addSampleProductsIfEmpty
