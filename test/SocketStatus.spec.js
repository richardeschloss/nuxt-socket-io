import 'jsdom-global/register.js'
import Vue from 'vue'
import ava from 'ava'
import SocketStatus from '#root/lib/components/SocketStatus.js'

const { serial: test } = ava

test('IO Status', (t) => {
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
  const Comp = Vue.extend(SocketStatus)
  const comp = new Comp({
    propsData: {
      status: badStatus
    }
  })
  const comp2 = new Comp({
    propsData: {
      status: {
        connectUrl: 'http://localhost:3001/index'
      }
    }
  })
  const comp3 = new Comp({
    propsData: {}
  })
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

  comp.$mount()
  comp2.$mount()
  comp3.$mount()
})
