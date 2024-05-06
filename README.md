# client-db-project

A simple web application that connects to sql(postgres) and nosql(mongodb) database and performs various database operations.

## How to run this app inside container:

1. Download Nodejs from https://nodejs.org/en/download/current and install it. To verify the installation use `node -v` and `npm -v`, which outputs the version.

2. Download Docker from https://www.docker.com/get-started/ and install it.

3. Open project in Vs Code, open terminal and execute this npm script: `npm run docker`.

4. That's it, now open the browser and go to http://localhost:3000, and you'll see the login page.

## How to run this app locally:

1. Download Nodejs from https://nodejs.org/en/download/current and install it. To verify the installation use `node -v` and `npm -v`, which outputs the version.

2. Downalod Mongodb server from https://www.mongodb.com/try/download/community and install it.

3. Download Postgresql server from https://www.enterprisedb.com/downloads/postgres-postgresql-downloads and install it. If it asks for the **username**, **password** and **port** during installation, remember it.

4. Now search for pgadmin in your start menu and run the application, then click on servers to connect to your local postgresql server, then right click on (_Servers_ -> _PostgreSQL_ -> _Databases_) and create a new database and give it any name. Remember the **database name** you set.

5. Now open the project in Vs Code and open a terminal/cmd and type this command `npm install` to install all the dependencies.

6. Rename the **example.env** to **.env** and make sure to change postgres database settings to your settings, **username**, **password**, **port** and **database**, which you've set in the previous steps.

7. Now run this command `npm start` to start the project.

8. Finally open the browser and go to http://localhost:3000, and you'll see the login page.

## Usefull npm scripts

1. `npm start`
   - Start the project with the nodemon locally.
2. `npm run docker:stop-containers`
   - Stops all running containers in docker.
3. `npm run docker:remove-containers`
   - Remove all containers from docker.
4. `npm run docker:build`
   - Build the docker image from this project.
5. `npm run docker:remove-image`
   - Remove the docker image which was built from this project.
6. `npm run docker:up`
   - Run the image as a container which was built from this project.
7. `npm run docker`
   - Stops all running containers.
   - Remove all containers.
   - Remove an existing `nodejs_db_project` image.
   - Build a new `nodejs_db_project` image.
   - Run the `nodejs_db_project` image as container.
