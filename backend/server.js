import path from 'path'
import express from 'express'
import dotenv from 'dotenv'
import colors from 'colors'
import morgan from 'morgan'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { notFound, errorHandler } from './middleware/errorMiddleware.js'
import connectDB from './config/db.js'
import Product from './models/productModel.js'
import User from './models/userModel.js'
import addSampleProductsIfEmpty from './utils/sampleProducts.js'

import productRoutes from './routes/productRoutes.js'
import userRoutes from './routes/userRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'

dotenv.config()

connectDB()
  .then(() => addSampleProductsIfEmpty(Product, User))
  .then((added) => added && console.log(`Added ${added} sample products`))
  .catch((error) => console.error(`Sample products: ${error.message}`))

const app = express()

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

if (process.env.NODE_ENV === 'production') {
  // One proxy (the host's load balancer) in front, so the rate limit sees real client IPs.
  app.set('trust proxy', 1)
}

// shortcut: CSP is off because the page loads the PayPal SDK and the React build inline; set a CSP before a real launch.
// The PayPal checkout popup needs the page to keep its opener.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
)

const limiter = (limit, extra) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ...extra,
  })
app.use('/api', limiter(1000))
// Only failed logins count, against password guessing; sign-ups count all.
app.use('/api/users/login', limiter(10, { skipSuccessfulRequests: true }))
app.post('/api/users', limiter(10))

app.use(express.json({ limit: '100kb' }))

app.use('/api/products', productRoutes)
app.use('/api/users', userRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/upload', uploadRoutes)

app.get('/api/config/paypal', (req, res) =>
  res.send(process.env.PAYPAL_CLIENT_ID)
)

const __dirname = path.resolve()
app.use('/uploads', express.static(path.join(__dirname, '/uploads')))

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '/frontend/build')))

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'))
  )
} else {
  app.get('/', (req, res) => {
    res.send('API is running....')
  })
}

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
)
