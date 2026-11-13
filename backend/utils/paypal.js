// Env is read inside the functions: server.js loads dotenv after imports run.
const apiUrl = () =>
  process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com'

const getAccessToken = async () => {
  const { PAYPAL_CLIENT_ID, PAYPAL_APP_SECRET } = process.env
  if (!PAYPAL_CLIENT_ID || !PAYPAL_APP_SECRET) {
    throw new Error('PayPal is not configured on the server')
  }
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_APP_SECRET}`).toString(
    'base64'
  )
  const res = await fetch(`${apiUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error('PayPal authentication failed')
  return (await res.json()).access_token
}

// Fetches the PayPal order from PayPal itself, never trusting the browser.
const getPayPalOrder = async (paypalOrderId) => {
  const token = await getAccessToken()
  const res = await fetch(
    `${apiUrl()}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    }
  )
  if (!res.ok) throw new Error('PayPal order not found')
  return res.json()
}

// Returns an error message, or null when the PayPal order pays this order in full.
const checkPayPalOrder = (paypalOrder, order) => {
  if (paypalOrder.status !== 'COMPLETED') return 'Payment not completed'
  const unit = paypalOrder.purchase_units?.[0]
  const capture = unit?.payments?.captures?.[0]
  // Order status can be COMPLETED while the money itself is still pending.
  if (capture && capture.status !== 'COMPLETED') return 'Payment still pending'
  const amount = unit?.amount
  if (!amount || amount.currency_code !== 'USD') return 'Wrong payment currency'
  if (Number(amount.value).toFixed(2) !== order.totalPrice.toFixed(2)) {
    return 'Paid amount does not match the order total'
  }
  return null
}

export { getPayPalOrder, checkPayPalOrder }
