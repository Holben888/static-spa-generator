const md = require('markdown-it')()
const markdownItAttrs = require('markdown-it-attrs')

md.renderer.rules.fence = function (tokens, idx, options, env, slf) {
  const token = tokens[idx];
  console.log(token, options)
  const languageCSSClass = options.langPrefix + token.info
  return `
    <pre class="${languageCSSClass}" ${slf.renderAttrs(token)}>
      <code class="${languageCSSClass}">
        ${token.content}
      </code>
    </pre>
  `
}

module.exports = (filePath) => {
  md.use(markdownItAttrs)
  return md.render(filePath)
}
