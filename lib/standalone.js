import '../.output/server/index.mjs' // <== "nuxi preview"
import { server } from '../.output/server/chunks/nitro/server.mjs'
import { register } from './module.js'

register.server({
  cors: {
    credentials: true,
    origin: [
      'http://localhost:3000'
    ]
  }
}, server)
