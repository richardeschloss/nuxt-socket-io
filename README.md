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
- Configuration of per-socket namespaces
- Automatic IO Server Registration
- Socket IO Status
- Automatic Error Handling
- Debug logging, enabled with localStorage item 'debug' set to 'nuxt-socket-io'
- Automatic Teardown, enabled by default
- $nuxtSocket vuex module and socket persistence in vuex
- Support for dynamic APIs using the KISS API format
- Support for the IO config in the new Nuxt runtime config (for Nuxt versions >= 2.13)
- Automatic middleware registration

# Important update

* v1.1.14+ uses socket.io 3.x. You may find the migration [here](https://socket.io/docs/v3/migrating-from-2-x-to-3-0/index.html)
* v1.1.13 uses socket.io 2.x . Clamp the version to 1.1.13 if not ready to update.

# Setup

1. Add `nuxt-socket-io` dependency to your project

```bash
yarn add nuxt-socket-io # or npm install nuxt-socket-io
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
