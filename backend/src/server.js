/**
 * Entry point: HTTP server + Socket.io on the same port.
 * Load `.env` from the backend folder even if the shell cwd differs.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./sockets');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = http.createServer(app);
  initSocket(server);
 server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
});