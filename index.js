import express from 'express'
import cors from 'cors'
import pg from 'pg'
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
//Login Page
app.get('/', (req, res) => res.sendFile('views/index.html', { root: DIR_NAME }))

/*
 ** ** ==============================================================================
 ** ** ** Start the http server
 ** ** ==============================================================================
 */
app.listen(PORT, () =>
  console.log(`Server started listening on port \t\t\t[${PORT}]`)
)
