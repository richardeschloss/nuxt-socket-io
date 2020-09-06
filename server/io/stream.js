export default function(socket, io) {
  socket.broadcast.emit('clientConnected')
  return {
    chunk: (buf) => socket.broadcast.emit('chunk', buf),
    start: (msg) => socket.broadcast.emit('start', msg),
    stop: (msg) => socket.broadcast.emit('stop'),
    restart: (msg) => socket.broadcast.emit('restart')
  }
}
