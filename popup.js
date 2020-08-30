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
  let tid = parseInt(el.id.substring(1))
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

function searchTab(ev) {
  if (ev.key === "Enter") {
    selectFirstMatchedTab()
    return
  }

  let kws = ev.target.value.toLocaleLowerCase().split(/ +/).filter(w => w.length > 0)
  let links = document.querySelectorAll("a")
  let matched = 0
  for (let ln of links) {
    let title = ln.innerText.toLocaleLowerCase()
    let all = kws.length > 0
    for (let kw of kws) {
      if (title.indexOf(kw) < 0) {
        all = false
        break
      }
    }
    if (all) {
      matched++
      ln.classList.add("matched")
    } else {
      ln.classList.remove("matched")
    }
  }

  let s = matched > 0 ? `${matched}/${links.length}` : `${links.length}`
  document.querySelector("#count").innerText = s
}

function selectFirstMatchedTab() {
  let matched = document.querySelector(".matched")
  if (matched) {
    gotoTab(matched)
  }
}

async function render() {
  function tabToLi(tab, i) {
    let li = document.createElement("li")
    li.innerHTML = `<a id="t${tab.id}" href="#">${i+1}. ${tab.title}</a>`
    li.querySelector(`#t${tab.id}`).addEventListener("click", ev => gotoTab(ev.target))
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

  let search = document.querySelector("#search")
  search.addEventListener("keyup", searchTab)
  search.focus()

  let count = document.querySelector("#count")
  count.innerText = `${tabs.length}`
}

render()
