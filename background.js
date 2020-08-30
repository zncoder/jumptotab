chrome.browserAction.onClicked.addListener(showPage)

function showPage() {
  chrome.tabs.create({"url": "popup.html"})
}
