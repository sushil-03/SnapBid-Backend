declare global {
  namespace NodeJS {
    interface ProcessEnv {

      DB_PASS: string
      JWT_SECRET: string
      JWT_EXPIRE: string
      COOKIE_EXPIRE: number
      CLOUDINARY_NAME: string
      CLOUDINARY_API_KEY: string
      CLOUDINARY_API_SECRET: string
      NODEMAILERUSER: string
      NODEMAILERPASS: string
      STRIPE_PUBLISHABLE_KEY: string
      CLIENT_ID: string
      CLIENT_SECRET: string
      REFRESH_TOKEN: string

    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export { }