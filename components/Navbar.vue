<template>
  <div style="position: fixed; top: 0px; background: white; width: 100%;">
    <div class="d-inline-block w-50">
      <Stats />
      <h1 class="title" v-text="'nuxt-socket-io'" />
    </div>
    <div class="d-inline-block float-right text-right">
      <nuxt-link to="/" v-text="'Demos Home'" /> |
      <nuxt-link to="/examples" v-text="'Basic Examples'" /> |
      <nuxt-link to="/rooms" v-text="'Chat Rooms'" /> |
      <nuxt-link to="/ioStatus" v-text="'IO Status'" /> |
      <a href="https://nuxt-socket-io.netlify.app" target="_blank" v-text="'Docs'" /> |
      <a href="https://github.com/richardeschloss/nuxt-socket-io" target="_blank">
        <svg
          width="25"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="feather feather-github"
        >
          <path
            d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
          />
        </svg>
      </a>
    </div>
  </div>
</template>
