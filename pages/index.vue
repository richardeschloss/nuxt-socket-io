<template>
  <div class="container index-container">
    <div>
      <h1 class="title">
        nuxt-socket-io
      </h1>
      <h2 class="subtitle">
        Nuxt with basic socket.io examples
      </h2>
      <p>
        <a href="https://www.npmjs.com/package/nuxt-socket-io" rel="nofollow"
          ><img
            src="https://camo.githubusercontent.com/887c1a47d359a1337b35e3c568f846eda89f15a2/68747470733a2f2f696d672e736869656c64732e696f2f6e706d2f762f6e7578742d736f636b65742d696f"
            alt="npm"
            data-canonical-src="https://img.shields.io/npm/v/nuxt-socket-io"
            style="max-width:100%;"
        /></a>
        <a href="https://www.npmjs.com/package/nuxt-socket-io" rel="nofollow"
          ><img
            src="https://camo.githubusercontent.com/31d12d8ec55dfcc32785bf425f3085a3ddfff270/68747470733a2f2f696d672e736869656c64732e696f2f6e706d2f64742f6e7578742d736f636b65742d696f"
            alt="npm"
            data-canonical-src="https://img.shields.io/npm/dt/nuxt-socket-io"
            style="max-width:100%;"
        /></a>
        <a
          href="https://gitlab.com/richardeschloss/nuxt-socket-io"
          rel="nofollow"
          ><img
            src="https://camo.githubusercontent.com/ae4e13b13b3a81f7242522ef74a47c2a063baf14/68747470733a2f2f6769746c61622e636f6d2f72696368617264657363686c6f73732f6e7578742d736f636b65742d696f2f6261646765732f6d61737465722f706970656c696e652e737667"
            alt=""
            data-canonical-src="https://gitlab.com/richardeschloss/nuxt-socket-io/badges/master/pipeline.svg"
            style="max-width:100%;"
        /></a>
        <a
          href="https://gitlab.com/richardeschloss/nuxt-socket-io"
          rel="nofollow"
          ><img
            src="https://camo.githubusercontent.com/dc0164a5dc073b69bc8f144d8755e4e4ff7ea467/68747470733a2f2f6769746c61622e636f6d2f72696368617264657363686c6f73732f6e7578742d736f636b65742d696f2f6261646765732f6d61737465722f636f7665726167652e737667"
            alt=""
            data-canonical-src="https://gitlab.com/richardeschloss/nuxt-socket-io/badges/master/coverage.svg"
            style="max-width:100%;"
        /></a>
        <a
          href="https://github.com/richardeschloss/nuxt-socket-io/blob/development/LICENSE"
          ><img
            src="https://camo.githubusercontent.com/0193c7aec674291ee296569a3ff12e3afd65ce06/68747470733a2f2f696d672e736869656c64732e696f2f6e706d2f6c2f6e7578742d736f636b65742d696f"
            alt="NPM"
            data-canonical-src="https://img.shields.io/npm/l/nuxt-socket-io"
            style="max-width:100%;"
        /></a>
      </p>
      <div class="links">
        <a
          href="https://richardeschloss.github.io/nuxt-socket-io/"
          target="_blank"
          class="button--green"
        >
          Documentation
        </a>
        <a
          href="https://github.com/richardeschloss"
          target="_blank"
          class="button--grey"
        >
          GitHub
        </a>
      </div>
    </div>
    <div>
      <messages style="height: 500px; overflow-y: scroll;"></messages>
      <nuxt-link to="examples">Thirsty for more examples?</nuxt-link>
      <br />
      <nuxt-link to="rooms">Feeling Ready for...Chat Rooms?</nuxt-link>
      <br />
      <nuxt-link to="ioStatus">When in doubt, check the IO Status</nuxt-link>
    </div>
  </div>
</template>

<script>
import Messages from '@/components/Messages.vue'

export default {
  components: {
    Messages
  }
}
</script>

<style scoped>
.index-container {
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.title {
  font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  display: block;
  font-weight: 300;
  font-size: 24px;
  color: #35495e;
  letter-spacing: 1px;
}

.subtitle {
  font-weight: 300;
  font-size: 22px;
  color: #526488;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}
</style>
