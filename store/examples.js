export const state = () => ({
  progress: 0
})

export const mutations = {
  SET_PROGRESS(state, progress) {
    state.progress = progress
  }
}
