// @ts-nocheck
export function wrapPlugin (Plugin) {
  const ctx = {
    $config: {},
    $store: {
      state: {},
      mutations: {},
      actions: {},
      namespaced: {},
      opts: {},
      commit (label, data) {
        const labelParts = label.split('/')
        if (labelParts.length > 1) {
          const namespace = labelParts[0]
          const key = labelParts[1]
          ctx.$store.mutations[namespace][key](ctx.$store.state[namespace], data)
        } else {
          ctx.$store.mutations[label](ctx.$store.state, data)
        }
      },
      dispatch (label, data) {
        const labelParts = label.split('/')
        if (labelParts.length > 1) {
          const namespace = labelParts[0]
          const key = labelParts[1]
          const state = ctx.$store.state[namespace]
          const commit = (label, data) => ctx.$store.commit(
            `${namespace}/${label}`,
            data
          )
          return ctx.$store.actions[namespace][key]({ state, commit }, data)
        } else {
          return ctx.$store.actions[label](ctx.$store, data)
        }
      },
      registerModule (name, cfg, opts) {
        if (!ctx.$store) {
          // Restore the store if it were deleted
          ctx.$store = { ...ctx.store }
        }
        Object.entries(cfg).forEach(([key, item]) => {
          ctx.$store[key][name] = typeof item === 'object'
            ? { ...item }
            : item
        })
        ctx.$store.opts[name] = { ...opts }
      }
    },
    inject (label, obj) {
      ctx['$' + label] = obj
    },
    Plugin
  }
  ctx.store = { ...ctx.$store }
  return ctx
}
