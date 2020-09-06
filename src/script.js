console.log('JS online!')
const noop = () => {}
let cleanupFn = noop

const yoinkHTML = async (pathname) => {
  const response = await fetch(pathname)
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

const setVisiblePage = async (pathname) => {
  cleanupFn()
  const [html, js] = await Promise.all([yoinkHTML(pathname), yoinkJS(pathname)])
  await (html && animatePageIntoView(html))
  const nextCleanupFn = js() || noop
  cleanupFn = nextCleanupFn
}

const trimSlashes = (url) => url.replace(/^\/+|\/+$/g, '')

document.addEventListener('click', async (event) => {
  const { target } = event
  event.preventDefault()
  if (target.tagName === 'A' && target.origin === location.origin) {
    // if (target.pathname !== prevPathname)
    //   history.pushState({}, null, target.href)
    setVisiblePage(trimSlashes(target.pathname))
  }
})
