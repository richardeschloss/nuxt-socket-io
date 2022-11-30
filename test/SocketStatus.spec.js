import 'jsdom-global/register.js'
import { h, createApp } from 'vue'
import ava from 'ava'
import BrowserEnv from 'browser-env'
import SocketStatus from '#root/lib/components/SocketStatus.js'
BrowserEnv()

const { serial: test } = ava

test('IO Status', (t) => {
  const app = document.createElement('div')
  app.id = 'app'
  document.body.appendChild(app)

  const badStatus = {
    connectUrl: 'http://localhost:3001/index',
    connectError: 'Connect Error',
    connectTimeout: '',
    reconnect: '',
    reconnectAttempt: '5',
    reconnectError: new Error('Error xhr poll error'),
    reconnectFailed: '',
    ping: '',
    pong: ''
  }
  const vueApp = createApp({
    render () {
      return h('div', [
        h(SocketStatus, { status: badStatus, ref: 'c1' }),
        h(SocketStatus, {
          status: {
            connectUrl: 'http://localhost:3001/index'
          },
          ref: 'c2'
        }),
        h(SocketStatus, { ref: 'c3' })
      ])
    }
  }).mount('#app')
  const comp = vueApp.$refs.c1
  const comp2 = vueApp.$refs.c2
  const comp3 = vueApp.$refs.c3

  const expTbl = [
    { item: 'connectError', info: 'Connect Error' },
    { item: 'reconnectAttempt', info: '5' },
    { item: 'reconnectError', info: 'Error: Error xhr poll error' }
  ]

  expTbl.forEach(({ item, info }, idx) => {
    t.is(comp.statusTbl[idx].item, item)
    t.is(comp.statusTbl[idx].info, info)
  })
  t.is(comp2.statusTbl[0].item, 'status')
  t.is(comp2.statusTbl[0].info, 'OK')
  t.is(comp2.statusTbl[0].item, 'status')
  t.is(comp2.statusTbl[0].info, 'OK')

  t.truthy(comp.$el.outerHTML.includes('socket-status'))
  t.truthy(comp2.$el.outerHTML.includes('socket-status'))
  t.falsy(comp3.$el.innerHTML)
})
