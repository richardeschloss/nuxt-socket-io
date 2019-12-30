export const state = () => ({
  chatMessages: '',
  titleFromUser: ''
})

export const mutations = {
  SET_MESSAGE(state, chatMessage) {
    state.chatMessages += chatMessage
  }
}

export const actions = {
  FORMAT_MESSAGE({ commit }, chatMessage) {
    const chatMessageFmt = `${new Date().toLocaleString()}: ${chatMessage}\r\n`
    commit('SET_MESSAGE', chatMessageFmt)
  }
}
