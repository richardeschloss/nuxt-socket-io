<a href="https://gitlab.com/richardeschloss/nuxt-socket-io" target="_blank" rel="noopener noreferrer" style=""><img src="https://gitlab.com/richardeschloss/nuxt-socket-io/badges/master/pipeline.svg" aria-hidden="true" class="project-badge"></a>

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
      {
        name: 'home',
        url: 'http://localhost:3000',
        default: true,
        vuex: { // optional
          mutations: [{ progress: 'examples/SET_PROGRESS' }], // pass in the evt --> mutation map OR array of actions
          actions: [{ chatMessage: 'FORMAT_MESSAGE' }, 'SOMETHING_ELSE' ] // pass in the evt --> action map OR array of actions or mixed!,
          emitBacks: ['examples/sample', { 'examples/sample2': 'sample2' }] // pass in the state props you want to listen for changes on. When those props thance, they'll fire these "emitBack" events. If the emitBack is a string, it will send the string, otherwise, if it's an object, it will send the mapped string. (see the updated examples in the page/examples.vue, where I also use a "mapState2Way" function in the component)
        }
      },
      { name: 'work', url: 'http://somedomain1:3000' },
      { name: 'car', url: 'http://somedomain2:3000' },
      { name: 'tv', url: 'http://somedomain3:3000' },
      {
        name: 'test',
        url: 'http://localhost:4000',
        vuex: {
          mutations: ['examples/SET_PROGRESS'],
          actions: ['FORMAT_MESSAGE']
        }
      }
    ]
  },
},
...
```

## Usage in your components or pages: (EASY!)

```
mounted() {
  this.socket1 = this.$nuxtSocket({ // In our example above, since vuex opts are set for 'home', they will be used. (see computed props)
    name: 'home', // If left blank, module will search for the socket you specified as the default
    channel: '/index',
    reconnection: false
  })
  this.socket2 = this.$nuxtSocket({ // In our example above, since vuex opts are NOT set for 'work', there will be no mapping to vuex.
    name: 'work',
    channel: '/meetingRoom',
    reconnection: false
  })
},
computed: mapState({
  chatMessages: (state) => state.chatMessages,// In our example above, 'FORMAT_MESSAGE' action is dispatched when the event 'chatMessage' is received. Here, it's assumed that the FORMAT_MESSAGE action will format the chat message and add update the 'chatMessages' state.

  progress: (state) => state.examples.progress // Remember, the "nuxt way" of organizing state. If progress in defined in store/examples.js, this is how to access it. In our example above, 'SET_PROGRESS' mutation will be committed when ever the 'progress' event is received.
}),
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

- The module will use either the "io" options or the module options. I chose the name `io` because it's concise, but this may conflict with naming used by other modules. The module merges the two options, which may or may not cause headaches. We'll see... if it does, I'm open to changing the name to perhaps `nuxtSocket`.
- Automated tests:
  - End-to-end tests pass. Had to increase the global loadingTimeout to 5000 ms to help prevent `nuxt.renderAndGetWindow` from timing out (in 2 sec). Also updated the nuxt config to cache the build.
  - CI will be nice
- Manual tests: pass to a reasonable degree
- Users of the module, just like any users of socket.io-client, just need to remember that they are still responsible for handling listeners (and removing them). This module only gives the app developer the socket reference(s).

For detailed explanation on how things work, check out [Nuxt.js docs](https://nuxtjs.org).
