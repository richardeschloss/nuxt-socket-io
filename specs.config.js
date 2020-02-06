export default {
  require: ['@babel/register', './test/specs.setup.js'],
  files: ['test/specs/Module.spec.js', 'test/specs/Plugin.spec.js'],
  sources: ['**/*.{js,vue}'],
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
