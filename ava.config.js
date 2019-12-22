export default {
  require: ['@babel/register', './test/ava.setup.js'],
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
