function queryTabs() {
  return new Promise(resolve => chrome.tabs.query({}, tabs => { resolve(tabs) }))
}

function getTab(tid) {
  return new Promise(resolve => chrome.tabs.get(tid, tab => { resolve(tab) }))
}

function currentWin() {
  return new Promise(resolve => chrome.windows.getCurrent({}, win => { resolve(win) }))
}

async function gotoTab(el) {
  let tid = parseInt(el.target.id.substring(1))
  let tab = await getTab(tid)
  let cw = await currentWin()
  if (cw.id != tab.windowId) {
    chrome.windows.update(tab.windowId, {focused: true})
  }
  chrome.tabs.update(tab.id, {active: true})
}

async function build() {
  let tabs = await queryTabs()
  let cw = await currentWin()
  tabs.sort((a, b) => {
    if (a.windowId === b.windowId) {
      return a.index - b.index
    } else if (a.windowId === cw.id) {
      return -1
    } else if (b.windowId === cw.id) {
      return 1
    } else {
      return a.windowId - b.windowId
    }
  })

  let s = ""
  let w = -1
  for (let tab of tabs) {
    let id = tab.id
    let title = tab.title
    if (tab.windowId !== w) {
      if (w !== -1) {
        s += `<li><hr></li>\n`
      }
      w = tab.windowId
    }
    s += `<li><a id="t${id}" href="#">${title}</a></li>\n` 
  }
  document.querySelector("#menubox").innerHTML = s
  for (let tab of tabs) {
    let id = tab.id
    document.querySelector(`#t${id}`).addEventListener("click", gotoTab)
  }
}

build()
