import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  // vite: {
  //   optimizeDeps: {
  //     include: [
  //       '@socket.io/component-emitter',
  //       // 'engine.io-client',
  //       'debug',
  //       'tiny-emitter/instance.js'
  //     ]
  //   }
  // },
  server: {
    host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost',
    port: process.env.PORT !== undefined
      ? parseInt(process.env.PORT)
      : 3000
  },
  telemetry: false,
  runtimeConfig: {
    io: {
      sockets: [
        {
          name: 'privateSocket',
          url: 'url2'
        }
      ]
    },
    public: {
      io: {
        sockets: [
          {
            name: 'publicSocket',
            url: 'url1'
          }
        ]
      }
    }
  },
  /*
   ** Global CSS
   */
  css: [
    '~/assets/bootstrap.min.css',
    '~/assets/main.css'
  ],
  /*
   ** Plugins to load before mounting the App
   */
  plugins: [],
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: [
    // '@nuxtjs/composition-api'
  ],
  /*
   ** Nuxt.js modules
   */
  modules: [
    // Doc: https://bootstrap-vue.js.org
    // 'bootstrap-vue/nuxt',
    '~/lib/module.js'
  ],
  io: {
    server: {
      // @ts-ignore
      // redisClient: true // uncomment to start redisClient
    //   cors: {
    //     credentials: true,
    //     origin: [
    //       'https://nuxt-socket-io.netlify.app',
    //       'http://localhost:3000' // TBD: added
    //     ]
    //   }
    },
    sockets: [
      {
        name: 'home',
        url:
          process.env.NODE_ENV === 'production'
            ? 'https://nuxt-socket-io.herokuapp.com'
            : 'http://localhost:3000', // Updated, //'http://localhost:3001', // Updated,
        // @ts-ignore
        iox: [
          'chatMessage --> chats/message',
          'progress --> examples/progress',
          'examples/sample <-- examples/sample',
          'examples/someObj', // Bidirectional
          'bidirectional'
        ],
        vuex: {
          mutations: ['progress --> examples/SET_PROGRESS'],
          actions: ['chatMessage --> io/FORMAT_MESSAGE'],
          emitBacks: [
            'examples/someObj',
            'examples/sample',
            'sample2 <-- examples/sample2',
            'io/titleFromUser' // TBD: update tests
          ]
        },
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
      },
      {
        name: 'chatSvc', // TBD: redundant?
        url:
          process.env.NODE_ENV === 'production'
            ? 'https://nuxt-socket-io.herokuapp.com'
            : 'http://localhost:3001'
      },
      { name: 'goodSocket', url: 'http://localhost:3001' },
      { name: 'badSocket', url: 'http://localhost:3002' },
      { name: 'work', url: 'http://somedomain1:3000' },
      { name: 'car', url: 'http://somedomain2:3000' },
      { name: 'tv', url: 'http://somedomain3:3000' },
      {
        name: 'test',
        url: 'http://localhost:4000',
        vuex: {
          mutations: ['progress --> examples/SET_PROGRESS'],
          actions: ['chatMessage --> FORMAT_MESSAGE'],
          emitBacks: ['examples/sample', 'sample2 <-- examples/sample2']
        }
      }
    ]
  }
})
