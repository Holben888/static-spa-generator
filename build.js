const livereload = require('livereload')
const sassCompiler = require('sass')
const fs = require('fs')
const { readFile, readdir, writeFile, mkdir } = require('fs').promises
const path = require('path')
const { promisify } = require('util')
const { rollup } = require('rollup')
const dynamicImportVariables = require('rollup-plugin-dynamic-import-variables')
const pug = require('pug')
const frontMatter = require('front-matter')
const sassRender = promisify(sassCompiler.render)

/* Configurable options */
const liveReloadPort = 35729
const baseDir = __dirname + '/src'
const routeDir = baseDir + '/routes'
const buildDir = __dirname + '/public'
const scssFilePath = '/src/styles.scss'
const rollupPlugins = [dynamicImportVariables()]

/**
 * Recursively duplicates all directories inside a specified
 * starting point to the build directory, buildDir
 * @param dir The directory to start crawling from
 * @return a list of file paths found along the way
 *  */
const dupToBuildDir = async (dir) => {
  // first, copy this directory to /public if it's new
  const relativePath = dir.replace(routeDir, '')
  if (!fs.existsSync(buildDir + relativePath)) {
    await mkdir(__dirname + '/public' + relativePath)
  }

  const dirEntries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    dirEntries.map(async (dirEntry) => {
      const entryPath = path.resolve(dir, dirEntry.name)
      if (dirEntry.isDirectory()) {
        // recursively read the files of this dir
        return dupToBuildDir(entryPath)
      } else {
        return entryPath
      }
    })
  )
  // flatten nested file arrays and return
  return files.flat()
}

const filterByExt = (files, fileExtension) =>
  files.filter((file) => path.extname(file) === fileExtension)

/* Renders all your templates to plain html */
const bundleHTML = (pugFiles) =>
  Promise.all(
    pugFiles.map(async (file) => {
      const template = await readFile(file)
      const contentWithFM = frontMatter(template.toString())
      let html = pug.render(contentWithFM.body)

      if (process.env.MODE === 'dev') {
        // in the dev environment, slap this script at the end of the HTML
        // this will reload the page whenever you save a file!
        html =
          html.toString() +
          `<script src="http://localhost:${liveReloadPort}/livereload.js?snipver=1"></script>`
      }
      const relativePath = file.replace(routeDir, '').replace('.pug', '.html')
      await writeFile(buildDir + relativePath, html)
    })
  )

/* Converts your fancy SASS to CSS */
const bundleCSS = async () => {
  const file = __dirname + scssFilePath
  const { css } = await sassRender({ file })
  await writeFile(__dirname + '/public/styles.css', css)
}

/* Runs your JS through a bundler called RollupJS.
Check out https://rollupjs.org for a quick guide,
and where to find any plugins you might want */
const bundleJS = async () => {
  const bundle = await rollup({
    input: 'src/script.js',
    plugins: rollupPlugins,
  })
  await bundle.write({
    entryFileNames: 'not-a-react-bundle.js',
    dir: 'public',
    format: 'es',
  })
}

// Some silly stuff for the console output. Skip this!
const consoleLogGreen = (text) => {
  console.log('\u001b[1m\u001b[32m' + text + '\u001b[39m\u001b[22m')
}

const deletePrevLineInConsole = () => {
  process.stdout.write('\r\x1b[K')
}

/* --------- ACTUAL BUILD SCRIPT --------- */
const buildFiles = async (fileExtension) => {
  const filesToBuild = await dupToBuildDir(routeDir)
  const pugFiles = filterByExt(filesToBuild, '.pug')
  const sassFiles = filterByExt(filesToBuild, '.scss')

  if (fileExtension === '.pug') {
    await bundleHTML(pugFiles)
  } else if (fileExtension === '.scss') {
    await bundleCSS(sassFiles)
  } else if (fileExtension === '.js') {
    await bundleJS()
  } else {
    await Promise.all([bundleHTML(pugFiles), bundleCSS(sassFiles), bundleJS()])
  }
}

;(async () => {
  await buildFiles()
  consoleLogGreen('Built successfully!')

  if (process.env.MODE === 'dev') {
    fs.watch(baseDir, { recursive: true }, async (_, filePath) => {
      deletePrevLineInConsole()
      process.stdout.write('Rebuilding...')

      const fileExtension = path.extname(filePath)
      await buildFiles(fileExtension)

      deletePrevLineInConsole()
      process.stdout.write(`Rebuilt changes to ${filePath}`)
    })
  }

  if (process.env.MODE === 'dev') {
    const server = livereload.createServer({ port: liveReloadPort }, () =>
      consoleLogGreen('Live reload enabled')
    )
    server.watch(__dirname + '/public')
  }
})()
