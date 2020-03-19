export default {
  require: ['@babel/register', './test/specs.setup.js'],
  files: [
    // 'test/specs/Module.spec.js',
    'test/specs/Plugin.spec.js'
  ],
  ignoredByWatcher: ['io/plugin.compiled.js'],
  babel: {
    testOptions: {
      plugins: [
        [
          'module-resolver',
          {
            root: ['.'],
            alias: {
              '@': '.',
              '~': '.'
            }
          }
        ]
      ]
    }
  },
  tap: false, // true,
  verbose: true
}
