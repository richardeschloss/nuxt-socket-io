[![npm](https://img.shields.io/npm/v/nuxt-socket-io)](https://www.npmjs.com/package/nuxt-socket-io)
[![npm](https://img.shields.io/npm/dt/nuxt-socket-io)](https://www.npmjs.com/package/nuxt-socket-io)
[![](https://gitlab.com/richardeschloss/nuxt-socket-io/badges/master/pipeline.svg)](https://gitlab.com/richardeschloss/nuxt-socket-io)
[![](https://gitlab.com/richardeschloss/nuxt-socket-io/badges/master/coverage.svg)](https://gitlab.com/richardeschloss/nuxt-socket-io)
[![NPM](https://img.shields.io/npm/l/nuxt-socket-io)](https://github.com/richardeschloss/nuxt-socket-io/blob/development/LICENSE)

# nuxt-socket-io

> Nuxt Socket.io module (wrapper) -- easily configure and use your socket.io clients!

# Working demo

Heroku hosts the IO Server, netlify hosts the IO Client (Nuxt app). See it in action [here](https://nuxt-socket-io.netlify.com)

Yes, Heroku could have also hosted the Nuxt app, however, for this demo, I wanted to separate the two. This may make the code easier to maintain, but I may consider using heroku for all purposes.

# Documentation

These docs are hosted on the `gh-pages` branch. View a larger version of this [here](https://richardeschloss.github.io/nuxt-socket-io/)

# Table of Contents

(NOTE: these links work in Github best)

1. [Installation](#installation-)
2. [Configuration (io sockets)](#configuration-io-sockets-)
3. [Configuration (namespaces)](#configuration-namespaces-) 
4. [Usage](#usage-in-components-or-pages-)
5. [Socket Status](#socket-status-)
6. [Error Handling](#error-handling-)
7. [Debug Logging](#debug-logging-)
8. [Console Warnings](#console-warnings-)
9. [Auto Teardown](#auto-teardown-)
10. [Build Setup](#build-setup-)
11. [Contributing](https://github.com/richardeschloss/nuxt-socket-io/blob/gh-pages/CONTRIBUTING.md)

## Installation [↑](#nuxt-socket-io)

> npm i --save nuxt-socket-io

## Configuration (io sockets) [↑](#nuxt-socket-io)

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
          actions: [{ chatMessage: 'FORMAT_MESSAGE' }, 'SOMETHING_ELSE' ], // pass in the evt --> action map OR array of actions or mixed!,
          emitBacks: ['examples/sample', { 'examples/sample2': 'sample2' }] // pass in the state props you want to listen for changes on. When those props thance, they'll fire these "emitBack" events. If the emitBack is a string, it will send the string, otherwise, if it's an object, it will send the mapped string. (see the updated examples in the page/examples.vue, where I also use a "mapState2Way" function in the component).
        },
        namespaces: { /* See next section */ }
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

## Configuration (Namespaces) [↑](#nuxt-socket-io)

It is also possible to configure namespaces in `nuxt.config`. Each socket set can have its own configuration of namespaces and each namespace can now have emitters, listeners, and emitbacks. The configuration supports an arrow syntax in each entry to help describe the flow (with pre/post hook designation support too). 

The syntax is as follows:
* **Emitters**: 
> preEmit hook] componentMethod + msg --> componentProp [postRx hook

→ The `preEmit` and `postRx` hooks are optional, but if using them, the "]" and "[" characters are needed so the plugin can parse them.

→ The `msg` is optional, but if using, must use the '+' character

→ The `componentMethod` is auto-created by the plugin and sends the event with the same name. If the `componentMethod` is named "getMessage" it sends the event "getMessage"

→ The `componentProp` is optional, but if entered, will be the property that will get set with the response, if a response comes back. This is optional too, and needs to be initially defined on the component, otherwise it won't get set. Vuejs will also complain if you try to render undefined props. If `componentProp` is omitted from the entry, the arrow "-->" can allso be omitted.

Note: as of v1.0.12, it is now also possible to call the emitter with an argument. So, if `getMessage` is called with args as `getMessage({ id: 123 })`, the args will be the message that gets sent. Args that are passed in takes priority over the referenced `msg`.

* **Listeners**: 
> 'preHook] listenEvent --> componentProp [postRx hook'

→ Both `preHook` and `postRx` hooks are optional. Here, `preHook` is called when data is received, but *before* setting componentProp. `postRx` hook is called 

→ If using the arrow syntax, when `listenEvent` is received, `componentProp` will get set with that event's data. If only the `listenEvent` is entered, then the plugin will try to set a property on the component of the same name. I.e., if `listenEvent` is "progressRxd", then the plugin will try to set `this.progressRxd` on the component.

→ Important NOTE: This syntax can now also work on the Vuex options for mutations and actions, which are also set up as listeners.

* **Emitbacks**:
> 'preEmitHook] emitEvt <-- watchProp [postAck hook'

→ `preEmitHook` and `postAck` hooks are optional. `preEmitHook` runs before emitting the event, `postAck` hook runs after receiving the acknolwedgement, if any..

→ `watchProp` is the property on the component to watch using "myObj.child.grandchild" syntax. Just like you would on the component. 

→ `emitEvt` is the event name to emit back to the server when the `watchProp` changes. If `watchProp` and the arrow "<--" are omitted, then `emitEvt` will double as the `watchProp`. 

→ Important NOTE: this syntax can now also work in the Vuex options for emitbacks, with ONE important difference. In Vuex (and Nuxt, specifically), the watch property path may require forward slashes "/". For example, if your stores folder has an "examples.js" file in it, with state properties "sample" and "sample2", watchProp would have to be specified as "examples/sample" and "examples/sample2". The exception to the rule is "index.js" which is treated as the stores root. I.e., "sample" in index.js would be referred to simply as "sample" and not "index/sample")

---

Consider the following configuration as an example:
In `nuxt.config.js`:
```
namespaces: {
  '/index': {
    emitters: ['getMessage2 + testMsg --> message2Rxd'],
    listeners: ['chatMessage2', 'chatMessage3 --> message3Rxd']
  },
  '/examples': {
    emitBacks: ['sample3', 'sample4 <-- myObj.sample4'],
    emitters: [
      'reset] getProgress + refreshInfo --> progress [handleDone'
    ],
    listeners: ['progress']
  }
}
```

1. First, let's analyze the `/index` config. 
* Emitters:
When `getMessage()` is called, the event "getMessage" will be sent with component's data `this.testMsg`. `this.testMsg` should be defined on the component, but if it isn't no message will get sent (the plugin will warn when the component data is not defined). When a response is received, `this.messageRxd` on the component will get set to that response.

* Listeners: 
When `chatMessage2` is received, `this.chatMessage2` on the component will be set. When `chatMessage3` is received, the mapped property `this.message3Rxd` will be set.

2. Let's analyze the `/examples` config.
* Emitbacks: 
When `this.sample3` changes in the component, the event `sample3` will be emitted back to the server. When `this.myObj.sample4` changes in the component, the mapped event `sample4` will be emitted back.

* Emitters:
When `this.getProgress()` is called, *first* `this.reset()` will be called (if it's defined) and *then* the event "getProgress" will be emitted with the message `this.refreshInfo`. When the response is received, this.progress will get set to the response, and then `this.handleDone()` will be called (if it's defined)

* Listeners:
When event "progress" is received, `this.progress` will get set to that data.

## Usage in components or pages: [↑](#nuxt-socket-io)

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

## Socket Status [↑](#nuxt-socket-io)
Sometimes, it may be desired to check the status of the socket IO connection. Fortunately, the Socket.IO client API emits events to help understand the status:

```
const clientEvts = [
  'connect_error', 
  'connect_timeout',
  'reconnect',
  'reconnect_attempt',
  'reconnecting',
  'reconnect_error',
  'reconnect_failed',
  'ping',
  'pong'
]
```

If it is desired to check the status, you can simply opt-in by defining the property `socketStatus` on the same component that instantiates nuxtSocket. The plugin will then automatically set that status (it will use the camel-cased versions of the event names as prop names). If it is desired to use a prop name other than `socketStatus`, simply specify the `statusProp` when specifying the `ioOpts`:

Examples:

```
data() {
  return {
    socketStatus: {},
    badStatus: {}
  }
},
mounted() {
  this.goodSocket = this.$nuxtSocket({
    name: 'goodSocket',
    channel: '/index',
    reconnection: false
  })

  this.badSocket = this.$nuxtSocket({
    name: 'badSocket',
    channel: '/index',
    reconnection: true,
    statusProp: 'badStatus'
  })
}
```

As a convenience, a SocketStatus.vue component is now also packaged with nuxt-socket-io, which will help visualize the status:

```
<socket-status :status="socketStatus"></socket-status>
<socket-status :status="badStatus"></socket-status>
```

## Error Handling [↑](#nuxt-socket-io)

Sometimes, errors will occur. Two main categories of errors can be thought of as: 1) timeouts, and 2) non-timeout related. The plugin allows the user to take advantage of new built-in error handling features.

1.Handling timeout errors: The user opts-in to let the plugin handle timeout errors by specifying an `emitTimeout (ms)` in the IO options when instantiating the nuxtSocket:

```
this.socket = this.$nuxtSocket({ channel: '/examples', emitTimeout: 1000 }) // 1000 ms
```

Then, if an emitTimeout occurs, there are two possible outcomes. One is, the plugin's method will reject with an 'emitTimeout' error, and it will be up to the user to catch the error downstream:

```
this.someEmitMethod() 
.catch((err) => { // If method times out, catch the err
  /* Handle err */
})
```

Alternatively, another outcome can occur if the user defines a property `emitErrors` on the component *and* the server responds with an error (see below), in which case the plugin won't throw an error, but will in stead *set* that property (`emitErrors`). This may result in much cleaner code, and may make it easy to work with component computed properties that change when `emitErrors` property changes:

```
data() {
  emitErrors: { // Emit errors will get collected here now, if resp.emitError is defined
  }
}
...
this.someEmitMethod() // Now, when this times out, emitErrors will get updated (i.e., an error won't be thrown)
```

Important NOTE: in order for `this.emitErrors` to get updated, the server must send it's error response back as an *object*, and set a property `emitError` with the details. 

2. Handling non-timeout errors, such as bad requests, or anything specific to your application's backend. Again, like before, if `emitErrors` is defined, that will get set, otherwise, the emitError will get thrown.

If the user would prefer to use a different name for the emitErrors prop, he can do so by specifying `emitErrorsProp` in the ioOptions:

```
data() {
  myEmitErrors: { // Emit errors will get collected here now
  }
}

mounted() {
  this.socket = this.$nuxtSocket({ emitErrorsProp: 'myEmitErrors' })
}
```

## Debug Logging [↑](#nuxt-socket-io)

Debug logging is made possible with the help of the npm module [debug](https://github.com/visionmedia/debug). Fortunately, `socket.io-client` under the hood also uses that same module and allows us to enable debug logging there too. 

To enable debug logging on the nuxt-socket-io module, set the localStorage.debug variable:

> localStorage.debug = 'nuxt-socket-io' // Debug just the plugin

To enable debug logging in socket.io-client too, specify it:
> localStorage.debug = 'nuxt-socket-io, socket.io-client:socket' // Debug even more (socket.io-client logs too)

More documentation can be found [here](https://socket.io/docs/logging-and-debugging/)

Please remember to disable debug logging in production code! My recommendation is to enable debug logging in Chrome dev tools rather than in your own code. This helps ensure localStorage settings stay local to your machine:

![debug_log_setting](https://user-images.githubusercontent.com/5906351/72652017-875f0e80-3942-11ea-8aae-c475034797f8.jpg)

## Console Warnings [↑](#nuxt-socket-io)

To prevent developers from shooting themselves in the foot, console warnings are enabled by default when not in production mode. They can be muted in a variety of ways.

1. The best way to stop seeing the warnings is to resolve the issue that is being complained about. The plugin was configured a certain way in `nuxt.config` and the plugin will complain when props are not defined but should be. 

2. Most browsers allow the filtering of logs by log level. To hide warnings, you can uncheck the "warnings" under "log level":
![Screenshot from 2020-02-06 12-52-14](https://user-images.githubusercontent.com/5906351/73973433-c77d3580-48df-11ea-809b-6746a93eca2b.png)

3. While the previous method will be the fastest way to show/hide warnings, that approach will also show/hide *all* console warnings, which may not be desired. If it is only desired to hide this plugin's console warnings, you can do so with the `warnings: false` option. (This defaults to true):

```
io: {
  warnings: false, // disables console warnings
  sockets: [...]
}
```

## Auto Teardown [↑](#nuxt-socket-io)

The plugin, by default, has auto-teardown enabled. As you leave a component that has instantiated nuxtSocket, the plugin will first removeAllListeners (so that duplicates don't get re-registered), then it will close the connection, and then call your component's destroy lifecycle method. Also, while you are on the component, a listener will also be registered for the 'disconnect' event from the server so that it can close it's end of the connection.

If you do not wish to have this behavior, you can disable it by setting `teardown` to false when you instantiate the nuxtSocket:

```
const socket = this.nuxtSocket({ channel: '/index', teardown: false })
```

You may want to disable the auto-teardown if you are planning on re-using the socket. However, it should be noted that socket.io-client under the hood will *already* try to re-use a single connection when using different namespaces for the same socket. I personally think it is easier to manage code for the different namespaces and to configure namespaces as described above; i.e., each component gets its own set of "mouths and ears". If your coding style is different and you would still insist on disabling the auto-teardown, then just rememeber it becomes your responsibility to properly removeListeners and perform cleanup.

## Build Setup [↑](#nuxt-socket-io)

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

For detailed explanation on how things work, check out:
- [Nuxt.js docs](https://nuxtjs.org).
- [Socket.io docs](http://socket.io/docs)
- [Vuex docs](https://vuex.vuejs.org/guide)
