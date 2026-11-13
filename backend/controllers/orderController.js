import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import Order from '../models/orderModel.js'
import Product from '../models/productModel.js'
import calcPrices from '../utils/calcPrices.js'
import { getPayPalOrder, checkPayPalOrder } from '../utils/paypal.js'

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod } = req.body

  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    res.status(400)
    throw new Error('No order items')
  }

  // Name, image and price come from the database, never from the browser.
  const ids = orderItems.map((item) => item.product)
  if (!ids.every((id) => mongoose.isValidObjectId(id))) {
    res.status(400)
    throw new Error('Invalid product')
  }
  const products = await Product.find({ _id: { $in: ids } })

  const items = orderItems.map((item) => {
    const product = products.find((p) => p._id.toString() === String(item.product))
    if (!product) {
      res.status(400)
      throw new Error('Product not found')
    }
    const qty = Number(item.qty)
    if (!Number.isInteger(qty) || qty < 1 || qty > product.countInStock) {
      res.status(400)
      throw new Error(`Invalid quantity for ${product.name}`)
    }
    return {
      name: product.name,
      qty,
      image: product.image,
      price: product.price,
      product: product._id,
    }
  })

  const { taxPrice, shippingPrice, totalPrice } = calcPrices(items)

  const order = new Order({
    orderItems: items,
    user: req.user._id,
    shippingAddress,
    paymentMethod,
    taxPrice,
    shippingPrice,
    totalPrice,
  })

  const createdOrder = await order.save()

  res.status(201).json(createdOrder)
})

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private (owner or admin)
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email'
  )

  if (!order) {
    res.status(404)
    throw new Error('Order not found')
  }

  const isOwner = order.user && order.user._id.equals(req.user._id)
  if (!isOwner && !req.user.isAdmin) {
    // 404, not 403: do not reveal that someone else's order exists.
    res.status(404)
    throw new Error('Order not found')
  }

  res.json(order)
})

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private (owner)
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)

  if (!order || !order.user.equals(req.user._id)) {
    res.status(404)
    throw new Error('Order not found')
  }
  if (order.isPaid) {
    res.status(400)
    throw new Error('Order already paid')
  }

  const paypalOrderId = req.body && req.body.id
  if (typeof paypalOrderId !== 'string' || !/^[A-Z0-9]+$/i.test(paypalOrderId)) {
    res.status(400)
    throw new Error('Invalid payment id')
  }
  // One PayPal payment can pay only one order.
  if (await Order.exists({ 'paymentResult.id': paypalOrderId })) {
    res.status(400)
    throw new Error('Payment already used')
  }

  let paypalOrder
  try {
    paypalOrder = await getPayPalOrder(paypalOrderId)
  } catch (error) {
    res.status(502)
    throw error
  }
  const problem = checkPayPalOrder(paypalOrder, order)
  if (problem) {
    res.status(400)
    throw new Error(problem)
  }

  // Conditional update so two parallel requests cannot both mark it paid.
  // shortcut: the same PayPal id racing on two orders at once is not blocked; add a unique index if this goes live.
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: order._id, isPaid: false },
    {
      isPaid: true,
      paidAt: Date.now(),
      paymentResult: {
        id: paypalOrder.id,
        status: paypalOrder.status,
        update_time: paypalOrder.update_time,
        email_address: paypalOrder.payer && paypalOrder.payer.email_address,
      },
    },
    { new: true }
  )
  if (!updatedOrder) {
    res.status(400)
    throw new Error('Order already paid')
  }

  res.json(updatedOrder)
})

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)

  if (order) {
    order.isDelivered = true
    order.deliveredAt = Date.now()

    const updatedOrder = await order.save()

    res.json(updatedOrder)
  } else {
    res.status(404)
    throw new Error('Order not found')
  }
})

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
  res.json(orders)
})

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate('user', 'id name')
  res.json(orders)
})

export {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
}
