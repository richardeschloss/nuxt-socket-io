export const state = () => ({
  progress: 0,
  sample: 341,
  sample2: 243
})

export const mutations = {
  SET_PROGRESS(state, progress) {
    state.progress = progress
  },

  SET_SAMPLE(state, sample) {
    state.sample = sample
  },

  SET_SAMPLE2(state, sample2) {
    state.sample2 = sample2
  }
}
