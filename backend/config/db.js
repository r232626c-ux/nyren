const { Sequelize } = require('sequelize');
require('dotenv').config();

if (!process.env.POSTGRES_URI) {
  console.error('POSTGRES_URI not defined in environment. Please set it in .env or .env.example');
  process.exit(1);
}

// Initialize Sequelize with PostgreSQL
const sequelize = new Sequelize(process.env.POSTGRES_URI, {
  dialect: 'postgres',
  logging: false, // Set to console.log to see SQL queries
  pool: {
    max: 20,
    min: 2,
    acquire: 60000,
    idle: 15000,
    evict: 10000,
  },
  dialectOptions: {
    keepAlive: true,
  },
});

// Function to connect to the database
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected successfully.');
  } catch (error) {
    console.error('Unable to connect to PostgreSQL:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, Sequelize, connectDB };