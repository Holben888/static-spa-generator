const { readFile } = require('fs').promises
const { existsSync, lstatSync } = require('fs')
const path = require('path')
const frontMatter = require('front-matter')
const { baseDir, routeDir, liveReloadPort } = require('../../config')
const pug = require('pug')

/**
 * Uses a relative path to a layout file / dir
 * and loads the raw content of the file asynchronously
 * @param {string} layoutRelativePath path to layout file (or dir) relative to /src/layout
 * @return {string} The string output of the determined layout file
 */
const resolveLayout = async (layoutRelativePath = '') => {
  let layoutAbsolutePath = path.resolve(baseDir, 'layout', layoutRelativePath)
  if (existsSync(layoutAbsolutePath) && lstatSync(layoutAbsolutePath).isDirectory()) {
    layoutAbsolutePath = path.resolve(layoutAbsolutePath, 'index.pug')
  } else if (!layoutAbsolutePath.endsWith('.pug')) {
    layoutAbsolutePath += '.pug'
  }
  return await readFile(layoutAbsolutePath)
}

/**
 * Renders a given template to the layout specified in its frontmatter.
 * Layouts can inherit other layouts, so this function will recursively
 * Walk through each layout's frontmatter until it hits the index layout
 * 
 * @param {string} layoutPath path to layout file (or dir) relative to /src/layout
 * @param {object} meta object of metadata keys provided by frontmatter
 * @param {string} markupPath path to inner markup (either relative to /layout or /routes)
 * @param {string} markup HTML markup to render with layout
 * @return {string} The HTML markup rendered within all specified layouts
 */
const renderWithLayout = async (layoutPath = '', meta = {}, markupPath = '', markup = '') => {
  if (!layoutPath) return markup
  let rawLayout = ''
  try {
    rawLayout = await resolveLayout(layoutPath)
  } catch (e) {
    console.log(`Oop! We couldn't find this layout: ${layoutPath}`, e)
    return markup
  }
  const { attributes: {layout = 'index', ...layoutMeta}, body } = frontMatter(rawLayout.toString())
  const markupWithLayout = pug.render(body, {
    env: process.env.MODE,
    meta,
    page: markupPath,
    liveReloadPort,
    markup,
  })
  return await renderWithLayout(
    // if we already rendered the index layout,
    // don't recursively render the index layout *again* (infinite loop!)
    layoutPath.startsWith('index') && layout === 'index' ? '' : layout,
    layoutMeta,
    layoutPath,
    markupWithLayout
  )
}

module.exports = async (filePath = '', props) => {
  const template = await readFile(filePath)
  const { attributes: {layout, ...meta}, body } = frontMatter(template.toString())
  const relativePath = filePath.replace(routeDir, '')

  const fileExt = path.extname(filePath)
  let markup = ''
  if (fileExt === '.pug') {
    markup = pug.render(body, props)
  }
  if (fileExt === '.md') {
    const renderMd = require('./render-md')
    markup = renderMd(body)
  }

  // for markup using an index.* file...
  const markupPath = path.basename(relativePath).startsWith('index')
    // ...drop the "index" from the relative path
    ? path.dirname(relativePath)
    // ...otherwise, just drop the file extension
    : relativePath.slice(0, relativePath.lastIndexOf(fileExt))

  const html = renderWithLayout(layout ?? 'index', meta, markupPath, markup)

  return html
}
