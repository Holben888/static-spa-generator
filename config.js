const dynamicImportVariables = require('rollup-plugin-dynamic-import-variables')

const baseDir = __dirname + '/src'

module.exports = {
  baseDir,
  buildDir: __dirname + '/public',
  routeDir: baseDir + '/routes',
  liveReloadPort: 35729,
  rollupPlugins: () => [dynamicImportVariables()],
}
