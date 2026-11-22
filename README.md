# StoRM eCommerce Platform

Hi my name is Ivan and this is My Final project in HackerU college of Web Development/Fullstack course.
This project is an online store, inspired from real madrid Official Store.

**Live demo:** https://storm-shop.onrender.com (free server: the first load can take about a minute). Without PayPal keys the store runs in demo mode: "Pay now (demo)" marks the order paid and no money moves.

![Home page](docs/home.png)

![Product page](docs/product.png)

## Features

- Full featured shopping cart
- Product reviews and ratings
- Top products carousel
- Product pagination
- Product search feature
- User profile with orders
- Admin product management
- Admin user management
- Admin Order details page
- Mark orders as delivered option
- Checkout process (shipping, payment method, etc)
- PayPal / credit card integration
- Database seeder (products & users)

## Usage

### Env Variables

Create a .env file in then root and add the following

```
NODE_ENV = development
PORT = 5000
MONGO_URI = your mongodb uri
JWT_SECRET = use-a-long-random-string-here
PAYPAL_CLIENT_ID = your paypal client id
PAYPAL_APP_SECRET = your paypal secret (the server checks every payment with PayPal)
PAYPAL_API_URL = https://api-m.sandbox.paypal.com (use https://api-m.paypal.com for live)
```

### Install Dependencies (frontend & backend)

```
npm install
cd frontend
npm install
```

### Tests

```
npm test   # needs a local MongoDB (TEST_MONGO_URI, default mongodb://127.0.0.1:27017)
```

### Run

```
# Run frontend (:3000) & backend (:5000)
npm run dev

# Run backend only
npm run server
```

### Sample data (optional)

```
# Load 7 sample products and one admin user (needs SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD, 12+ chars)
npm run data:import

# Remove the sample data
npm run data:destroy
```

Both commands wipe all users, products and orders. With `NODE_ENV=production` they refuse to run unless you add `--yes` (for example `node backend/seeder --yes`).

Product photos are public domain / CC0 from Wikimedia Commons: Ball soccer 1990s1, Basketball through hoop, Closeup of a tennis ball (2), Nanoldsquash2, Black boxing gloves, Pair of 8kg dumbbells (Unsplash), Yoga mats.

### Deploy (Railway)

`npm run build` installs and builds the front end; `npm start` serves the API and the build. Set `NODE_ENV=production`, `MONGO_URI`, `JWT_SECRET`, `PAYPAL_CLIENT_ID`, `PAYPAL_APP_SECRET` and `PAYPAL_API_URL` on the service.

### Known build issue (Node 17 and newer)

The front end uses `react-scripts` 3.4, which fails on Node 17+ with `error:0308010C:digital envelope routines::unsupported`. Run the front end with the legacy OpenSSL provider:

```
NODE_OPTIONS=--openssl-legacy-provider npm run dev
```

On Windows PowerShell, set it first: `$env:NODE_OPTIONS="--openssl-legacy-provider"`.

The production build also prints one lint warning: the `target="_blank"` link in `frontend/src/components/Footer.js` has no `rel="noopener noreferrer"`. Fix it before a production deploy.
