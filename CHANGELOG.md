
# Change Log
All notable changes to this project will be documented in this file.

## 1.1.23 - 2021-08-29
### Fixed
- Automatic server registration with .ts and .mjs extensions (credit: ohashi14715369)

## 1.1.22 - 2021-08-16
### Removed
- Dependency on vue-template-compiler (which should have never been there)

## 1.1.21 - 2021-08-12
### Reverted
- Reverted changes introduced in 1.1.20

## 1.1.20 - 2021-08-09
### Changed
- Make NuxtSocketOpts and NuxtSocket non-partial (credit: CS_Birb)

## 1.1.19 - 2021-08-06
### Changed
- Type definitions file because socket.io-client types changed (credit: matthiasbaldi)

## 1.1.18 - 2021-05-11
### Added
- Wired up support for the socket.io server options

### Updated
- Socket.io dependencies to v4

## [1.1.17] - 2021-03-31
### Added
- Support for using $nuxtSocket in the composition api.

## [1.1.16] - 2021-03-31
### Added
- Middleware registration feature (sub namespaces)
- Feature to access the `io` instance in the sub namespaces.

## [1.1.15] - 2021-03-30
### Added
- Middleware registration feature (root namespace)
- Feature to access the `io` instance in the root namespace.

## [1.1.14] - 2021-01-22
### Updated
- socket.io and socket.io-client deps to v3
- Ran security audit fix

## [1.1.13] - 2020-11-27
### Added
- Option to disable the console.info messages (@ArticSeths)

## [1.1.12] - 2020-11-04
### Added
- Types for plugin and module (@wkillerud)

## [1.1.11] - 2020-08-28
### Changed
- Ran security audit and updated dependencies.

## [1.1.10] - 2020-08-24
### Fixed
- Badges to improve branding score on npms. (FaCuZ)

## [1.1.9] - 2020-08-20
### Fixed
- Namespace path resolution on Windows for real this time. Merged in the change. (filipepinheiro) 

## [1.1.8] - 2020-08-06
### Fixed
- Namespace path resolution on Windows for real this time. Merged in the change.

## [1.1.7] - 2020-08-05
### Added
- Support for .ts and .mjs namespace files

### Fixed
- Namespace path resolution on Windows.

## [1.1.6] - 2020-07-27
### Added
- Support for Nuxt 2.13+ runtime config feature. Experimental feature.

## [1.1.5] - 2020-07-14
### Changed
- Changed internal workings of socket persistence. Socket instances are no longer being persisted in vuex, but instead internally by the plugin. This may break any code that relies on accessessing the sockets directly from vuex.

## [1.1.4] - 2020-06-27
### Changed
- Reverted to 1.1.2. Module is back in ESM. I think going forward, if CJS is needed, a duplicate or built file with .cjs will be created. It seems like the future is going towards ESM.

## [1.1.3] - 2020-06-25
### Changed
- module to CommonJS format. may be easier to re-use this way for now.
- consola to console in the module.

## [1.1.2] - 2020-06-22
### Changed
- consola to console in the plugin. Allows logging statements to be dropped with TerserWebpack plugin.

## [1.1.0] - 2020-06-07
### Added
- Much cleaner documentation, hosted on their own site

### Changed
- This github's README. I consider this to be a major change in docs, even though the code change was minor. Code was just linted.

## [1.0.25] - 2020-04-23
### Added
- Automatic IO Server registration based on presence of IO server file and folder (added to module)

## [1.0.24] - 2020-04-05
### Added
- Default handler for url missing. Now `window.location` will be used.

### Changed
- Before when URL was empty, an error would be thrown. Now it will just be a warning.

## [1.0.23] - 2020-04-04
### Added
- Instance options for vuex and namespace config (that will override nuxt.config entries)

## [1.0.22] - 2020-04-03
### Added
- Registration of $nuxtSocket vuex module
- Persistence of a given socket (using the "persist" option)
- Registration of serverAPI methods and events, with loose peer-detection
- Registration of clientAPI methods and events

### Changed
- Default value of "teardown" option. Previous versions had it default to true. Now it defaults to the *opposite* of the "persist" value (persist defaults to false, therefore teardown to true, just like before) 

## [1.0.21] - 2020-03-17
### Added
- Pre-emit hook validation feature for emitbacks; if validation fails, emit event won't be sent.

### Fixed
- propExists method in the plugin. Properly checks to see if the property is defined.

## [1.0.20] - 2020-03-17
### Added
- Pre-emit hook validation feature; if validation fails, emit event won't be sent.

### Fixed
- Before, emitter "args" would not be used if they were set to `false`. A more proper check has replaced the old one.

