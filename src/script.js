console.log('JS online!')
const noop = () => {}
let cleanupFn = noop
let prevPathname = location.pathname

const yoinkHTML = async (href) => {
  const response = await fetch(href)
  const htmlString = await response.text()
  const pageDoc = new DOMParser().parseFromString(htmlString, 'text/html')
  const page = pageDoc.querySelector('[data-route]')
  const title = pageDoc.querySelector('title').innerText
  return { page, title }
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
  const [{ page, title }, js] = await Promise.all([
    yoinkHTML(href),
    yoinkJS(trimSlashes(pathname)),
  ])
  document.querySelector('title').innerText = title
  await (page && animatePageIntoView(page))
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
