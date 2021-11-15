export default {
  serial: true,
  files: [
    'test/Module.spec.js',
    'test/Plugin.spec.js',
    'test/SocketStatus.spec.js'
    // 'test/Demos.spec.js'
  ],
  nodeArguments: [
    '--experimental-loader=./test/utils/loaders.js'
  ],
  tap: false,
  verbose: true
}
