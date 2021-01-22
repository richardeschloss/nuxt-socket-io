module.exports = function(socket, io) {
  return Object.freeze({
    hi() {
      return 'world'
    }
  })
}