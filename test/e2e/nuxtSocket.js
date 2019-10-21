/* eslint-disable no-console */
import { serial as test } from 'ava'
import ioClient from 'socket.io-client'
import { ioServerInit, nuxtInit, nuxtClose } from '../utils'

test.before(ioServerInit)

test.before(nuxtInit)

test.after('Closing server and nuxt.js', nuxtClose)

test('Socket io client can connect', (t) => {
  t.timeout(60000)
  return new Promise((resolve) => {
    console.log('attempting to connect')
    const socket = ioClient('http://localhost:4000')
    socket.on('connect', () => {
      console.log('client connected!!', socket.id)
      t.truthy(socket.id)
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

test('nuxtSocket sends and receives messages, vuex actions dispatches', async (t) => {
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
    testSocket.on('chatMessage', (msgRxd) => {
      const { chatMessages: msgsSet } = window.$nuxt.$store.state
      console.log('chatMessage!!!', msgRxd)
      console.log(msgRxd, msgsSet)
      t.true(msgsSet.includes(msgRxd))
    })
  })
})

test('nuxtSocket sends and receives messages, vuex state mutates', async (t) => {
  t.timeout(60000)
  const { nuxt } = t.context
  const window = await nuxt.renderAndGetWindow('http://localhost:3000')
  const testSocket = window.$nuxt.$nuxtSocket({
    name: 'test',
    channel: '/examples'
  })
  const testJSON = { period: 150 }
  const expected = 100
  return new Promise((resolve) => {
    testSocket
      .emit('getProgress', testJSON, (actual) => {
        t.is(expected, actual)
        resolve()
      })
      .on('progress', (progressRxd) => {
        const { progress: progressSet } = window.$nuxt.$store.state.examples
        console.log(progressRxd, progressSet)
        t.is(progressRxd, progressSet)
      })
  })
})

test.only('ioServer receives registered messages on vuex state changes', async (t) => {
  const { nuxt } = t.context
  const window = await nuxt.renderAndGetWindow('http://localhost:3000')
  const testSocket = window.$nuxt.$nuxtSocket({
    name: 'test',
    channel: '/examples'
  })
  const testVal = 1337
  const testVal2 = 4321
  window.$nuxt.$store.commit('examples/SET_SAMPLE', testVal)
  window.$nuxt.$store.commit('examples/SET_SAMPLE2', testVal2)
  const serverEvts = [
    {
      evt: 'sampleDataRxd',
      expMsg: 'Sample data rxd on state change',
      expVal: testVal
    },
    {
      evt: 'sample2DataRxd',
      expMsg: 'Sample2 data rxd on state change',
      expVal: testVal2
    }
  ]
  return new Promise((resolve) => {
    let doneCnt = 0
    const handleDone = () => {
      if (++doneCnt === serverEvts.length) {
        resolve()
      }
    }
    console.log('Waiting to rx messages!!')
    serverEvts.forEach(({ evt, expMsg, expVal }) => {
      testSocket.on(evt, ({ msg, sample }) => {
        console.log('msg rxd', msg, sample)
        t.is(msg, expMsg)
        t.is(sample, expVal)
        handleDone()
      })
    })
  })
})
