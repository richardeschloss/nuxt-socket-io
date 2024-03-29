<template>
  <div>
    <h4 v-text="'Basic Message Transfer'" />
    <div class="row">
      <div class="card col-6">
        <div class="card-body">
          <h5 class="card-title" v-text="'Component-defined method'" />
          <p class="card-text" style="font-size: 14px;">
            This example uses <code>"getMessage()"</code> defined in the component
            and consumes <code>chatMessages</code> that were sent directly to Vuex. If you can see text appear below, it worked!<br><br>

            When the event "chatMessage" is received, it's data will be stored in "chats/message" inside of the plugin's "ioState". To access the value,
            use the provided "$ioState" and then get the desired value (<code>this.$ioState().value.chats.message</code>). Alternatively, You can also <code>import { ioState } from 'nuxt-socket-io/lib/plugin.js'</code>
          </p>
          <table class="table card-text" style="font-size: 14px;">
            <thead>
              <tr>
                <th>Send Event "getMessage"</th>
                <th style="width: 40%;" v-text="'Receive Intermediate Event(s)'" />
                <th xstyle="width: 35%;" v-text="'Receive Final Response'" />
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <button class="btn btn-primary" @click="getMessage()" v-text="'Get Message'" />
                </td>
                <td>
                  <label>chatMessages</label>
                  <p class="text-left" style="color: grey; white-space: pre-line;" v-text="chatMessages" />
                </td>
                <td>
                  <label>messageRxd</label>
                  <p class="text-left" style="color: grey; white-space: pre-line;" v-text="messageRxd" />
                </td>
              </tr>
            </tbody>
          </table>
          <p class="card-text" />
        </div>
      </div>
      <div class="card col-6">
        <div class="card-body">
          <h5 class="card-title">
            Namespace config
          </h5>
          <p class="card-text" style="font-size: 14px;">
            This example uses the namespace config specified entirely in
            <code>nuxt.config</code>. The only thing needed in the component is data
            definitions <br><br>

            In the config for channel '/index', we have <br><br>

            emitters <br>
            <code>['getMessage2 + testMsg --> message2Rxd']</code> <br><br>

            listeners <br>
            <code>['chatMessage2', 'chatMessage3 --> message3Rxd']</code>
          </p>
          <table class="table card-text" style="font-size: 14px;">
            <thead>
              <tr>
                <th>Send Event "getMessage2" with msg "testMsg"</th>
                <th style="width: 40%;">
                  Receive Intermediate Event(s)
                </th>
                <th style="width: 35%;">
                  Receive Final Response
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <button class="btn btn-primary" @click="getMessage2()">
                    Get Message2
                  </button>
                  (nuxt-socket-io created this method for us, by using the provided config)
                </td>
                <td>
                  <label>Receive chatMessage2</label>
                  <p class="text-left" style="color: grey; white-space: pre-line;" v-text="chatMessage2" />

                  <label>Receive chatMessage3 in message3Rxd</label>
                  <p class="text-left" style="color: grey; white-space: pre-line;" v-text="message3Rxd" />
                </td>
                <td>
                  <label>message2Rxd</label>
                  <p class="text-left" style="color: grey; white-space: pre-line;" v-text="message2Rxd" />
                </td>
              </tr>
            </tbody>
          </table>
          <p class="card-text" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      chatMessage2: '',
      messageRxd: '',
      message2Rxd: '',
      message3Rxd: '',
      testMsg: { id: 'xyz' },
      socket: null
    }
  },
  computed: {
    chatMessages() {
      return this.$ioState().value?.chats?.message
    }
  },
  mounted () {
    this.socket = this.$nuxtSocket({
      channel: '/index',
      reconnection: false
    })
  },
  methods: {
    async getMessage () {
      this.messageRxd = await this.socket.emitP('getMessage', { id: 'abc123' })
    }
  }
}
</script>
