
# Change Log
All notable changes to this project will be documented in this file.

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
