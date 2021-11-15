export const state = () => ({
  chatMessages: '',
  titleFromUser: '',
  action: false,
  action2: ''
})

export const mutations = {
  SET_MESSAGE (state, chatMessage) {
    state.chatMessages += chatMessage
  },
  someAction (state) {
    state.action = true
  },
  action2 (state, msg) {
    state.action2 = msg.toUpperCase()
  }
}

export const actions = {
  FORMAT_MESSAGE ({ commit }, chatMessage) {
    const chatMessageFmt = `${new Date().toLocaleString()}: ${chatMessage}\r\n`
    commit('SET_MESSAGE', chatMessageFmt)
  },
  someAction ({ commit }, msg) {
    commit('someAction')
  },
  format2 ({ commit }, msg) {
    commit('action2', msg)
  }
}
