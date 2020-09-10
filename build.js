const livereload = require('livereload')
const sassCompiler = require('sass')
const { existsSync, watch } = require('fs')
const { readdir, writeFile, mkdir } = require('fs').promises
const path = require('path')
const { promisify } = require('util')
const { rollup } = require('rollup')
const sassRender = promisify(sassCompiler.render)
const renderToLayout = require('./src/utils/render-to-layout')
const {
  baseDir,
  buildDir,
  routeDir,
  liveReloadPort,
  rollupPlugins,
} = require('./config')

/**
 * Recursively duplicates all directories inside a specified
 * starting point to the build directory, buildDir
 *
 * @param {string} dir The directory path to start crawling from
 * @return a list of file paths found along the way
 */
const dupToBuildDir = async (dir) => {
  // first, copy this directory to /public if it's new
  const relativePath = dir.replace(routeDir, '')
  if (!existsSync(buildDir + relativePath)) {
    await mkdir(buildDir + relativePath)
  }

  const dirEntries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    dirEntries.map(async (dirEntry) => {
      const entryPath = path.resolve(dir, dirEntry.name)
      if (dirEntry.isDirectory() && !dirEntry.name.startsWith('_')) {
        // recursively read the files of this dir
        return dupToBuildDir(entryPath)
      } else {
        return entryPath
      }
    })
  )

  return files
    .flat() // flatten nested file arrays
    .filter((file) => !path.basename(file).startsWith('_')) // ignore files starting with our special char
}

const filterByExts = (files, fileExts) =>
  files.filter((file) => fileExts.includes(path.extname(file)))

const filterRenderFiles = (files) =>
  files.filter((file) => {
    const fileName = path.basename(file)
    const fileExt = path.extname(file)

    const isTemplate = ['.pug', '.html', '.md'].includes(fileExt)
    const isRenderFn = fileName === 'index.js'
    return isTemplate || isRenderFn
  })

/**
 * Takes in paths to files and templates that are
 * ready to render, and builds them to the buildDir
 *
 * @param {string[]} files All files that either...
 * a) have a render method we can call to grab some html
 * b) are render-able templates we can pass into our layout
 */
const bundleHTML = (files) =>
  Promise.all(
    files.map(async (file) => {
      let htmlToWrite = ''
      const fileExt = path.extname(file)
      if (fileExt === '.js') {
        const renderFn = require(file)
        htmlToWrite = await renderFn()
      } else {
        htmlToWrite = await renderToLayout(file)
      }

      // write the rendered .html file to the build relative to where
      // the "file" was read from (route dir mirrors the build dir!)
      const relativePath = file.replace(routeDir, '').replace(fileExt, '.html')
      await writeFile(buildDir + relativePath, htmlToWrite)
    })
  )

/* Converts your fancy SASS to CSS */
const bundleCSS = async (sassFiles) => {
  const buffer = Buffer.concat(
    await Promise.all(
      sassFiles.map(async (file) => {
        const { css } = await sassRender({ file })
        return css
      })
    )
  )
  await writeFile(buildDir + '/styles.css', buffer)
}

/* Runs your JS through a bundler called RollupJS.
Check out https://rollupjs.org for a quick guide,
and where to find any plugins you might want */
const bundleJS = async () => {
  const bundle = await rollup({
    input: baseDir + '/script.js',
    plugins: rollupPlugins(),
  })
  await bundle.write({
    entryFileNames: 'not-a-react-bundle.js',
    dir: 'public',
    format: 'es',
  })
}

/**
 * Where we actually build our templates, stylesheets, and js
 * This first calls filesToBuild to generate our build directories,
 * then handles all the files in those directories
 *
 * @param {string} file The file that recently changed on save.
 * This only applies when working in a dev environment;
 * if it's not present, we fall through to the "else" case (build all)
 */
const buildFiles = async (file = '') => {
  const filesToBuild = await dupToBuildDir(routeDir)
  const renderFiles = filterRenderFiles(filesToBuild)
  const stylesheetFiles = filterByExts(filesToBuild, ['.css', '.scss', '.sass'])

  if (renderFiles.includes(file)) {
    await bundleHTML(renderFiles)
  } else if (stylesheetFiles.includes(file)) {
    await bundleCSS(stylesheetFiles)
  } else if (path.extname(file) === '.js') {
    await bundleJS()
  } else {
    await Promise.all([
      bundleHTML(renderFiles),
      bundleCSS(stylesheetFiles),
      bundleJS(),
    ])
  }
}

// Some silly stuff for the console output. Skip this!
const consoleLogGreen = (text) => {
  console.log('\u001b[1m\u001b[32m' + text + '\u001b[39m\u001b[22m')
}

const deletePrevLineInConsole = () => {
  process.stdout.write('\r\x1b[K')
}

/* --------- ACTUAL BUILD SCRIPT --------- */
;(async () => {
  await buildFiles()
  consoleLogGreen('Built successfully!')

  if (process.env.MODE === 'dev') {
    watch(baseDir, { recursive: true }, async (_, filePath) => {
      deletePrevLineInConsole()
      process.stdout.write('Rebuilding...')

      await buildFiles(filePath)

      deletePrevLineInConsole()
      process.stdout.write(`Rebuilt changes to ${filePath}`)
    })
  }

  if (process.env.MODE === 'dev') {
    const server = livereload.createServer({ port: liveReloadPort }, () =>
      consoleLogGreen('Live reload enabled')
    )
    server.watch(baseDir)
  }
})()
