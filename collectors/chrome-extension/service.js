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

const getDomains = (endpoint) => {
    return new Promise((res, rej) => {
        // Fetch endpoint to get configuration
        const queyString = `
            {
                configuration {
                    domains {
                        name
                    }
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
            .then(configuration => res({ "domains": configuration.domains.flatMap(t => t.name)}))
            .catch(err => rej(err));
    });
}

const updateConfiguration = async () => {
    const endpoint = await getRemoteEndpoint();
    console.debug(`Endpoint to update conf : `+JSON.stringify(endpoint));
    if (Object.keys(endpoint).length > 0) {
        const domains = await getDomains(endpoint);
        console.debug(`Domains to track : `+JSON.stringify(domains));
        await setLocalConfigurationData(domains);
    } else {
        console.warn("Missing endpoint");
    }
}