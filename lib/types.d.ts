import { Module } from '@nuxt/types';
import * as SocketIOClient from 'socket.io-client';
import { ManagerOptions } from 'socket.io-client/build/manager';
import { Socket } from 'socket.io-client/build/socket';
import Vue from 'vue';

/**
 * The format of each entry in mutations can be:
 *
 *   1. A single name string - the event name acts as the mutation
 *   2. A string with a double-dashed arrow - the left side of the arrow is the event name, the right side is the mutation
 *   3. An object - the object key is the event, the value is the mutation
 */
type MutationNotation = string | Record<string, string>;

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
 * https://nuxt-socket-io.netlify.app/configuration#vuex-options-per-socket
 */
interface NuxtSocketVueOptions {
  mutations?: Array<MutationNotation>;
  actions?: Array<ActionNotation>;
  emitBacks?: Array<EmitBackNotation>;
}

/**
 * The format of each entry in emitters can be:
 *
 *   1. A single name string - the method name on [this] component that emits an event of the same name
 *   2. A string with the following format:
 *      'preEmit hook] componentMethod + msg --> componentProp [postRx hook'
 *
 *      Hooks are optional. calling this[componentMethod] will send the event [componentMethod]
 *      with data this[msg]. It will save the response to this[componentProp]   
 *      If the preEmit hook returns false, emitting will be canceled.
 *   3. An object - the object key is the method name on [this] component, the value is the event to emit
 */
type EmitterNotation = string | Record<string, string>;

/**
 * The format of each entry in listeners can be:
 *
 *   1. A single name string - the event name to listen to, whose data will be 
 *      saved in this[eventName]
 *   2. A string with the following format:
 *      'preHook] listenEvent --> componentProp [postRx hook'
 *
 *      Hooks are optional. When listenEvent received, it will be saved to this[componentProp]
 *   3. An object - the object key is the event name to listen to, the value is the property on [this] component that will contain the event's data
 */
type ListenerNotation = string | Record<string, string>;

/**
 * Options to let you configure emitters, listeners and/or
 * emitBacks for a given namespace (a.k.a. "channel")
 * https://nuxt-socket-io.netlify.app/configuration#namespace-configuration
 */
interface NuxtSocketNspCfg {
  emitters?: Array<EmitterNotation>;
  listeners?: Array<ListenerNotation>;
  emitBacks?: Array<EmitBackNotation>;
}

/**
 * Kiss API format used by Nuxt Socket Dynamic API feature.
 * https://medium.com/swlh/nuxt-socket-io-the-magic-of-dynamic-api-registration-9af180383869
 */
interface NuxtSocketKissApi {
  label: string;
  version: number;
  evts?:  Record<string, any>;
  methods?:  Record<string, any>;
}

/**
 * Options to use for a socket.io server you want the module
 * to start
 * https://nuxt-socket-io.netlify.app/configuration#automatic-io-server-registration
 */
interface NuxtSocketIoServerOpts {
  /**
   * Path to IO service used for clients that connect to "/"
   * @default '[projectRoot]/server/io.js'
   */
  ioSvc?: string;
  /**
   * Directory containing IO services for clients that connect
   * to the namespace matching the file name
   * Example: a file "namespace1.js" in this folder will listen
   * clients that connect to "/namespace1"
   * 
   * @default '[projectRoot]/server/io'
   */
  nspDir?: string;
  /**
   * Socket.io server host 
   * @default 'localhost'
   */
  host?: string;
  /**
   * Socket.io server port
   * @default 3000
   */
  port?: number;
}

export interface NuxtSocketOpts extends Partial<ManagerOptions> {
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
  /**
   * Namespace config. Specifies emitters, listeners, and/or emitBacks.
   */
  namespaceCfg?: NuxtSocketNspCfg;
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
  serverAPI?: NuxtSocketKissApi;
  clientAPI?: NuxtSocketKissApi;
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
  namespaces?: Record<string, NuxtSocketNspCfg>;
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

  /**
   * Options for starting a socket.io server
   * and automatically registering socket io service(s).
   * By default, registers services in
   * - [projectRoot]/server/io.js
   * - [projectRoot]/server/io/*.js
   */
  server?: boolean | NuxtSocketIoServerOpts

  /**
   * Console warnings enabled/disabled
   * @default true
   */
  warnings?: boolean;

  /**
   * Console info enabled/disabled
   * @default true
   */
  info?: boolean;
}

interface NuxtSocketIoRuntimeOptions {
  /**
   * Minimum one socket required.
   */
  sockets: Array<NuxtSocketRuntimeConfig>;

  /**
   * Options for starting a socket.io server
   * and automatically registering socket io service(s).
   * By default, registers services in
   * - [projectRoot]/server/io.js
   * - [projectRoot]/server/io/*.js
   */
  server?: boolean | NuxtSocketIoServerOpts

  /**
   * Console warnings enabled/disabled
   * @default true
   */
  warnings?: boolean;

  /**
   * Console info enabled/disabled
   * @default true
   */
  info?: boolean;
}

interface NuxtSocket extends Socket {};

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

export { NuxtSocket, NuxtSocketIoOptions, NuxtSocketIoRuntimeOptions }
