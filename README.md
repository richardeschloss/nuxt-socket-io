[![npm](https://img.shields.io/npm/v/nuxt-socket-io.svg)](https://www.npmjs.com/package/nuxt-socket-io)
[![npm](https://img.shields.io/npm/dt/nuxt-socket-io.svg)](https://www.npmjs.com/package/nuxt-socket-io)
[![](https://gitlab.com/richardeschloss/nuxt-socket-io/badges/master/pipeline.svg)](https://gitlab.com/richardeschloss/nuxt-socket-io)
[![](https://gitlab.com/richardeschloss/nuxt-socket-io/badges/master/coverage.svg)](https://gitlab.com/richardeschloss/nuxt-socket-io)
[![NPM](https://img.shields.io/npm/l/nuxt-socket-io.svg)](https://github.com/richardeschloss/nuxt-socket-io/blob/development/LICENSE)

[📖 **Release Notes**](./CHANGELOG.md)

# nuxt-socket-io

[Socket.io](https://socket.io/) client and server module for Nuxt

## Features
- Configuration of multiple IO sockets
- Configuration of per-socket namespaces (simplified format)
- Automatic IO Server Registration
- Socket IO Status
- Automatic Error Handling
- Debug logging, enabled with localStorage item 'debug' set to 'nuxt-socket-io'
- Automatic Teardown, enabled by default
- $nuxtSocket vuex module and socket persistence in vuex
- Support for dynamic APIs using the KISS API format
- Support for the IO config in the new Nuxt runtime config (for Nuxt versions >= 2.13)
- Automatic middleware registration
- ES module

# Important updates

* v2.x may contain breaking changes in it's attempt to get Nuxt3 reaady. `npm i nuxt-socket@1` should help revert any breaking changes in your code.
  * VuexOpts types and Namespace configuration types changed. Entries with the `Record<string, string>` have been deprecated in favor of string-only entries, which are easier to work with.
  * Package type is now "module". Entirely ESM.
  * Tested against node lts (16.x). 
* v1.1.17+ uses socket.io 4.x. You may find the migration [here](https://socket.io/docs/v4/migrating-from-3-x-to-4-0/)
* v1.1.14+ uses socket.io 3.x. You may find the migration [here](https://socket.io/docs/v4/migrating-from-2-x-to-3-0/)
* v1.1.13 uses socket.io 2.x.

# Setup

1. Add `nuxt-socket-io` dependency to your project

* Nuxt 2.x:
```bash
npm i nuxt-socket-io
```

* Nuxt 3.x:
```bash
npm i nuxt-socket-io@next
```

2. Add `nuxt-socket-io` to the `modules` section of `nuxt.config.js`

```js
{
  modules: [
    'nuxt-socket-io',
  ],
  io: {
    // module options
    sockets: [{
      name: 'main',
      url: 'http://localhost:3000'
    }]
  }
}
```

3. Use it in your components:

```js
{
  mounted() {
    this.socket = this.$nuxtSocket({
      channel: '/index'
    })
    /* Listen for events: */
    this.socket
    .on('someEvent', (msg, cb) => {
      /* Handle event */
    })
  },
  methods: {
    method1() {
      /* Emit events */
      this.socket.emit('method1', {
        hello: 'world' 
      }, (resp) => {
        /* Handle response, if any */
      })
    }
  }
}
```

## Documentation

But WAIT! There's so much more you can do!! Check out the documentation:
> https://nuxt-socket-io.netlify.app/

There you will see:
- More details about the features, configuration and usage
- Demos and examples, and link to a codesandbox so you can try things out as you follow along!
- All the old docs that you originally saw here were *moved* there and better organized. Things should be much easier to follow now!

### Resources

- Follow me and the series on [medium.com](https://medium.com/@richard.e.schloss)
- Socket.io Client docs [here](https://socket.io/docs/v4/client-api/)
- Socket.io Server docs [here](https://socket.io/docs/v4/server-api/)


## Development

1. Clone this repository
2. Install dependencies using `yarn install` or `npm install`
3. Start development server using `yarn dev` or `npm run dev`
