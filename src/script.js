console.log('JS online!')
const noop = () => {}
let cleanupFn = noop
let prevPathname = location.pathname

const yoinkHTML = async (href) => {
  const response = await fetch(href)
  const htmlString = await response.text()
  const pageDoc = new DOMParser().parseFromString(htmlString, 'text/html')
  const nextPage = pageDoc.querySelector('[data-route]')
  return nextPage
}

const yoinkJS = async (pathname) => {
  try {
    const js = await import(`./routes/${pathname}/client.js`)
    return js.default
  } catch (e) {
    return noop
  }
}

const animatePageIntoView = async (nextPage) => {
  const currentPage = document.querySelector('[data-route]')
  currentPage.innerHTML = nextPage.innerHTML
  currentPage.setAttribute('data-route', nextPage.getAttribute('data-route'))
}

const setVisiblePage = async ({ pathname, href }) => {
  cleanupFn()
  const [html, js] = await Promise.all([
    yoinkHTML(href),
    yoinkJS(trimSlashes(pathname)),
  ])
  await (html && animatePageIntoView(html))
  const nextCleanupFn = js() || noop
  cleanupFn = nextCleanupFn
}

const trimSlashes = (url) => url.replace(/^\/+|\/+$/g, '')

document.addEventListener('click', async (event) => {
  const { target } = event
  if (
    target.tagName === 'A' &&
    target.origin === location.origin &&
    target.pathname !== prevPathname
  ) {
    event.preventDefault()
    history.pushState({}, null, target.href)
    prevPathname = target.pathname
    await setVisiblePage(target)
  }
})
