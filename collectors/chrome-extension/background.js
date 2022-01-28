importScripts("./service.js");

/**
 * Open tracker finder in a new page
 */
const openDashboad = async () => {
    let url = chrome.runtime.getURL("pages/dashboard.html");
    await chrome.tabs.create({ url });
}


/**
 * POST report to backend for further analysis
 * 
 * @param {*} report 
 * @param {*} endpoint 
 */
const postReport = async (report, endpoint) => {
    const cookieToGQLString = (c) => `
    {
        name: "${c.name}"
        domain: "${c.domain}"
        path : "${c.path}"
        httpOnly : ${c.httpOnly}
        secure : ${c.secure}
        hostOnly: ${c.hostOnly}
        session : ${c.session}
      }
    `;
    const queyString = `
    mutation {
        createPartialReport(input: {
          url : "${report.url}"
          cookies : [${report.cookies.map(c => cookieToGQLString(c)).join(',')}]
        })
      }
    `;


    const graphqlQuery = {
        "query": queyString,
        "operationName": null,
        "variables": {}
    }
    console.log(endpoint);
    return fetch(endpoint, {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(graphqlQuery)
    });
}

/**
 * Get remote config periodicaly from server
 */
chrome.alarms.onAlarm.addListener(async a => {
    await updateConfiguration();
});

/**
 * Collect cookies from tabId
 * @param {*} tabId 
 * @returns a list of cookies
 */
const collectCookies = async (tabId) => {
    const data = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => performance.getEntries().map(e => e.name),
    });

    if (chrome.runtime.lastError || !data || !data[0]) return;
    const urls = data[0].result.map(url => url.split(/[#?]/)[0]);
    const uniqueUrls = [...new Set(urls).values()].filter(Boolean).filter(u => u.startsWith('https'));

    const results = await Promise.all(
        uniqueUrls.map(url =>
            new Promise(resolve => {
                chrome.cookies.getAll({ url }, resolve);
            })
        )
    )
    const cookies = [
        ...new Map(
            [].concat(...results)
                .map(c => [JSON.stringify(c), c])
        ).values()
    ];

    return cookies;
}


/**
 * Open dashboard page on first activation
 */
chrome.runtime.onInstalled.addListener(async () => {
    chrome.alarms.get('alarm', a => {
        if (!a) {
            chrome.alarms.create('alarm', { periodInMinutes: 0.5 });
        }
    });
});

/**
 * Open dashboard page on new tabs when action button is clicked
 */
chrome.action.onClicked.addListener((tab) => {
    openDashboad();
});


/**
 * Listen message from tabs to trigger cookies collect
 */
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {

    const settings = await getLocalConfigurationData();

    // If message is page-unload and current tag domain is inclued within configured domains
    if (
        message == "page-unload"
        && settings.domains.findIndex(dom => sender.url.includes(dom)) != -1
    ) {

        const cookies = (await collectCookies(sender.tab.id)).map(c => {

            return {
                "timestamp": (new Date()).getTime(),
                "name": c.name,
                "domain": c.domain,
                "duration": c.expirationDate,
                "path": c.path,
                "httpOnly": c.httpOnly,
                "hostOnly": c.hostOnly,
                "secure": c.secure,
                "session": c.session
            };
        });

        const trackingReport = {
            url: sender.url,
            cookies: cookies,
            pixels: []
        }
        const endpoint = await getRemoteEndpoint();
        await postReport(trackingReport, endpoint);
    }

})




