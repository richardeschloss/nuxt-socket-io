function mapState2Way(map) {
  const [[prop, mutation]] = Object.entries(map)
  let stateProp = null
  return {
    get() {
      if (!stateProp) {
        const outProp = Object.assign({}, this.$store.state)
        stateProp = prop.split('/').reduce((obj, nestedProp) => {
          obj = obj[nestedProp]
          return obj
        }, outProp)
      }
      return stateProp
    },
    set(newVal) {
      this.$store.commit(mutation, newVal)
    }
  }
}

export { mapState2Way }
