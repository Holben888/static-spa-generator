const md = require('markdown-it')()

module.exports = (filePath) => {
  return md.render(filePath)
}
