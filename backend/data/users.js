import bcrypt from 'bcryptjs'

// The admin login comes from env so no password lives in the repo.
const getUsers = () => {
  const { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = process.env
  if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD || SEED_ADMIN_PASSWORD.length < 12) {
    throw new Error(
      'Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD (12+ chars) before seeding'
    )
  }
  return [
    {
      name: 'Store Admin',
      email: SEED_ADMIN_EMAIL,
      password: bcrypt.hashSync(SEED_ADMIN_PASSWORD, 10),
      isAdmin: true,
    },
  ]
}

export default getUsers
