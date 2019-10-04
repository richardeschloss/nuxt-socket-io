# nuxt-socket-io

> Nuxt with basic socket.io examples

Current status: works on machine, patience please as I get this to be more "npm-friendly"

Automated tests would be nice...if anyone wants to help with that :)

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

Note: `npm run dev` will just run nuxt (you'd have to implement the io server separately and remember to allow the client's origin. Explanation coming)

# build for production and launch server
$ npm run build
$ npm run start

# generate static project
$ npm run generate
```

For detailed explanation on how things work, check out [Nuxt.js docs](https://nuxtjs.org).
