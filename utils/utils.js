import fs from 'fs'

/*
 ** ** ==============================================================================
 ** ** ** Intialize users table with five records when app runs for the first time
 ** ** ==============================================================================
 */
export const initializePostgresDB = (client) => {
  //=> Check if users tables exist or not
  client.query(`SELECT * from users`, (err) => {
    //==> No users table detected, create a new one
    if (err) {
      console.log(
        'No users table detected in postgres database.\t\t[Initializing]'
      )

      //=> Create users table with 5 default users
      client.query(
        `
        DROP TABLE IF EXISTS users;
    
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(200) UNIQUE,
          password VARCHAR(200)
        );
    
        INSERT INTO users (
          username, password
        ) values (
          'john', 'abc123'
        ), (
          'mark', 'abc123'
        ), (
          'sara', 'abc123'
        ), (
          'stuart', 'abc123'
        ), (
          'micheal', 'abc123'
        );
    
        `,
        (err, results) => {
          if (err)
            return console.log(
              `Initialization of users table in postgres database has failed.\t\t[${err.message}]`
            )
          console.log(
            `Postgres database has initialized with the users.\t[Users count ${results[2].rowCount}]`
          )
        }
      )
    }
  })
}

/*
 ** ** ==============================================================================
 ** ** ** Intialize restaurants collection with the records stored in json file
 ** ** ==============================================================================
 */
export const initializeMongoDB = async (client) => {
  //1) Select db
  const db = await client.db(process.env.MONGO_DB)

  //2) Select collection
  const restaurants = await db.collection('restaurants')

  //3) IF no documents found, only then initialize
  if ((await restaurants.countDocuments()) === 0) {
    console.log(
      'No restaurants collection detected in mongodb database.\t[Initializing]'
    )

    //=> Read data from restaurent json file
    fs.readFile(
      './restaurants.json',
      { encoding: 'utf-8' },
      async (err, data) => {
        //=> If err, return
        if (err)
          return console.log(
            `Failed to initialize mongodb database.\t\t[${err.message}]`
          )

        //=> else initialize
        const results = await restaurants.insertMany(JSON.parse(data))

        //=> Create search index
        restaurants.createIndex(
          {
            name: 'text',
            cuisine: 'text',
            borough: 'text',
            'address.street': 'text',
            'grades.grade': 'text',
          },
          { default_language: 'none' }
        )

        //=> Print nice message
        console.log(
          `Mongodb database has initialized with the restaurents.\t[${results.insertedCount} docs inserted]`
        )
      }
    )
  }
}

/*
 ** ** ==============================================================================
 ** ** ** Compile views by executing code in each expression slot
 ** ** ==============================================================================
 */
export const compileView = (data, props) => {
  //1) Define var
  let result = data

  //2) Convert expression slots to pure js expression
  const expressions = result
    .match(/%%{.*}%%/g)
    .map((m) => m.replace('%%{', '').replace('}%%', ''))

  //3) Executing each expression, and project that into views
  expressions.map((e) => {
    const output = eval(e)
    result = result.replace(
      /%%{.*}%%/,
      Array.isArray(output) ? output.join('') : output
    )
  })

  //4) Return compiled view
  return result
}
