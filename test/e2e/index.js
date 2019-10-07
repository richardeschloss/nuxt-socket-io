/* eslint-disable no-console */
import test from 'ava'
import ioClient from 'socket.io-client'
import { ioServerInit, nuxtInit, nuxtClose } from '../utils'

test.before(ioServerInit)

test.before(nuxtInit)

test('Socket io client can connect', (t) => {
  t.timeout(60000)
  return new Promise((resolve) => {
    console.log('attempting to connect')
    const socket = ioClient('http://localhost:4000')
    socket.on('connect', () => {
      console.log('client connected!!', socket.id)
      t.pass()
      resolve()
    })
  })
})

test('$nuxtServer injected ok', async (t) => {
  t.timeout(60000)
  const { nuxt } = t.context
  const window = await nuxt.renderAndGetWindow('http://localhost:3000')
  t.truthy(window.$nuxt.$nuxtSocket)
})

test('test client use nuxtSocket ok', async (t) => {
  t.timeout(60000)
  const { nuxt } = t.context
  const window = await nuxt.renderAndGetWindow('http://localhost:3000')
  const testSocket = window.$nuxt.$nuxtSocket({
    name: 'test',
    channel: '/index'
  })
  const testJSON = { msg: 'it worked!' }
  const expected = 'It worked! Received msg: ' + JSON.stringify(testJSON)
  return new Promise((resolve) => {
    testSocket.emit('getMessage', testJSON, (actual) => {
      t.is(expected, actual)
      resolve()
    })
  })
})

test.after('Closing server and nuxt.js', nuxtClose)
