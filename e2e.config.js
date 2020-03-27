export default {
  require: ['@babel/register', './test/e2e.setup.js'],
  serial: true,
  files: ['test/e2e/IOStatus.spec.js'],
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
