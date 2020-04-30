export default function(socket, io) {
  return {
    getNamespaces() {
      return Object.keys(io.nsps)
    },
    echo(msg) {
      return msg
    }
  }
}
