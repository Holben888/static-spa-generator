const dynamicImportVariables = require('rollup-plugin-dynamic-import-variables')
const {babel} = require('@rollup/plugin-babel')
const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')

const baseDir = __dirname + '/src'

module.exports = {
  baseDir,
  buildDir: __dirname + '/public',
  routeDir: baseDir + '/routes',
  liveReloadPort: 35729,
  rollupPlugins: () => [resolve(), commonjs(), babel({ babelHelpers: 'bundled' }), dynamicImportVariables()],
}