## [1.0.19] - 2020-03-15
### Added
- Improved documentation on usage
- Testing section in the docs; i.e., how to mock NuxtSocket, and how to inject.

## [1.0.18] - 2020-02-08
### Added
- Added a safeguard against duplicate registration of Vuex listeners

## [1.0.17] - 2020-02-06
### Added
- Added documentation on the auto-teardown feature

## [1.0.16] - 2020-02-06
### Added
- Added option to disable console warnings in non-production mode.

### Changed
- Took out the warning about the emitBack being an object. 

## [1.0.15] - 2020-01-27
### Fixed
- Added a fix for the case where an emitter response is undefined. I have a line the attempts to destructure resp to get `emitError`, but it can't do that if resp is undefined. With the fix it can.

## [1.0.14] - 2020-01-17
### Added
- Added debug logging feature

### Changed
- Allow objects defined in Vuex state to be emitted back. Before I disallowed it (only allowed primitives), but I now enabled it because some developers may want that. I still warn the user about emitting the entire object when it may be desired to just emit the properties that have changed.

### Fixed
- Potential duplicate emitback registrations now prevented in non-test environment. Previous version only prevented it in the TEST env. 

## [1.0.13] - 2020-01-15
### Added
- Hosted demo, split across heroku (server) and netlify (client)
- Contributing guidelines.

### Changed
- Improved documentation, and now host them on the `gh-pages` branch. Docs now have a table of contents

### Fixed 
- Minor bug fix in the chat rooms example (`@keyup.enter` defined on the input message just needed to be updated)

## [AFK NOTICE] - 2020-01-06 to 2020-01-11
Important NOTE: The maintainer of this project will be away from keyboard for this time. If issues arise in 1.0.11, please consider reverting to v1.0.10 or deferring your issues until I return. Thanks for your understanding!

## [1.0.12] - 2020-01-06
### Fixed
- Moved plugin utils back into plugin. It seemed like the utils were not getting built by Nuxt. 

## [1.0.11] - 2020-01-05
### Added
- Error-handling feature for emitters. Handles both timeout and non-timeout kinds of errors.
- Feature to pass arguments to the emitter function (arguments would take priority over the "msg" specified in emitters config in `nuxt.config`)

### Fixed
- Fixed potential overwriting of emitter methods by properly setting `mapTo`. (overwriting could have accidentally been done by the call to `assignResp`) 
- Expanded test timeout to fix broken tests

## [1.0.10] - 2020-01-03
### Changed
- Minor change: v1.0.9 accidentally packaged `plugin.compiled.js` which is only used for tests and not needed in the distro. 

## [1.0.9] - 2020-01-03
### Added
- SocketStatus feature. Disabled by default, opt-in to use it. SocketStatus component will also be included now.

### Fixed
- Potential stack overflow error in the auto-teardown code; error was only noticeable when multiple nuxtSockets were instantiated on the same component. The error was fixed.

## [1.0.8] - 2019-12-29
### Fixed
- Fixed `propByPath` method, which was incorrectly treating empty (falsy) strings as undefined. 

## [1.0.7] - 2019-12-27

### Added
- Support for namespace configuration
- Chat rooms example in [`examples/rooms`](https://github.com/richardeschloss/nuxt-socket-io/tree/examples/rooms) branch.
- Automated tests for new feature and example pages.

### Changed
- Internally, refactored some of the plugin code to improve readability, input validation and consistency.
- Organization of automated tests. Tests now run a bit faster and are easier to maintain.

## [1.0.6] - 2019-12-21

### Added
- Check to see if specified emitbacks exist in Vuex store. If they don't, provide friendly error message

### Changed
- Moved examples to components. Added tests. Eliminated need for the old and slow e2e tests
- Updated plugin tests.

### Fixed

- Potential duplicate emitback registrations now prevented
- [Dev server] ioServer.listen resolves correctly now

## [1.0.5] - 2019-12-06

### Added

- Check for missing vuex options; i.e., missing mutations or actions

## [1.0.4] - 2019-11-19

### Changed

- Only export plugin opts in TEST mode
- TEST mode can get/set plugin opts from outside the plugin, non-TEST mode can only get plugin opts inside the plugin

## [1.0.3] - 2019-11-18

### Added

- Improved Test coverage. Now at 100%

## [1.0.2] - 2019-11-14

### Changed

- Badges format

## [1.0.1] - 2019-11-14
   
### Added

- Unit tests to help get better test coverage
- This changelog

### Changed
   
### Fixed


## See Also:

[Releases](https://github.com/richardeschloss/nuxt-socket-io/releases) 
