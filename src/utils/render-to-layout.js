const { readFile } = require('fs').promises
const path = require('path')
const frontMatter = require('front-matter')
const { baseDir, routeDir, liveReloadPort } = require('../../config')
const pug = require('pug')

module.exports = async (filePath, props) => {
  const template = await readFile(filePath)
  const { attributes, body } = frontMatter(template.toString())
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

  return pug.renderFile(baseDir + '/layout/index.pug', {
    env: process.env.MODE,
    route: path.dirname(relativePath),
    meta: attributes,
    liveReloadPort,
    markup,
  })
}
