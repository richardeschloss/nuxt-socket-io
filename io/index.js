export default function(socket, io) {
  return {
    async echo(msg) {
      return msg
    }
  }
}
