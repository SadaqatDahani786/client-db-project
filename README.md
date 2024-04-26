# client-db-project

A simple web application that connects to sql and nosql database and performs operations.

## How to run this app:

1. Download Nodejs from https://nodejs.org/en/download/current and install it.

2. Download Postgresql server from https://www.enterprisedb.com/downloads/postgres-postgresql-downloads and install it. Remember the **username**, **password** and **port** you set during installation.

3. Now search for pgadmin in your start menu and run the application, then click on servers to connect to your local postgresql server, then right on (Servers -> PostgreSQL -> Databases) and create a new database and give it any name. Remember the **database name** you set.

4. Now open the project in Vs Code and open a terminal/cmd and type this command `npm install` to install all the dependencies.

5. Rename the **example.env** to **.env** and make sure to change postgres database settings to your settings, **username**, **password**, **port** and **database**, which you've set in the previous steps.

6. Now run this command `npm start` to start the project.

7. Finally open the browser and go to http://localhost:3000, and you'll see the login page.

**NOTE:** Repeat the instructions if project failed to start due to some errors or something else.
