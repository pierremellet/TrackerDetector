console.debug("Tracker Detector activated !");
 
var serviceWorkerRegistration;

if (navigator.serviceWorker) {
  navigator.serviceWorker.register('http://localhost:8080/worker.js'); 
  navigator.serviceWorker.ready.then( registration => { 
    serviceWorkerRegistration = registration;
  });
}else{
  console.debug("Service Worker feature isn't available");
}

const triggerCollectTrackers = async () => {
   if(serviceWorkerRegistration){ 
     const message = {
       type: 'page-unload',
       endpoint: '',
       cookies : document.cookies || []
     }
    serviceWorkerRegistration.active.postMessage(message);
   }
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
 
 