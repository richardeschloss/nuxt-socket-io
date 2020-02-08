
# Change Log
All notable changes to this project will be documented in this file.

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
