const numCols = 2

var app = new Vue({
  el: "#app",
  data: {
    total: 0,
    matched: 0,
    columns: [],
    searchWords: "",
  },
  created: function() { this.initTabs() },
  methods: {
    initTabs: async function() { initTabs(this) },
    matchTabs: function() { matchTabs(this) },
    selectTab: function() { selectTab(this) },
  },
})

async function initTabs(that) {
  let tabs = await getAllTabs()
  tabsInfo = tabs.map((t, i) => {
    return {
      id: "" + t.id,
      favicon: t.favIconUrl,
      title: `${i+1}. ${t.title}`,
    }
  })

  let cols = []
  let n = (tabsInfo.length+numCols-1) / numCols
  for (let i = 0; i < tabsInfo.length; i += n) {
    let j = i + n
    if (j >= tabsInfo.length) {
      j = tabsInfo.length
    }
    cols.push({
      cls: `col-${i/n}`,
      tabsInfo: tabsInfo.slice(i, j)
    })
  }
  that.columns = cols  
  that.total = tabsInfo.length
  that.$refs.searchbox.focus()
}

function matchTabs(that) {
  let kws = that.searchWords.toUpperCase().split(/ +/).filter(w => w.length > 0)
  let matched = 0 
  for (let col of that.columns) {
    for (let ti of col.tabsInfo) {
      let title = ti.title.toUpperCase()
      let all = kws.length > 0
      for (let kw of kws) {
        if (title.indexOf(kw) < 0) {
          all = false
          break
        }
      }
      ti.matched = all
      if (all) {
        matched++
      }
    }
  }
  that.matched = matched
}

function selectTab(that) {
  for (let col of that.columns) {
    for (let ti of col.tabsInfo) {
      if (ti.matched) {
        gotoTab(ti)
        return
      }
    }
  }
  newTab()
}

async function newTab() {
  let cur = await currentTab(),
      cw = await currentWin(),
      targetw
  if (cw.tabsInfo.length === 1) {
    // extension tab is the only tab, open a tab in another window
    let wins = await allWins()
    for (let w of wins) {
      if (w.id !== cw.id) {
        targetw = w
        break
      }
    }
  }
  if (targetw) {
    chrome.windows.update(targetw.id, {focused: true})
  } else {
    targetw = cw
  }
  chrome.tabs.create({windowId: targetw.id})
  chrome.tabs.remove(cur.id)
}

async function gotoTab(ti) {
  let tid = parseInt(ti.id)
  let tab = await getTab(tid)
  let cw = await currentWin()
  if (cw.id != tab.windowId) {
    chrome.windows.update(tab.windowId, {focused: true})
  }
  chrome.tabs.update(tab.id, {active: true})
  let cur = await currentTab()
  chrome.tabs.remove(cur.id)
}

function queryTabs() {
  return new Promise(resolve => chrome.tabs.query({}, tabs => { resolve(tabs) }))
}

function getTab(tid) {
  return new Promise(resolve => chrome.tabs.get(tid, tab => { resolve(tab) }))
}

function currentWin() {
  return new Promise(resolve => chrome.windows.getCurrent({populate: true}, win => { resolve(win) }))
}

function currentTab() {
  return new Promise(resolve => chrome.tabs.getCurrent(tab => { resolve(tab) }))
}

function allWins() {
  return new Promise(r => {
    chrome.windows.getAll({windowTypes: ["normal"], populate: true}, wins => r(wins))
  })
}

async function getAllTabs() {
  let tabs = await queryTabs()
  let ct = await currentTab()
  tabs = tabs.filter(t => t.id !== ct.id) // don't show the extension page tab 
  tabs.sort((a, b) => {
    let r = a.title.toUpperCase()
    let s = b.title.toUpperCase()
    if (r < s) {
      return -1
    } else if (r === s) {
      return 0
    }
    return 1
  })
  return tabs
}
