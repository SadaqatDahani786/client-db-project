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
