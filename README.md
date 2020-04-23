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
4. [Usage](#usage-)
5. [IO Server Registration](#io-server-registration-)
6. [Socket Status](#socket-status-)
7. [Error Handling](#error-handling-)
8. [Debug Logging](#debug-logging-)
9. [Console Warnings](#console-warnings-)
10. [Auto Teardown](#auto-teardown-)
11. [$nuxtSocket Vuex Module](#nuxtsocket-vuex-module-)
12. [Socket Persistence](#socket-persistence-)
13. [Dynamic API Overview](#dynamic-api-overview-)
14. [Dynamic API Registration](#dynamic-api-registration-)
15. [Build Setup](#build-setup-)
16. [Testing](#testing-)
17. [Contributing](https://github.com/richardeschloss/nuxt-socket-io/blob/gh-pages/CONTRIBUTING.md)

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

### Defaults

* URL - As of v1.0.24, If url is omitted, it will default to `window.location`

### Overrides (Vuex Opts)

As of v1.0.23, it is possible to now specify the vuex options when you instantiate the $nuxtSocket, using the "vuex" property:

```
mounted() {
  this.socket = this.$nuxtSocket({
    name: 'home',
    vuex: { // overrides the vuex opts in the nuxt.config above.
      mutations: ['examples/SET_PROGRESS'],
      actions: ['FORMAT_MESSAGE'],
      emitBacks: ['examples/sample']
    }
  })
}
```

You may prefer to maintain the vuex options like this instead of in the nuxt.config. The vuex options defined in the instance will override the vuex options in the config for a given socket. Best practice is to keep things clean and avoid duplicating entries.

## Configuration (Namespaces) [↑](#nuxt-socket-io)

It is also possible to configure [namespaces](https://socket.io/docs/rooms-and-namespaces/) in `nuxt.config`. Each socket set can have its own configuration of namespaces and each namespace can now have emitters, listeners, and emitbacks. The configuration supports an arrow syntax in each entry to help describe the flow (with pre/post hook designation support too).

The syntax is as follows:
* **Emitters**:
> preEmit hook] componentMethod + msg --> componentProp [postRx hook

→ The `preEmit` and `postRx` hooks are optional, but if using them, the "]" and "[" characters are needed so the plugin can parse them. As of v1.0.20, if the preEmit hook returns `false`, it will be treated as a *validation failure* and the emit event will not get sent. Also, the preEmit hook will get the same "msg" data that will get sent with the emit event, in case it needs to be modified.

→ The `msg` is optional, but if using, must use the '+' character

→ The `componentMethod` is auto-created by the plugin and sends the event with the same name. If the `componentMethod` is named "getMessage" it sends the event "getMessage"

→ The `componentProp` is optional, but if entered, will be the property that will get set with the response, if a response comes back. This is optional too, and needs to be initially defined on the component, otherwise it won't get set. Vuejs will also complain if you try to render undefined props. If `componentProp` is omitted from the entry, the arrow "-->" can also be omitted.

Note: as of v1.0.12, it is now also possible to call the emitter with an argument. So, if `getMessage` is called with args as `getMessage({ id: 123 })`, the args will be the message that gets sent. Args that are passed in takes priority over the referenced `msg`.

* **Listeners**:
> 'preHook] listenEvent --> componentProp [postRx hook'

→ Both `preHook` and `postRx` hooks are optional. Here, `preHook` is called when data is received, but *before* setting componentProp. `postRx` hook is called

→ If using the arrow syntax, when `listenEvent` is received, `componentProp` will get set with that event's data. If only the `listenEvent` is entered, then the plugin will try to set a property on the component of the same name. I.e., if `listenEvent` is "progressRxd", then the plugin will try to set `this.progressRxd` on the component.

→ Important NOTE: This syntax can now also work on the Vuex options for mutations and actions, which are also set up as listeners.

* **Emitbacks**:
> 'preEmitHook] emitEvt <-- watchProp [postAck hook'

→ `preEmitHook` and `postAck` hooks are optional. `preEmitHook` runs before emitting the event, `postAck` hook runs after receiving the acknolwedgement, if any. As of v1.0.21, if the preEmit hook returns `false`, it will be treated as a *validation failure* and the emit event will not get sent. Also, the preEmit hook will get the same "msg" data that will get sent with the emit event, in case it needs to be modified.

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

### Overrides (Namespace Config)

It may turn out that you would prefer to define the namespace config when you instantiate the $nuxtSocket instead of in your `nuxt.config`. As of v1.0.23, this is now possible with the "namespaceCfg" prop:

```
mounted(){
  this.socket = this.$nuxtSocket({
    name: 'home',
    channel: '/examples',
    namespaceCfg: { // overrides the namespace config of "examples" above
      emitters: [],
      listeners: [],
      emitBacks: []
    }
  })
}
```


## Usage: [↑](#nuxt-socket-io)

In order to use nuxtSocket in your components or pages, it's a matter of instantiating it:

```
this.socket = this.$nuxtSocket({
  // options
})
```

The options that the plugin will use are:

* name - [string] name of the socket. If omitted, the default socket will be used
* channel - [string] the channel (a.k.a namespace) to connect to. Defaults to ''.
* teardown - [boolean] specifies whether to enable or disable the "auto-teardown" feature (see section below). Defaults to true.
* statusProp - [string] specifies the property in [this] component that will be used to contain the socket status. Defaults to 'socketStatus' (referring to an object).
* emitTimeout - [number] specifies the timeout in milliseconds for an emit event, after which waiting for the emit response will be canceled. Defaults to undefined.
* emitErrorsProp - [string] specifies the property in [this] component that will be used to contain emit errors (see section below). Defaults to 'emitErrors' (referring to this.emitErrors, an object of arrays)
* [All other options] - all other options that are supported by socket.io-client will be passed down to socket.io client and respected. Please read their [docs](https://socket.io/docs/client-api/). But please note, if you specify *url* here, it won't be used because you already specified the IO server url in nuxt.config. The idea is, abstract out the actual url from the code. Just connect to "yourSocket" and use it. Helps make the code much easier to read and maintain. If you have an API that lives at a specific path, you can use the "path" option for this purpose (please also refer to [issue 73](https://github.com/richardeschloss/nuxt-socket-io/issues/73) to learn more).

The return value is an actual socket.io-client instance that can be used just like any socket.io-client. So, `this.socket.emit` and `this.socket.on` will be defined just as you would expect.

Here are some examples:


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

If it is desired to use nuxtSocket globally, which this author discourages, one way to do so is to commit an instance of nuxtSocket in Vuex, with "teardown" option set to false so that I can be re-used throughout the app. Then, you can simply dispatch Vue actions which would contain the "socket.emit" code. This an interesting approach, but just remember you will be responsible for closing your sockets and performing cleanup (since teardown will be set to false). See the section on teardown feature, [feat/reuse branch](https://github.com/richardeschloss/nuxt-socket-io/tree/feat/reuse) and also [issue 62](https://github.com/richardeschloss/nuxt-socket-io/issues/62) for more details.

## IO Server Registration [↑](#nuxt-socket-io)

As of v1.0.25, it will be possible to automatically start an IO server simply based on the existence of an IO server file and folder. Inspired by the way Nuxt creates routes based on your "pages" directory, server-side IO services will be automatically registered if your "server" directory contains a file "io.js" and folder "io":

```
[appRoot]/
- server/
  - io/
    - namespace1.js
    - namespace2.js
  - io.js
```

Then, `io.js` will be registered as the IO service for IO clients that connect to '' or '/' (root), while the namespace .js files in `server/io/*.js` will be registered as the IO services for IO clients that connect to those namespaces. So, in the example above, `namespace1.js` would handle IO clients that connect to namespace `/namespace1`, while `namespace2.js` would handle IO clients that connect to namespace `/namespace2`.

### IO Service Format: (important)

Each IO service file must export a default service function to be used by the module and it should have the following format:

```
// Inside each ".js" file above, the module expects this at a bare-minimum
export default function(socket, io) { 
  return Object.freeze({})
}
```

In the above snippet, the *module* will give you the socket and io instances in case you need them. There is no need to start the IO server yourself, since the module is simply piggy-backing off the Nuxt server once that server starts listening. All you need to do is build out the service.

Ideally you would build out your service like this:

```
// An example svc:
export default function(socket, io) { 
  return Object.freeze({
    /* Just define the methods here */
    fn1(msg) { 
      return { status: 'ok' }
    },
    async fn2(msg) { 
      const users = await getUsers(msg)
      return users
    },
    fn3(msg) {
      return new Promise((resolve, reject) => {
        someTimeConsumingFunction(msg, (err, progress) => {
          if (err) {
            reject(err)
          } else {
            socket.emit('progress', progress)
            if (progress === 1) {
              resolve(progress)
            }
          }
        })
      })
    }
  })
}
```

In the above example, the code is really easy to read and write. The function names here are mapped to the socket IO *event* names that are received. So, when an IO client emits an event "fn1" with data "msg", the "fn1" will be called with "msg". Likewise, when "fn2" is emitted, "fn2" will be run. Also, your functions can be promisified or not, the module will wait for promises to resolve, if there are any. It will also *catch* any error you throw, sending back a JSON object as response, with the `resp.emitError` set to your `err.message`. So, when "fn3" is emitted, it will be called with "msg" and it will take some time to run. As that function provides it's notification back in the form of "err" and "progress", we can "socket.emit" that progress back to the IO client as we wait for the function to complete. If for any reason that fn3 fails, the module will catch the error and respond with that "emitError".

** A Helpful Tip **: Running just "nuxt" won't watch for changes on the server. If you wish to keep having the server restart when you make server-side changes you'll want to run "npm run dev:server" which I have defined as:

```
// package.json
"scripts": {
  "dev:server": "cross-env NODE_ENV=development nodemon server/index.js --watch server"
}
```

(See my [server/index.js](https://github.com/richardeschloss/nuxt-socket-io/blob/master/server/index.js) to see how I start Nuxt using their API)


### IO Server Overrides

The default behavior above can be simply overridden in nuxt.config with one prop "server":

```
io: {
  server: [your overrides here],
  sockets: []
}
```

* Setting `io.server` to `false` completely disables the feature.
* Setting `io.server` to `{ ioSvc: '/my/io/svc' }` will cause the module to instead look for file `/my/io/svc.js` and folder `/my/io/svc` for your IO services (instead of `/server/io.js` and `/server/io`)

If you wish to still start the IO server on your own, the module exports a `register.server` function which you can use: 

```
import http from 'http'
import { register } from 'nuxt-socket-io'

// Options can be host, port, ioSvc, nspDir:
const myIOServer = register.server({ port: 3001 }) // your IO server, to start http server, listening on 3001

// YOu can also provide your own server instance if you want:
const httpServer = http.createServer()
const myIOServer2 = register.server({ port: 3002 }, httpServer) // use your server instead
```

Both IO servers would still register your ioSvc file and folder so you can continue using those even when Nuxt isn't running. In fact, this is exactly what some of my automated tests rely on.

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

## $nuxtSocket Vuex Module [↑](#nuxt-socket-io)

As of v1.0.22, the plugin will now register a namespaced Vuex module "$nuxtSocket" if it does not already exist. If planning to use the module, the name "$nuxtSocket" should be considered reserved. Disabling this is discouraged. 

The module will build out the following states which can then be accessed by `$store.state.$nuxtSocket[prop]`, where prop is one of:

1. `clientApis`: contains the client apis for each component See the section on client APIs for more details.
2. `ioApis`: contains the server apis for each IO server. See the section on server APIs for more details
3. `sockets`: contains the persisted sockets, if any. See the section on persistence for more details.
4. `emitErrors`: contains emit errors that have occurred, organized by the socket label, and then by the emit event.
5. `emitTimeouts`: contains emit timeouts that have occurred, organized by the socket label and then by the emit event.

The mutations are used internally by the plugin and it is advised to avoid committing these mutations yourself. 

The actions registered by the plugin are:

1. `emit`: emits the specified event with a supplied message for a specified socket. This can be useful when you want to re-use the persisted socket throughout the app without having to re-instantiate nuxtSocket. You simply dispatch the "emit" action. 

For example, in one component, you may initialize the nuxtSocket instance:

comp1.vue:
```
mounted() {
  this.socket = this.$nuxtSocket({
    channel: '/myRoom',
    persist: 'mySocket', // Persist the socket with label "mySocket"
  })
}
```

Inside that same component, you can dispatch the emit action like:
```
methods: {
  async doStuff() {
    await this.$store.dispatch(
      '$nuxtSocket/emit', // Remember, "emit" is namespaced to "$nuxtSocket"
      {
        socket: this.socket, // action requires either the socket instance *or* the label
        // label: 'mySocket', // Use persisted socket "mySocket"
        evt: 'getStuff',
        msg: { items: ['Milk', 'Sugar'] }
      }
    )
  }
}
```

Alternatively, in another component, you may wish to re-use that socket, and emit events on that connection. To do so, you would simply dispatch the emit event: (and you wouldn't need the socket instance, just the label identifier)

comp2.vue: 
```
methods: {
  async someFunc() {
    await this.$store.dispatch(
      '$nuxtSocket/emit', // Remember, "emit" is namespaced to "$nuxtSocket"
      {
        label: 'mySocket', // Use persisted socket "mySocket"
        evt: 'getStuff',
        msg: { items: ['Milk', 'Sugar'] }
      }
    )
  }
}
```

The advantages of doing it this way are: you don't have to re-instantiate the socket, you just use it. Also, the action is promisified, so you can async/await with the action (whereas the `socket.emit` method uses callbacks). And, built-into the "emit" vuex action is error handling for timeouts and other errors, in manner very similar to that described in the "Error Handling" section above.

To handle emit errors, you can specify an `emitTimeout` in the `$nuxtSocket` instance options *or* in the object that gets sent to vuex action:

```
methods: {
  async someFunc() {
    await this.$store.dispatch(
      '$nuxtSocket/emit', // Remember, "emit" is namespaced to "$nuxtSocket"
      {
        label: 'mySocket', // Use persisted socket "mySocket"
        evt: 'getStuff',
        msg: { items: ['Milk', 'Sugar'] },
        emitTimeout: 1000 // Timeout after 1000 ms
      }
    )
  }
}
```

Then, when errors occur, one of the following outcomes will occur. If you provided a *label*, the error will simply get logged to either "emitTimeouts" or "emitErrors", depending on whether or not the error was timeout or non-timeout related. If you only provided a socket instance but no label, the action's promise will reject with the error, and it will be up to you to catch and handle. At any time you need to inspect the errors, the easiest way is to use Vue dev tools, and inspect vuex (and inspect the $nuxtSocket module)


## Socket Persistence [↑](#nuxt-socket-io)

As of v1.0.22, there is now a means to persist instantiated sockets, as was mentionned in the previous section, using the "persist" option. The "persist" option can be either a boolean or a string, where if it is a string, that string will be used as the label for that socket. Every other part of your app would reference that label to reuse the socket.

If the value provided is a boolean and set to `true`, then the plugin will automatically create the label "[socketname][namespace]" for you. Below are examples, assuming the following nuxt config:

nuxt.config:

```
io: {
  sockets: [{
    url: 'http://localhost:3000' // This is the default socket with name "dflt" because it's the first entry
  }, {
    name: 'home',
    url: 'http://localhost:4000'
  }]
}
```

* If persist is set to `true`:

```
this.socket1 = this.$nuxtSocket({
  persist: true // This will be persisted with label "dflt" (no name or channel specified)
})

this.socket2 = this.$nuxtSocket({
  namespace: '/examples'
  persist: true // This will be persisted with label "dflt/examples" (no name specified)
})

this.socket3 = this.$nuxtSocket({
  name: 'home',
  namespace: '/examples'
  persist: true // This will be persisted with label "home/examples" (both name and channel specified)
})
```

* If persist is set to a *string*:

```
this.mySocket = this.$nuxtSocket({
  persist: 'mySocket' // This will be persisted with label "mySocket". It will use the default socket
})
```

Then, at any time to re-use those sockets, you access them from Vuex using the corresponding labels:

```
var reusedSocket = this.$store.state.$nuxtSocket.mySocket // Re-use "mySocket"
```

It should be noted that by *enabling* persistence, the *teardown* feature will be disabled because it is assumed you want to re-use the socket. You will be responsible for the teardown steps where you feel it's appropriate. If you still desire the auto teardown feature, you can pass true to the "teardown" option and it will be respected.

Examples:

```
this.socket1 = this.$nuxtSocket({
  persist: true // Socket will be persisted, teardown disabled
})

this.socket2 = this.$nuxtSocket({
  persist: true, // Socket will be persisted...but...
  teardown: true // ...explicitly setting teardown will override the default behavior
})
```


## Dynamic API Overview [↑](#nuxt-socket-io)

This is a lengthy, potentially advanced topic. Pleaser refer to the article [Rethinking Web APIs to be Dynamic and Run-Time Adaptable](https://medium.com/javascript-in-plain-english/re-thinking-web-apis-to-be-dynamic-and-run-time-adaptable-a1e9fb43cc4) for more details.

## Dynamic API Registration [↑](#nuxt-socket-io)

This is a lengthy, potentially advanced topic. Please refer to the article [Nuxt Socket.IO: The Magic of Dynamic API Registration](https://medium.com/@richard.e.schloss/nuxt-socket-io-the-magic-of-dynamic-api-registration-9af180383869) for more details.

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


## Testing [↑](#nuxt-socket-io)

1a) Testing your apps that use nuxt-socket-io: (full-mock approach)

The easiest way to test your components is to do so in isolation, using [vue-test-utils](https://vue-test-utils.vuejs.org/). If you treat your component as being completely separated from a backend, you can still test that works correctly by injecting the data it needs and observing the output. Fortunately, with vue-test-utils, it is extremely straightforward to mock methods and properties: just specifiy the mocks in the `mocks` property.

So, for example, suppose you have the following code in your component: (this is taken directly from my chat rooms example)

```
mounted() {  // Mounted
  this.socket = this.$nuxtSocket({ channel: '/rooms' })
  this.getRooms()
}
```

We want to test this block of code. Normally, the plugin would return a socket.io-client instance, and also define the `getRooms` method if it were configured as an emitter in `nuxt.config`. The `getRooms` method would be expected to emit an event "getRooms". Our test should be written to verify this: (the example below shows ava-style assertions)

```
import Rooms from '@/pages/rooms'

...

let actualRooms
const expectedRooms = [{ name: 'general' }]
const localVue = createLocalVue()
const called = { emit: {}, on: {} } // Create an object to register called methods
function SocketIOClient(channel) {  // Dummy client
  return {
    channel,
    emit(evt, msg, cb){
      if (!called.emit[evt]) {
        called.emit[evt] = []
      }
      called.emit[evt].push({ msg })   
      cb()
    },
    on(evt, cb) {
      if (!called.on[evt]) {
        called.on[evt] = []
      }
      called.on[evt].push({ msg })   
      cb()
    }
  }
}
const client = new SocketIOClient(channel)
const wrapper = mount(Rooms, { 
  localVue,
    mocks: {
      $nuxtSocket({ channel }) {
        return client
      },
      getRooms() {
        client.emit('getRooms', {}, () => {
          actualRooms = expectedRooms
        })
      }
    }
})
// Check if this.socket is a SocketIOClient()
// We do this accessing the wrapper's properties on the view model (`wrapper.vm`)
const { socket } = wrapper.vm
t.is(socket.constructor.name, 'SocketIOClient')
t.is(socket.channel, '/rooms')
t.is(called.emit['getRooms'].length, 1)

// Check if actualRooms === expectedRooms after mounting component
expectedRooms.forEach(({ name, idx }) => {
  t.is(name, actualRooms[idx].name)
})

```

Running the test in isolation like this has its benefits. It doesn't require an external sources to verify that it works. When the page is mounted, the methods we expected to be called get called. This allows this test to run very quickly, as we don't need to wait for servers to start up. If running the tests in watch-mode, this can greatly accelerate development (if using a test-driven approach).

However, testing like this can also have a downside of requiring the developer to "mock the planet" just to test one component. It's not that obvious from the above example, but if the component were to contain many more emitters or listeners, this much mocking can turn out to be a drag. The next section describes an alternative approach. The trade-off is: while the developer will have a test that runs more slowly (due to setup times), it may end up being much less test code that runs.


1b) Testing your apps that use nuxt-socket-io: (compile and inject the real plugin)

It may be likely that you want to actually inject the NuxtSocket plugin and re-use IO configs in your tests, perhaps using a socket that consumes data from a test provider. If so, you will need to first compile the plugin and then import it. Currently, this repo has a compile method in "test/utils.js" (which I will try to properly deploy in the next release (and someday in [nuxt-test-utils](https://github.com/richardeschloss/nuxt-test-utils)), but if you need it asap please download [here](https://github.com/richardeschloss/nuxt-socket-io/blob/master/test/utils.js), patience requested :) ):

The plugin can be compiled like this:

```
import { compilePlugin, injectPlugin } from 'nuxt-socket-io/test/utils' // or @/test/utils, if using local copy
// import { compilePlugin, injectPlugin } from 'nuxt-test-utils' // <-- someday, it will be this instead... hopefully... :)

import config from '@/nuxt.config' // Read in nuxt config so we can pass the io opts to the plugin

const { io } = config

compilePlugin({
  src: pResolve('./node_modules/nuxt-socket-io/io/plugin.js'), 
  tmpFile: pResolve('/tmp/plugin.compiled.js'),
  options: io,
  overwrite: true // If you change the options, you'll have to overwrite the compiled plugin
})
```

If Vuex options were also specified in the nuxt config, you may also want to use the configured store which is easy to import:

```
import { state as indexState, mutations, actions } from '@/store/index'
import {
  state as examplesState,
  mutations as examplesMutations
} from '@/store/examples'

const vuexModules = { // Only needed if using nested stores (i.e., "vuex modules")
  examples: {
    namespaced: true,
    state: examplesState(),
    mutations: examplesMutations
  }
}
```

The store can then be defined:
```
let store = new Vuex.Store({
  state,
  mutations,
  actions,
  modules: vuexModules
})
```

...And then the store and compiled plugin can be injected into the component that would need it:
```
const wrapper = shallowMount(YourComponent, {
  store, // Vuex store
  localVue,
  stubs: {
    'nuxt-child': true // needed if you have DOM elements that need to be stubbed
  },
  mocks: {
    // ...mocks here...
    // inject the plugin so that this.$nuxtSocket will be defined:
    $nuxtSocket: await injectPlugin({}, Plugin)
  }
})
```

Now, you're test will have an actual nuxtSocket instance defined that you can use with a real IO server dedicated for testing purposes.

Again, you may have noticed a bit of extra work here, and the abuse of the term "mock" here, since a real compiled plugin is being used. While this makes the component less isolated from external factors, it can help cover more ground when testing, in a single test, so it's up to the developer to decide what trade-offs are worth making.


2) Running tests in this repository:

When in doubt, always look at the ".gitlab-ci.yml" file, which will always contain the latest commands for driving the tests. This repository uses the Ava test framework because it's awesome and fast. "npm test" will first run the "specs" tests and then the "e2e" tests, both for coverage. 

* "specs" testing: tests the module and the plugin, and is configured by "specs.config.js" and will first run the specs.setup.js. The setup first compiles the plugin, and then initializes an IO server, which comes in handy for testing real IO events sent by the client. The "specs.config" file also specifies the files to run for tests. When trying to troubleshoot a single test, it's useful to run "npm run test:specs:watch" will simply run tests on file changes. Since recompiling the plugin will always change the file tree, it may be desirable to compile the plugin to a folder outside the workspace (i.e., "/tmp") or to disable the overwriting of the compiled plugin (overwrite: false). 

* "e2e" testing: tests the components and pages, but the only test that gets run by the CI/CD system is for the IOStatus.vue component, since that gets packaged with the distribution. Like the specs testing, the e2e config compiles the plugin, only if the compiled plugin doesn't already exist (because the specs tests may have compiled it already). The e2e.setup.js starts IO server(s) and creates a browser environment with JSDOM support, so that we can work with a DOM (when components get mounted, they get mounted to the DOM, and we need a means for querying DOM attributes on elements). "vue" extensions are registered so that ".vue" makes sense to babel, which transpiles our tests.

If changes are to be made to either "specs.config" or "e2e.config" to isolate a given file for testing, the developer needs to remember to revert the changes back so all files get tested again by the CI system.