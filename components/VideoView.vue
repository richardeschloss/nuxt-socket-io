<template>
  <div>
    <div><input v-model="showVideo" type="checkbox" /> Show Screen</div>
    <video v-if="showVideo" v-player autoplay />
  </div>
</template>

<script>
import { delay } from '@/utils/wait'

function initVideo(video, mimeCodec, cb) {
  return new Promise((resolve, reject) => {
    if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
      const mediaSource = new MediaSource()
      video.src = URL.createObjectURL(mediaSource)
      mediaSource.addEventListener('sourceopen', function() {
        const sourceBuffer = mediaSource.addSourceBuffer(mimeCodec)
        resolve({ sourceBuffer, mediaSource })
      })
    } else {
      reject(new Error(`Unsupported MIME type or codec: ${mimeCodec}`))
    }
  })
}

export default {
  directives: {
    player: {
      inserted(elm, binding, { context }) {
        const video = elm
        const info = {}

        const socket = context.$nuxtSocket({
          channel: '/stream'
        })

        function onData(bufIn) {
          if (
            !video.error &&
            info.mediaSource &&
            info.mediaSource.readyState === 'open' &&
            info.sourceBuffer &&
            !info.sourceBuffer.updating
          ) {
            info.sourceBuffer.appendBuffer(bufIn)
          }
        }

        function stop() {
          return new Promise(async (resolve) => {
            function endOfStream() {
              if (info.mediaSource.readyState === 'open') {
                info.mediaSource.endOfStream()
              }
              info.sourceBuffer.removeEventListener(
                'updateend',
                endOfStream,
                true
              )
              resolve()
            }
            if (info.sourceBuffer) {
              info.sourceBuffer.addEventListener('updateend', endOfStream)
              await delay(1000)
              endOfStream()
            }
          })
        }
        async function start({ mimeType }) {
          Object.assign(info, await initVideo(video, mimeType))
        }

        video.addEventListener('error', (evt) => socket.emit('restart'))
        socket
          .on('chunk', onData)
          .on('start', start)
          .on('stop', stop)
      }
    }
  },
  data() {
    return {
      showVideo: false
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
