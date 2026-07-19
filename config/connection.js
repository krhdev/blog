require("dotenv").config();

const Sequelize = require("sequelize");

if (process.env.DB_PASSWORD === "ChangeMe!") {
  console.error("Please update the .env file with your database password.");
  process.exit(1);
}

// Render's internal Postgres connections don't need SSL, but external
// connections (e.g. from your local machine) do. Set DB_SSL=true in .env
// when connecting from outside Render.
const dialectOptions =
  process.env.DB_SSL === "true"
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : {};

const sequelize = process.env.JAWSDB_URL
  ? new Sequelize(process.env.JAWSDB_URL)
  : new Sequelize(
      process.env.DB_DATABASE,
      process.env.DB_USERNAME,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT,
        port: process.env.DB_PORT,
        dialectOptions,
      }
    );

module.exports = sequelize;