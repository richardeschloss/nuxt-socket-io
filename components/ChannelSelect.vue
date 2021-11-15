<template>
  <nav class="channel-select">
    <div>
      <button
        variant="light"
        class="btn d-md-none p-0 ml-3"
        type="button"
        @click="visible = !visible"
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
          />
        </svg>
      </button>
      <div
        id="channel-list"
        class="d-md-show"
        :style="{
          height: visible ? '80px' : '0px',
          'overflow-y': showToggleBtn ? 'scroll' : ''
        }"
      >
        <ul class="nav flex-column">
          <li
            v-for="channel in channels"
            :key="channel.name"
            class="nav-item channel-container"
            @click="setVisible()"
          >
            <nuxt-link
              :class="channelActive(channel)"
              :to="channelRoute(channel)"
              class="nav-link channel-select"
            >
              {{ channel }}
            </nuxt-link>
          </li>
        </ul>
      </div>
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
  data () {
    return {
      visible: false,
      showToggleBtn: false
    }
  },
  computed: {
    channelActive () {
      return channel =>
        channel === this.$route.params.channel ? 'active' : ''
    },

    channelRoute () {
      return channel => `/rooms/${this.room}/${channel}`
    }
  },
  mounted () {
    this.setVisible()
    window.addEventListener('resize', this.setVisible)
  },
  destroyed () {
    window.removeEventListener('resize', this.setVisible)
  },
  methods: {
    setVisible () {
      this.visible = window.innerWidth > 768
      this.showToggleBtn = !this.visible
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

#channel-list {
  position: relative;
  /* overflow-x: hidden; */
  /* overflow-y: scroll; */
  transition: height 0.35s ease;
}
</style>
