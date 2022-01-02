// Get references from dom
const endpointValue = document.querySelector("#endpoint-value");
const domains = document.querySelector("#domains-value");

// Load data from local storage and fill form
chrome.storage.local.get('settings', (val)=>{
    endpointValue.value = val.settings.endpointValue;
    domains.value = val.settings.domains;
});

// Handle form submit
document.querySelector("#settings-save").addEventListener("click", () => {
    chrome.storage.local.set({
        "settings": {
            "endpointValue": endpointValue.value,
            "domains" : domains.value
        }
    },
        () => {
            window.alert("Settings updated !");
        })
});


