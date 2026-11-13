# StoRM eCommerce Platform

Hi my name is Ivan and this is My Final project in HackerU college of Web Development/Fullstack course.
This project is an online store, inspired from real madrid Official Store.

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
```

### Install Dependencies (frontend & backend)

```
npm install
cd frontend
npm install
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
# Load sample products and users
npm run data:import

# Remove the sample data
npm run data:destroy
```

### Known build issue (Node 17 and newer)

The front end uses `react-scripts` 3.4, which fails on Node 17+ with `error:0308010C:digital envelope routines::unsupported`. Run the front end with the legacy OpenSSL provider:

```
NODE_OPTIONS=--openssl-legacy-provider npm run dev
```

On Windows PowerShell, set it first: `$env:NODE_OPTIONS="--openssl-legacy-provider"`.

The production build also prints one lint warning: the `target="_blank"` link in `frontend/src/components/Footer.js` has no `rel="noopener noreferrer"`. Fix it before a production deploy.
