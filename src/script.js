console.log('JS online!')
const noop = () => {}
let prevPathname = location.pathname
let cleanupFn = noop

const yoinkHTML = async (href) => {
  const response = await fetch(href)
  const htmlString = await response.text()
  const pageDoc = new DOMParser().parseFromString(htmlString, 'text/html')
  const page = pageDoc.querySelector('[data-route]')
  const title = pageDoc.querySelector('title').innerText
  return { page, title }
}

const defaultPageTransition = (page, prevPage, destroyPrevPage) => {
  destroyPrevPage()
}

const yoinkJS = async (pathname) => {
  try {
    const js = await import(`./routes/${pathname}/client.js`)
    return {
      main: js.default || noop,
      pageTransition: js.pageTransition || defaultPageTransition,
    }
  } catch (e) {
    return { main: noop, pageTransition: defaultPageTransition }
  }
}

const animatePageIntoView = async (page, pageTransition) => {
  const prevPage = document.querySelector('[data-route]')
  const layoutContainer = prevPage.parentElement
  layoutContainer.style.position = 'relative'
  layoutContainer.insertBefore(page, prevPage)
  await pageTransition(page, prevPage, () =>
    layoutContainer.removeChild(prevPage)
  )
}

const setVisiblePage = async ({ pathname, href }) => {
  cleanupFn()
  const [{ page, title }, { main, pageTransition }] = await Promise.all([
    yoinkHTML(href),
    yoinkJS(trimSlashes(pathname)),
  ])
  document.querySelector('title').innerText = title
  await (page && animatePageIntoView(page, pageTransition))
  const nextCleanupFn = main() || noop
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

// on startup
;(async () => {
  const { main } = await yoinkJS(trimSlashes(prevPathname))
  cleanupFn = main() || noop
})()
