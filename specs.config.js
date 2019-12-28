export default {
  require: ['@babel/register', './test/specs.setup.js'],
  files: ['test/specs/**/*'],
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
