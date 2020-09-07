const { readFile } = require('fs').promises
const path = require('path')
const frontMatter = require('front-matter')
const pug = require('pug')
const { baseDir, routeDir, liveReloadPort } = require('../../config')

module.exports = async (filePath, props) => {
  const template = await readFile(filePath)
  const { attributes, body } = frontMatter(template.toString())
  const relativePath = filePath.replace(routeDir, '')
  return pug.renderFile(baseDir + '/layout/index.pug', {
    env: process.env.MODE,
    liveReloadPort,
    markup: pug.render(body, props),
    route: path.dirname(relativePath),
    meta: attributes,
  })
}
