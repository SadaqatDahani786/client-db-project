import express from 'express'
import cors from 'cors'
import pg from 'pg'
import jwt from 'jsonwebtoken'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

/*
 ** ** ==============================================================================
 ** ** ** INIT
 ** ** ==============================================================================
 */
const app = express()
const psql_client = new pg.Client({
  host: process.env.PSQL_HOST,
  port: process.env.PSQL_PORT,
  user: process.env.PSQL_USER,
  password: process.env.PSQL_USER_PWD,
  database: process.env.PSQL_DB,
})

/*
 ** ** ==============================================================================
 ** ** ** DB CONNECTION
 ** ** ==============================================================================
 */
try {
  if (
    !process.env.PSQL_HOST ||
    !process.env.PSQL_PORT ||
    !process.env.PSQL_USER ||
    !process.env.PSQL_USER_PWD ||
    !process.env.PSQL_DB
  )
    throw new Error(
      '.env file must provide: PSQL_HOST, PSQL_PORT, PSQL_USER, PSQL_USER_PWD & PSQL_DB'
    )

  await psql_client.connect()
  console.log(
    `Connection to postgres database successfull.\t\t[${process.env.PSQL_USER}@${process.env.PSQL_HOST}:${process.env.PSQL_PORT}]`
  )
} catch (err) {
  console.log(
    `Connection to postgresql database unsuccessfull\t\t[${err.message}].`
  )
}

/*
 ** ** ==============================================================================
 ** ** ** CONSTS
 ** ** ==============================================================================
 */
const PORT = 3000
const API_ENDPOINT = '/api/v1'
const DIR_NAME = dirname(fileURLToPath(import.meta.url))

/*
 ** ** ==============================================================================
 ** ** ** Middlewares
 ** ** ==============================================================================
 */
app.use(cors())
app.use(express.json())

/*
 ** ** ==============================================================================
 ** ** ** Routes
 ** ** ==============================================================================
 */
/*
 ** **
 ** ** ** LOGIN PAGE
 ** **
 */
app.get('/', (req, res) => res.sendFile('views/index.html', { root: DIR_NAME }))

/*
 ** **
 ** ** ** LOGIN API ENDPOINT
 ** **
 */
app.post(`${API_ENDPOINT}/login`, (req, res) => {
  //1) Get fields from the body
  const { email, password } = req.body

  //2) Validate
  if (!email || !password)
    return res.status(400).json({ error: 'Please provide email and password.' })

  //3) Check for user in database
  psql_client.query(
    `SELECT * FROM users WHERE email='${email}' AND password='${password}'`,
    (err, results) => {
      //=> If unknown error occured
      if (err) {
        return res.status(500).json({
          error: `Something went wrong, there was internal server error.`,
        })
      }

      //=> Wrong credentials
      if (results.rows.length <= 0) {
        return res.json({
          error: 'No account with these credentials exist.',
        })
      }
      //=> Login successful, create json web token
      const JWT_token = jwt.sign(results.rows[0], process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRATION,
      })

      //=> Save token in cookie
      res.cookie('jwt', JWT_token, {
        expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        sameSite: 'lax',
        secure: true,
        httpOnly: true,
      })

      //=> Send response along with cookie and token
      return res.json({
        status: 'success',
        jwt: JWT_token,
        data: results.rows[0],
      })
    }
  )
})

/*
 ** ** ==============================================================================
 ** ** ** Start the http server
 ** ** ==============================================================================
 */
app.listen(PORT, () =>
  console.log(`Server started listening on port \t\t\t[${PORT}]`)
)
