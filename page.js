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
    initTabs: function() { _initTabs(this) },
    matchTabs: function() { _matchTabs(this) },
    selectTab: function() { _selectTab(this) },
    removeTab: function(ti) { _removeTab(this, ti) },
    gotoTab: function(ti) { _gotoTab(ti) },
  },
})

async function _initTabs(vu) {
  let tabs = await _getAllTabs()
  tabsInfo = tabs.map((t, i) => {
    return {
      id: "t" + t.id,
      favicon: t.favIconUrl,
      title: `${i+1}. ${t.title}`,
      removed: false,
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
  vu.columns = cols  
  vu.total = tabsInfo.length
  vu.$refs.searchbox.focus()
}

function _matchTabs(vu) {
  let kws = vu.searchWords.toUpperCase().split(/ +/).filter(w => w.length > 0)
  let matched = 0 
  for (let col of vu.columns) {
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
  vu.matched = matched
}

function _selectTab(vu) {
  for (let col of vu.columns) {
    for (let ti of col.tabsInfo) {
      if (ti.matched) {
        _gotoTab(ti)
        return
      }
    }
  }
  _newTab()
}

function _removeTab(vu, ti) {
  let tid = parseInt(ti.id.substring(1))
  chrome.tabs.remove(tid)
  vu.$emit("remove-tab", tid)
  ti.removed = true
}

async function _newTab() {
  let cur = await _currentTab(),
      cw = await _currentWin(),
      targetw
  if (cw.tabsInfo.length === 1) {
    // extension tab is the only tab, open a tab in another window
    let wins = await _allWins()
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

async function _gotoTab(ti) {
  if (ti.removed) {
    return
  }
  let tid = parseInt(ti.id.substring(1))
  let tab = await _getTab(tid)
  let cw = await _currentWin()
  if (cw.id != tab.windowId) {
    chrome.windows.update(tab.windowId, {focused: true})
  }
  chrome.tabs.update(tab.id, {active: true})
  let cur = await _currentTab()
  chrome.tabs.remove(cur.id)
}

function _queryTabs() {
  return new Promise(resolve => chrome.tabs.query({}, tabs => { resolve(tabs) }))
}

function _getTab(tid) {
  return new Promise(resolve => chrome.tabs.get(tid, tab => { resolve(tab) }))
}

function _currentWin() {
  return new Promise(resolve => chrome.windows.getCurrent({populate: true}, win => { resolve(win) }))
}

function _currentTab() {
  return new Promise(resolve => chrome.tabs.getCurrent(tab => { resolve(tab) }))
}

function _allWins() {
  return new Promise(r => {
    chrome.windows.getAll({windowTypes: ["normal"], populate: true}, wins => r(wins))
  })
}

async function _getAllTabs() {
  let tabs = await _queryTabs()
  let ct = await _currentTab()
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
