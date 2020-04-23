<template>
  <nav class="channel-select">
    <div>
      <b-button
        v-b-toggle="'channel-list'"
        variant="light"
        class="btn d-md-none p-0 ml-3"
        type="button"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="30"
          viewBox="0 0 30 30"
          role="img"
          focusable="false"
        >
          <title>Menu</title>
          <path
            stroke="currentColor"
            stroke-linecap="round"
            stroke-miterlimit="10"
            stroke-width="2"
            d="M4 7h22M4 15h22M4 23h22"
          ></path>
        </svg>
      </b-button>
      <b-collapse
        id="channel-list"
        class="d-md-show"
        :visible="visible"
        @shown="visible = true"
      >
        <ul class="nav flex-column">
          <li
            v-for="channel in channels"
            :key="channel.name"
            class="nav-item channel-container"
            @click="setVisible()"
          >
            <nuxt-link
              class="nav-link channel-select"
              :class="channelActive(channel)"
              :to="channelRoute(channel)"
            >
              {{ channel }}
            </nuxt-link>
          </li>
        </ul>
      </b-collapse>
    </div>
  </nav>
</template>

<script>
export default {
  props: {
    channels: {
      type: Array,
      default: () => []
    },
    room: {
      type: String,
      default: () => ''
    }
  },
  data() {
    return {
      visible: window.innerWidth > 768
    }
  },
  computed: {
    channelActive() {
      return (channel) =>
        channel === this.$route.params.channel ? 'active' : ''
    },

    channelRoute() {
      return (channel) => `/rooms/${this.room}/${channel}`
    }
  },
  mounted() {
    window.addEventListener('resize', this.setVisible)
  },
  destroyed() {
    window.removeEventListener('resize', this.setVisible)
  },
  methods: {
    setVisible() {
      this.visible = window.innerWidth > 768
    }
  }
}
</script>

<style scoped>
.channel-container {
  border-bottom: 1px solid;
  cursor: pointer;
}

.channel-container .active {
  background-color: lavender;
}
</style>
