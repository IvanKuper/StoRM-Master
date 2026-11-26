import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import express from 'express'
import dotenv from 'dotenv'
import colors from 'colors'
import morgan from 'morgan'
import helmet from 'helmet'
import compression from 'compression'
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

// Scripts: our own bundle, the PayPal SDK, and the build's small inline snippet (allowed by its hash, so the policy survives a rebuild).
const inlineScriptHashes = () => {
  try {
    const html = fs.readFileSync(path.resolve('frontend', 'build', 'index.html'), 'utf8')
    return [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
      (m) => `'sha256-${crypto.createHash('sha256').update(m[1]).digest('base64')}'`
    )
  } catch {
    return []
  }
}
const paypal = ['https://*.paypal.com', 'https://*.paypalobjects.com']
// shortcut: style-src keeps 'unsafe-inline' (React and the theme set inline styles); tighten with nonces if this becomes a real shop.
// The PayPal checkout popup needs the page to keep its opener.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", ...inlineScriptHashes(), ...paypal],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", ...paypal],
        frameSrc: paypal,
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'", ...paypal],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  })
)

// Render does not compress, so the JS/CSS bundle is gzipped here.
app.use(compression())

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
