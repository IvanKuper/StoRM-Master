// Same rule the checkout screen shows: free shipping over $100, 15% tax.
const round2 = (n) => Math.round(n * 100) / 100

const calcPrices = (items) => {
  const itemsPrice = round2(items.reduce((acc, i) => acc + i.price * i.qty, 0))
  const shippingPrice = itemsPrice > 100 ? 0 : 100
  // toFixed like PlaceOrderScreen, so both sides round the same cent.
  const taxPrice = Number((0.15 * itemsPrice).toFixed(2))
  const totalPrice = Number((itemsPrice + shippingPrice + taxPrice).toFixed(2))
  return { itemsPrice, shippingPrice, taxPrice, totalPrice }
}

export default calcPrices
