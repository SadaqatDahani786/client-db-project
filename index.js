import fs from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import pg from 'pg'
import mongodb from 'mongodb'
import jwt from 'jsonwebtoken'

import {
  compileView,
  initializeMongoDB,
  initializePostgresDB,
} from './utils/utils.js'

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
const mongodb_client = new mongodb.MongoClient(
  `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_USER_PWD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB}?retryWrites=true&writeConcern=majority&authSource=admin`
)

/*
 ** ** ==============================================================================
 ** ** ** DB CONNECTION [POSTGRESQL]
 ** ** ==============================================================================
 */
try {
  //1) Validate
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

  //2) Connect to postgres server
  await psql_client.connect()
  console.log(
    `Connection to postgres database successfull.\t\t[${process.env.PSQL_USER}@${process.env.PSQL_HOST}:${process.env.PSQL_PORT}]`
  )

  //3) Initialized DB with th users
  initializePostgresDB(psql_client)
} catch (err) {
  console.log(
    `Connection to postgresql database unsuccessfull\t\t[${err.message}].`
  )
}

/*
 ** ** ==============================================================================
 ** ** ** DB CONNECTION [MONGODB]
 ** ** ==============================================================================
 */
try {
  //1) Validate
  if (
    !process.env.MONGO_HOST ||
    !process.env.MONGO_PORT ||
    !process.env.MONGO_DB ||
    !process.env.MONGO_USER ||
    !process.env.MONGO_USER_PWD
  )
    throw new Error(
      '.env file must provide: MONGO_HOST, MONGO_PORT, MONGO_DB, MONGO_USER, MONGO_USER_PWD'
    )

  //2) Connect to mongodb server
  await mongodb_client.connect()
  console.log(
    `Connection to mongodb database successfull.\t\t[mongodb@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}]`
  )

  //3)
  initializeMongoDB(mongodb_client)
} catch (err) {
  console.log(
    `Connection to mongodb database unsuccessfull\t\t[${err.message}].`
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
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

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
 ** ** ** SIGN UP PAGE
 ** **
 */
app.get('/signup', (req, res) =>
  res.sendFile('views/signup.html', { root: DIR_NAME })
)

/*
 ** **
 ** ** ** DASHBAORD
 ** **
 */
app.get('/dashboard', (req, res) => {
  //1) Get token from cookie
  const token = req.cookies.jwt

  //2) If no token, redirect to login page
  if (!token) res.redirect('/')

  //3) Verify token validity
  jwt.verify(token, process.env.JWT_SECRET, {}, (err, payload) => {
    //=> If err, redirect to login page
    if (err) return res.redirect('/')

    //=> Get username from payload
    const { username } = payload

    //=> Read dashboard view file
    fs.readFile('views/dashboard.html', 'utf8', async function (err, data) {
      //=> If error, return
      if (err)
        return res.status(500).json({
          status: 'failed',
          error: 'Something went wrong, internal server error.',
        })

      //=> Select collection
      const restaurents = mongodb_client
        .db(process.env.MONGO_DB)
        .collection('restaurants')

      //=> Find in database with search query
      const queryResults = restaurents.find({
        $text: { $search: `\"${req.query?.search}\"` },
      })

      //=> Get the found documents as array
      let docs = await queryResults.toArray()

      //=> Compile view and store the result
      const result = compileView(data, {
        rows: docs,
        search: req.query?.search,
        name: username,
      })

      //=> Send updated html
      res.set('Content-Type', 'text/html')
      res.send(Buffer.from(result))
    })
  })
})

/*
 ** **
 ** ** ** LOGIN API ENDPOINT
 ** **
 */
app.post(`${API_ENDPOINT}/login`, (req, res) => {
  //1) Get fields from the body
  const { username, password } = req.body

  //2) Validate
  if (!username || !password)
    return res
      .status(400)
      .json({ error: 'Please provide username and password.' })

  //3) Check for user in database
  psql_client.query(
    `SELECT * FROM users WHERE username='${username}' AND password='${password}'`,
    (err, results) => {
      //=> If unknown error occured
      if (err) {
        return res.status(500).json({
          status: 'failed',
          error: `Something went wrong, there was internal server error.`,
        })
      }

      //=> Wrong credentials
      if (results.rows.length <= 0) {
        return res.status(404).json({
          status: 'failed',
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
 ** **
 ** ** ** SIGNUP API ENDPOINT
 ** **
 */
app.post(`${API_ENDPOINT}/signup`, (req, res) => {
  //1) Get fields from the body
  const { username, password, password_confirm } = req.body

  //2) Check if values exist
  if (!username || !password || !password_confirm)
    return res.status(400).json({
      status: 'failed',
      error: 'Must provide username, password and password confirm to signup.',
    })

  //3) Check if Password missmatch
  if (password !== password_confirm)
    return res.status(400).json({
      status: 'failed',
      error:
        'Password and password confirm mismatched, please provide correct passwords.',
    })

  //3) Create user
  psql_client.query(
    `INSERT INTO users (username, password) VALUES ('${username}', '${password}')`,
    (err, results) => {
      //=> If duplicate username error
      if (err?.code === '23505') {
        return res.status(400).json({
          status: 'failed',
          error: `An account with the username "${username}" already exist.`,
        })
      }

      //=> If unknown error
      if (err || results.rowCount <= 0) {
        return res.status(500).json({
          status: 'failed',
          error: 'Something went wrong, there was an internal server error.',
        })
      }

      //=> Signup successful, create json web token
      const JWT_token = jwt.sign(
        { username, password },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRATION,
        }
      )

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
        data: { username, password },
      })
    }
  )
})

/*
 ** **
 ** ** ** LOGOUT API ENDPOINT
 ** **
 */
app.get(`${API_ENDPOINT}/logout`, (req, res) => {
  //1) Remove token from cookie
  res.cookie('jwt', 'logged_out_user', {
    expires: new Date(Date.now() + 60 * 1000),
    httpOnly: true,
  })

  //2) Send Response
  res.status(200).json({
    status: 'success',
  })
})

/*
 ** ** ==============================================================================
 ** ** ** Start the http server
 ** ** ==============================================================================
 */
app.listen(PORT, () =>
  console.log(`Server started listening on port \t\t\t[${PORT}]`)
)
