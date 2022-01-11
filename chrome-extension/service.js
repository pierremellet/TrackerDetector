/**
 * 
 * @returns Promise<string>
 */
const getRemoteEndpoint = async () => {
    return new Promise((res, rej) => {
        chrome.storage.local.get('endpoint', (val) => {
            res(val.endpoint);
        });
    });
}

const setRemoteEndpoint = async (endpoint) => {
    return new Promise((res, rej) => {
        chrome.storage.local.set({ 'endpoint': endpoint }, (val) => {
            res(val);
        });
    });
}

/**
 * 
 * @returns Promise<Configuration>
 */
const getLocalConfigurationData = () => {
    return new Promise((res, rej) => {
        chrome.storage.local.get('settings', (val) => {
            res(val.settings);
        });
    });
}

/**
 * 
 * @param {*} configuration 
 * @returns Promise
 */
const setLocalConfigurationData = (configuration) => {
    return new Promise((res, rej) => {
        chrome.storage.local.set({
            "settings": configuration
        }, res)
    });
}

const getRemoteConfigurationData = (endpoint) => {
    return new Promise((res, rej) => {
        // Fetch endpoint to get configuration
        const queyString = `
            {
                configuration {
                    domains
                }
            }
        `;

        const graphqlQuery = {
            "query": queyString,
            "operationName": null,
            "variables": {}
        }
        fetch(endpoint, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(graphqlQuery)
        })
            .then(resp => resp.json())
            .then(resp => resp.data.configuration)
            .then(configuration => res(configuration))
            .catch(err => rej(err));
    });
}

const updateConfiguration = async () => {
    const endpoint = await getRemoteEndpoint();
    if (Object.keys(endpoint).length > 0) {
        const remoteConfiguration = await getRemoteConfigurationData(endpoint);
        await setLocalConfigurationData(remoteConfiguration);
    } else {
        console.warn("Missing endpoint");
    }
}