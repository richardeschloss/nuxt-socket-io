import * as SocketIOClient from 'socket.io-client';

interface NuxtSocketOpts extends SocketIOClient.ConnectOpts {
  /** Name of the socket. If omitted, the default socket will be used. */
  name?: string;
  /** 
   * The channel (a.k.a namespace) to connect to. 
   * @default ''
   */
  channel?: string;
  /** Specifies whether to enable or disable the "auto-teardown" feature 
   * (see section below). 
   * @default true 
   */
  teardown?: boolean;
  /** 
   * Specifies whether to persist this socket so it can be reused
   * (see [vuexModule](https://nuxt-socket-io.netlify.app/vuexModule)). 
   * @default false
   */
  persist?: boolean;
  /** Specifies the property in [this] component that will be used
   *  to contain the socket status (referring to an object). 
   * @default 'socketStatus' 
   */
  statusProp?: string;
  /** Specifies the timeout in milliseconds for an emit event, 
   * after which waiting for the emit response will be canceled. 
   * @default undefined 
   */
  emitTimeout?: number;
  /** 
   * Specifies the property in [this] component that will be used 
   * to contain emit errors (see section below). 
   * (referring to this.emitErrors, an object of arrays)
   * @default 'emitErrors' 
   */
  emitErrorsProp?: string;
  namespaceCfg?: {
    emitters?: Array<string | object>;
    listeners?: Array<string | object>;
  };
}

// export interface NuxtSocket extends SocketIOClient.Socket {}

declare module 'vue/types/vue' {
  interface Vue {
    $nuxtSocket: (ioOpts: NuxtSocketOpts) => SocketIOClient.Socket;
  }
}

declare module '@nuxt/types' {
  interface Context {
    $nuxtSocket: (ioOpts: NuxtSocketOpts) => SocketIOClient.Socket;
  }
}
