import path from 'path'
import consola from 'consola'
import test from 'ava'
import NuxtSocketMod from '@/io/module'
import { getModuleOptions } from '@/test/utils'

const srcDir = path.resolve('.')
const modOptions = getModuleOptions('io/module')

test('Module adds plugin correctly', (t) => {
  consola.log('Testing with moduleOptions:', modOptions)
  return new Promise((resolve) => {
    const simpleNuxt = {
      addPlugin({ src, fileName, options }) {
        consola.log('options', options)
        t.is(src, path.resolve(srcDir, 'io/plugin.js'))
        t.is(fileName, 'nuxt-socket-io.js')
        resolve()
      },
      options: {
        srcDir,
        modules: []
      },
      registerMod: NuxtSocketMod
    }
    simpleNuxt.registerMod(modOptions)
  })
})
