<template>
  <div>
    <div>
      <label>Recording Period</label>
      <input v-model.number="recordingOptions.period" type="number" />
    </div>
    <div>
      <button @click="shareUser()" class="btn btn-primary">
        Share Yourself
      </button>
      <button @click="shareDesktop()" class="btn btn-primary">
        Share Desktop
      </button>
      <button @click="stopCapture()" class="btn btn-primary">Stop</button>
    </div>
    <video v-my-video autoplay />
  </div>
</template>

<script>
import { delay } from '@/utils/wait'

let video
function buildMimeType(options) {
  const codecs = ['vp9']
  if (options.audio) {
    codecs.push('opus')
  }
  return `video/webm; codecs="${codecs.join(',')}"`
}

export default {
  directives: {
    myVideo: {
      inserted(elm, binding, { context }) {
        video = elm
      }
    }
  },
  data() {
    return {
      displayUserOptions: {
        video: true,
        audio: true
      },
      displayMediaOptions: {
        video: {
          cursor: 'always'
        },
        audio: false
      },
      recordingOptions: {
        period: 1000
      }
    }
  },
  mounted() {
    this.socket = this.$nuxtSocket({
      channel: '/stream'
    })
  },
  methods: {
    async shareUser() {
      const captureStream = await navigator.mediaDevices.getUserMedia(
        this.displayUserOptions
      )
      this.startCapture(captureStream, {
        mimeType: buildMimeType(this.displayUserOptions)
      })
    },
    async shareDesktop() {
      const captureStream = await navigator.mediaDevices.getDisplayMedia(
        this.displayMediaOptions
      )
      const codecs = ['vp9']
      if (this.displayMediaOptions.audio) {
        codecs.push('opus')
      }
      this.startCapture(captureStream, {
        mimeType: buildMimeType(this.displayMediaOptions)
      })
    },
    startCapture(captureStream, { mimeType }) {
      const { socket, recordingOptions } = this
      const { period } = recordingOptions
      let timer
      video.srcObject = captureStream
      const mediaRecorder = new MediaRecorder(captureStream, { mimeType })

      function onData(event) {
        event.data.arrayBuffer().then((buf) => {
          if (buf.byteLength > 0) {
            socket.emit('chunk', buf)
          }
        })
      }

      function stop() {
        socket.emit('stop')
        clearInterval(timer)
        mediaRecorder.removeEventListener('dataavailable', onData)
        mediaRecorder.removeEventListener('stop', stop)
      }
      function start() {
        socket.emit('start', { mimeType })
        mediaRecorder.addEventListener('dataavailable', onData)
        mediaRecorder.addEventListener('stop', stop)
        mediaRecorder.start()
        timer = setInterval(() => {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.requestData()
          }
        }, period)
      }

      async function restart() {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop()
          await delay(period)
          start()
        }
      }

      start()
      socket.on('clientConnected', restart).on('restart', restart)
    },
    stopCapture() {
      const { socket } = this
      const tracks = video.srcObject.getTracks()
      tracks.forEach((track) => track.stop())
      video.srcObject = null
      socket.emit('stop')
    }
  }
}
</script>

<style scoped>
video {
  border: 1px solid #999;
  width: 98%;
  max-width: 860px;
}
</style>
