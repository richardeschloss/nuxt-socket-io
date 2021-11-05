export default {
  serial: true,
  files: [
    'test/Module.spec.js'
    // 'test/Plugin.spec.js'
  ],
  nodeArguments: [
    '--experimental-loader=./tsLoader.js'
  ],
  tap: false,
  verbose: true
}
