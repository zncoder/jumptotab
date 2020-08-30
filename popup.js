function queryTabs() {
  return new Promise(resolve => chrome.tabs.query({}, tabs => { resolve(tabs) }))
}

function getTab(tid) {
  return new Promise(resolve => chrome.tabs.get(tid, tab => { resolve(tab) }))
}

function currentWin() {
  return new Promise(resolve => chrome.windows.getCurrent({}, win => { resolve(win) }))
}

function currentTab() {
  return new Promise(resolve => chrome.tabs.getCurrent(tab => { resolve(tab) }))
}

async function gotoTab(el) {
  let tid = parseInt(el.target.id.substring(1))
  let tab = await getTab(tid)
  let cw = await currentWin()
  if (cw.id != tab.windowId) {
    chrome.windows.update(tab.windowId, {focused: true})
  }
  chrome.tabs.update(tab.id, {active: true})
  let cur = await currentTab()
  chrome.tabs.remove(cur.id)
}

async function getAllTabs() {
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
  return tabs
}

async function render() {
  function tabToLi(tab, i) {
    let li = document.createElement("li")
    li.innerHTML = `<a id="t${tab.id}" href="#">${i+1}. ${tab.title}</a>`
    li.querySelector(`#t${tab.id}`).addEventListener("click", gotoTab)
    return li
  }

  let tabs = await getAllTabs()
  let left = document.querySelector("#left")
  let right = document.querySelector("#right")
  for (let i = 0, half = parseInt((tabs.length+1)/2); i < tabs.length; i++) {
    let li = tabToLi(tabs[i], i)
    let div = i < half ? left : right
    div.appendChild(li)
  }
}

render()
