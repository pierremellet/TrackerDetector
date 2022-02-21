console.info("Tracker activated");

const triggerCollectTrackers = () => {
  chrome.runtime.sendMessage('page-unload');
}

window.onbeforeunload = function (e) {
  triggerCollectTrackers();
};

window.onhashchange = function () {
  triggerCollectTrackers();
}

window.onpopstate = function () {
  triggerCollectTrackers();
}

let lastUrl = location.href; 
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    triggerCollectTrackers();
  }
}).observe(document, {subtree: true, childList: true});
 
 