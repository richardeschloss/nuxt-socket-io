module.exports = {
  mode: 'universal',
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
  css: ['~/assets/main.css'],
  /*
   ** Plugins to load before mounting the App
   */
  plugins: [],
  /*
   ** Nuxt.js dev-modules
   */
  buildModules: [
    // Doc: https://github.com/nuxt-community/eslint-module
    '@nuxtjs/eslint-module'
  ],
  /*
   ** Nuxt.js modules
   */
  modules: [
    // Doc: https://bootstrap-vue.js.org
    'bootstrap-vue/nuxt',
    '~/io/module'
  ],
  io: {
    sockets: [
      {
        name: 'heroku',
        url: 'https://nuxt-socket-io-server.herokuapp.com',
        default: process.env.DEPLOY === 'GH_PAGES',
        vuex: {
          mutations: [{ progress: 'examples/SET_PROGRESS' }],
          actions: [{ chatMessage: 'FORMAT_MESSAGE' }],
          emitBacks: [
            'examples/sample',
            { 'examples/sample2': 'sample2' },
            'titleFromUser'
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
          },
          '/rooms': {
            emitters: ['getRooms --> rooms']
          },
          '/room': {
            emitters: [
              'joinRoom + joinMsg --> roomInfo',
              'leaveRoom + leaveMsg'
            ],
            listeners: ['joinedRoom [updateUsers', 'leftRoom [updateUsers']
          },
          '/channel': {
            emitters: [
              'joinChannel + joinMsg --> channelInfo',
              'leaveChannel + leaveMsg',
              'sendMsg + userMsg --> msgRxd [appendChats'
            ],
            listeners: [
              'joinedChannel [updateChannelInfo',
              'leftChannel [updateChannelInfo',
              'chatMessage [appendChats'
            ]
          }
        }
      },
      {
        name: 'home',
        url: 'http://localhost:3000',
        default: process.env.DEPLOY !== 'GH_PAGES',
        vuex: {
          mutations: [{ progress: 'examples/SET_PROGRESS' }],
          actions: [{ chatMessage: 'FORMAT_MESSAGE' }],
          emitBacks: [
            'examples/someObj',
            'examples/sample',
            { 'examples/sample2': 'sample2' },
            'titleFromUser'
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
          },
          '/rooms': {
            emitters: ['getRooms --> rooms']
          },
          '/room': {
            emitters: [
              'joinRoom + joinMsg --> roomInfo',
              'leaveRoom + leaveMsg'
            ],
            listeners: ['joinedRoom [updateUsers', 'leftRoom [updateUsers']
          },
          '/channel': {
            emitters: [
              'joinChannel + joinMsg --> channelInfo',
              'leaveChannel + leaveMsg',
              'sendMsg + userMsg --> msgRxd [appendChats'
            ],
            listeners: [
              'joinedChannel [updateChannelInfo',
              'leftChannel [updateChannelInfo',
              'chatMessage [appendChats'
            ]
          }
        }
      },
      { name: 'goodSocket', url: 'http://localhost:3000' },
      { name: 'badSocket', url: 'http://localhost:3001' },
      { name: 'work', url: 'http://somedomain1:3000' },
      { name: 'car', url: 'http://somedomain2:3000' },
      { name: 'tv', url: 'http://somedomain3:3000' },
      {
        name: 'test',
        url: 'http://localhost:4000',
        vuex: {
          mutations: [{ progress: 'examples/SET_PROGRESS' }],
          actions: [{ chatMessage: 'FORMAT_MESSAGE' }],
          emitBacks: ['examples/sample', { 'examples/sample2': 'sample2' }]
        }
      }
    ]
  },
  /*
   ** Build configuration
   */
  build: {
    /*
     ** You can extend webpack config here
     */
    extend(config, ctx) {},
    parallel: false,
    cache: false,
    hardSource: false
  },
  globals: {
    loadingTimeout: 5000
  },
  generate: {
    dir: '/tmp/netlify/nuxt-socket-io-demos'
  }
}
