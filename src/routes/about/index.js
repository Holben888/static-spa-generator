const renderToLayout = require('../../utils/render-to-layout')

module.exports = () =>
  renderToLayout(__dirname + '/_template.pug', {
    name: 'Ben Holmes',
    description: 'He is extremely dope and made the generator you see here.',
  })
