// Load test environment variables before tests run
const dotenv = require('dotenv');
const path = require('path');

// Load test environment variables from .env.test
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

// Ensure test database is used
process.env.NODE_ENV = 'test';