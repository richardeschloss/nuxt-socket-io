<template>
  <div class="row">
    <span class="col-6">
      <label>Presenter</label>
      <video-recorder />
    </span>

    <span class="col-6">
      <label>Viewer</label>
      <video-view />
    </span>
  </div>
</template>

<script>
import VideoRecorder from '@/components/VideoRecorder'
import VideoView from '@/components/VideoView'

export default {
  components: { VideoRecorder, VideoView }
}
</script>

<style scoped></style>
