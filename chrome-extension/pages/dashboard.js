const endpointInput = document.querySelector("#endpoint-value");
const domains = document.querySelector("#domains");

/**
 * Update view from local storage data
 */
const updateView = () => {
    getRemoteEndpoint().then(endpoint => {
        endpointInput.value = endpoint;
    })

    getLocalConfigurationData().then( config => {
        domains.innerHTML = JSON.stringify(config);
    })
}

document
    .querySelector("#settings-save")
    .addEventListener("click", async () => {
        await setRemoteEndpoint(endpointInput.value);
        await updateConfiguration();
        updateView();
    });

updateView();