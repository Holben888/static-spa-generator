import wipeAnimation from './utils/wipe-animation'
import {trimSlashes, zip} from './utils/script-helpers'

console.log('JS online!')
const noop = () => {}
let prevPathname = location.pathname
let cleanupFn = noop

const getPageDiff = (page, prevPage) => {
  const [allPageEls, allPrevPageEls] = [page, prevPage]
    .map(p => [...p.querySelectorAll('[data-page]')])
  
  const pageElPairs = zip(allPageEls, allPrevPageEls)
  for (let pair of pageElPairs) {
    if (pair[0].getAttribute('data-page') !== pair[1].getAttribute('data-page')) {
      return pair
    }
  }
  return [null, null]
}

const yoinkHTML = async (href) => {
  const response = await fetch(href)
  const htmlString = await response.text()
  const page = new DOMParser().parseFromString(htmlString, 'text/html')
  const title = page.querySelector('title').innerText
  return { page, title }
}

const defaultPageTransition = wipeAnimation

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

const animatePageIntoView = async (fullPage, pageTransition) => {
  const [page, prevPage] = getPageDiff(fullPage, document)
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
