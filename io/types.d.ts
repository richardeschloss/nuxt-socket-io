import { Module } from '@nuxt/types';
import * as SocketIOClient from 'socket.io-client';
import Vue from 'vue';

/**
 * The format of each entry in mutations can be:
 *
 *   1. A single name string - the event name acts as the mutation
 *   2. A string with a double-dashed arrow - the left side of the arrow is the event name, the right side is the mutation
 *   3. An object - the object key is the event, the value is the mutation
 */
type MutationNotation = string | Record<string | string>;

/**
 * The format of each entry in actions can be:
 *
 *   1. A single name string - the event name acts as the action
 *   2. A string with a double-dashed arrow - the left side of the arrow is the event name, the right side is the action
 *   3. An object - the object key is the event, the value is the action
 */
type ActionNotation = MutationNotation;

/**
 * Similar to mutations and actions, but the placements of event names and mutations are reversed.
 *
 * The format of each entry in emitBacks can be:
 *
 *   1. A single name string - the event name acts as the mutation
 *   2. A string with a double-dashed arrow - the **right** side of the arrow is the event name, the **left** side is the mutation
 *   3. An object - the object **key** is the mutation, the **value** is the event

 */
type EmitBackNotation = MutationNotation;


/**
 * Options to let you sync incoming events to a Vuex store and emit events
 * on Vuex store changes. These options will override settings from your Nuxt
 * configuration.
 */
interface NuxtSocketVueOptions {
  mutations?: Array<MutationNotation>;
  actions?: Array<ActionNotation>;
  emitBacks?: Array<EmitBackNotation>;
}

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
  /**
   * @default 'ioApi'
   */
  ioApiProp?: string;
  /**
   * @default 'ioData'
   */
  ioDataProp?: string;
  /**
   * @default []
   */
  apiIgnoreEvts?: Array<string>;
  serverAPI?: {
    label: string;
    version: number;
    evts?:  Record<string, any>;
    methods?:  Record<string, any>;
  };
  clientAPI?: {
    label: string;
    version: number;
    evts?: Record<string, any>;
    methods?: Record<string, any>;
  };
  vuex?: NuxtSocketVueOptions;
}

interface NuxtSocketConfig {
  /**
   * Recommended for all sockets, but required for any non-default socket.
   */
  name?: string;
  /**
   * URL for the Socket.IO server.
   * @default window.location
   */
  url?: string;
  /**
   * Determines which socket is used as the default when creating new sockets
   * with `nuxtSocket()`
   * @default true // for the first entry in the array
   */
  default?: boolean;
  /**
   * Options to let you sync incoming events to a Vuex store and emit events
   * on Vuex store changes. These options will override settings from your Nuxt
   * configuration.
   */
  vuex?: NuxtSocketVueOptions;
  /**
   * Socket.IO namespaces configuration. Supports an arrow syntax in each entry
   * to help describe the flow (with pre/post hook designation support too).
   */
  namespaces?: Record<string, {
    emitters?: Array<string>;
    listeners?: Array<string>;
    emitBacks?: Array<string>;
  }>;
}

interface NuxtSocketRuntimeConfig extends NuxtSocketConfig {
  /**
   * Name is required when using public/privateRuntimeConfig since the plugin
   * uses it to merge the configurations together.
   */
  name: string;
}

interface NuxtSocketIoOptions {
  /**
   * Minimum one socket required.
   */
  sockets: Array<NuxtSocketConfig>;
}

interface NuxtSocketIoRuntimeOptions {
  /**
   * Minimum one socket required.
   */
  sockets: Array<NuxtSocketRuntimeConfig>;
}

interface NuxtSocket extends SocketIOClient.Socket {};

type Factory = (ioOpts: NuxtSocketOpts) => NuxtSocket;

declare module 'vue/types/vue' {
  interface Vue {
    $nuxtSocket: Factory;
  }
}

declare module '@nuxt/types' {
  interface Configuration  {
    /**
     * nuxt-socket-io configuration.
     * See https://nuxt-socket-io.netlify.app/configuration
     * for documentation.
     */
    io?: NuxtSocketIoOptions;
  }

  interface NuxtOptionsRuntimeConfig {
    /**
     * nuxt-socket-io runtime configuration.
     * See https://nuxt-socket-io.netlify.app/configuration
     * for documentation.
     */
    io?: NuxtSocketIoRuntimeOptions;
  }

  interface Context {
    $nuxtSocket: Factory;
  }
}

export { NuxtSocket }
