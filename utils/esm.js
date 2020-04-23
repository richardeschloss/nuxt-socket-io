function $onP(ctx, evt) {
  return new Promise((resolve) => {
    ctx.$on(evt, resolve)
  })
}

function mapState2Way(map) {
  const [[prop, mutation]] = Object.entries(map)
  return {
    get() {
      return propByPath(this.$store.state, prop)
    },
    set(newVal) {
      this.$store.commit(mutation, newVal)
    }
  }
}

function propByPath(obj, path) {
  return path.split(/[/.]/).reduce((out, prop) => {
    if (out !== undefined && out[prop] !== undefined) {
      return out[prop]
    }
  }, obj)
}

function propExists(obj, path) {
  return propByPath(obj, path) !== undefined
}

export { mapState2Way, $onP, propByPath, propExists }
