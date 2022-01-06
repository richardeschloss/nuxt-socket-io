import { defineNuxtConfig } from 'nuxt3'

export default defineNuxtConfig({
  vite: {
    optimizeDeps: {
      include: [
        'parseuri', // <-- updated this
        '@socket.io/component-emitter',
        'parseqs',
        'yeast',
        'engine.io-client',
        'backo2',
        'debug',
        'tiny-emitter/instance.js'
      ]
    }
  },
  server: {
    host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost',
    port: process.env.PORT !== undefined
      ? parseInt(process.env.PORT)
      : 3000
  },
  telemetry: false,
  publicRuntimeConfig: {
    /** @type {import('lib/types').NuxtSocketIoRuntimeOptions} */
    io: {
      sockets: [
        {
          name: 'publicSocket',
          url: 'url1'
        }
      ]
    }
  },
  privateRuntimeConfig: {
    /** @type {import('lib/types').NuxtSocketIoRuntimeOptions} */
    io: {
      sockets: [
        {
          name: 'privateSocket',
          url: 'url2'
        }
      ]
    }
  },
  /*
   ** Headers of the page
   */
  head: {
    title: process.env.npm_package_name || '',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: process.env.npm_package_description || ''
      }
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }]
  },
  /*
   ** Customize the progress-bar color
   */
  loading: { color: '#fff' },
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
  /** @type {import('lib/types').NuxtSocketIoOptions} */
  io: {
    server: {
      // @ts-ignore
      cors: {
        credentials: true,
        origin: [
          'https://nuxt-socket-io.netlify.app',
          'http://localhost:3000' // TBD: added
        ]
      }
    },
    sockets: [
      {
        name: 'home',
        url:
          process.env.NODE_ENV === 'production'
            ? 'https://nuxt-socket-io.herokuapp.com'
            : 'http://localhost:3001', // Updated
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
