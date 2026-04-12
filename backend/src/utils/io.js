/** Socket.io instance for emitting from HTTP controllers (set from `sockets/index.js`). */
let io;

function setIo(instance) {
  io = instance;
}

function getIo() {
  return io;
}

module.exports = { setIo, getIo };
