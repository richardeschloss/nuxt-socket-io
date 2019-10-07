# nuxt-socket-io

> Nuxt Socket.io module (wrapper) -- easily configure and use your socket.io clients!

## Installation

> npm i --save nuxt-socket-io

## Configuration

Then in your `nuxt.config.js` file, specify your sockets:

```
...
modules: [
    'nuxt-socket-io'
  ],
  io: {
    sockets: [
      { name: 'home', url: 'http://localhost:3000', default: true },
      { name: 'work', url: 'http://somedomain1:3000' },
      { name: 'car', url: 'http://somedomain2:3000' },
      { name: 'tv', url: 'http://somedomain3:3000' }
    ]
},
...
```

## Usage in your components or pages: (EASY!)

```
mounted() {
  this.socket1 = this.$nuxtSocket({
    name: 'home', // If left blank, module will search for the socket you specified as the default
    channel: '/index',
    reconnection: false
  })
  this.socket2 = this.$nuxtSocket({
    name: 'work',
    channel: '/meetingRoom',
    reconnection: false
  })
},
methods: {
    getMessage() {
      this.socket1.emit('getMessage', { id: 'abc123' }, (resp) => {
        this.messageRxd = resp
      })
    },
    getMeetingRoom(){
      this.socket2.emit('getMeetingRoom', { room: 'media1337' }, (resp) => {
        this.messageRxd = resp
      })
      .on('someData', handleSomeData)
    }
  }
```

## Build Setup

```bash
# install dependencies
$ npm run install

# serve with hot reload at localhost:3000
$ npm run dev:server

Note: `npm run dev` will just run nuxt (client), it will be much more helpful to run both client and server. You may be interested in the design pattern being used on the socket.io server. As long as you have `.js` files in your `server/channels` directory and make sure to export a function named `Svc`, the `server.js` will automatically register it. This is somewhat analagous to the automatic routing of pages that you place in your `pages` folder.

# build for production and launch server
$ npm run build
$ npm run start

# generate static project
$ npm run generate
```

## Todo Items and Notes
* The module will use either the "io" options or the module options. I chose the name `io` because it's concise, but this may conflict with naming used by other modules. The module merges the two options, which may or may not cause headaches. We'll see... if it does, I'm open to changing the name to perhaps `nuxtSocket`.
* Automated tests: 
** End-to-end tests pass, but can perhaps be made more reliable. Sometimes `nuxt.renderAndGetWindow()` times out in 2 seconds and I'm not entirely sure why. Sometimes it passes no problem. 
** CI will be nice
* Manual tests: pass to a reasonable degree
* Users of the module, just like any users of socket.io-client, just need to remember that they are still responsible for handling listeners (and removing them). This module only gives the app developer the socket reference(s).

For detailed explanation on how things work, check out [Nuxt.js docs](https://nuxtjs.org).
