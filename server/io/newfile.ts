export default function(socket, io) {
  return Object.freeze({
    hi() {
      return 'world'
    }
  })
}