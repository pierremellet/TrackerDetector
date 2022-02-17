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
     
    const queyString = `
    mutation{
        createPartialReport(report: "${btoa(JSON.stringify(report))}")
    }
    `;


    const graphqlQuery = {
        "query": queyString,
        "operationName": null,
        "variables": {}
    }
    console.log(graphqlQuery);
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
const collectCookiesWithContext = async (tabId) => {
    const data = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => performance.getEntries()
            .filter(u => u.name.startsWith('https'))
            .map(e => {
                return {
                    "url": e.name.split(/[#?]/)[0],
                    "initiator": e.initiatorType
                }
            }),
    });

    if (chrome.runtime.lastError || !data || !data[0]) return;
    const urlWithInitiator = data[0].result;

    const results = await Promise.all(
        urlWithInitiator.map(uwi =>
            new Promise(resolve => {
                chrome.cookies.getAll({ url: uwi.url }).then(res => {
                    resolve({
                        "url": uwi.url,
                        "initiator": uwi.initiator,
                        "cookies": res.map(c => {
                            c.timestamp = (new Date()).getTime();
                            return c;
                        })
                    })
                });
            })
        )
    )

    var context = results.filter(c => c.cookies.length > 0).map((v, i) => {
        v['id'] = i;
        return v;
    });

    var dedupContext = [];
    context.forEach(c => {
        if (dedupContext.findIndex(e => e.url == c.url && e.initiator == c.initiator) == -1) {
            dedupContext.push(c);
        }
    })

    const cookies = dedupContext.flatMap(uwi => uwi.cookies);
    const uniqueCookies = cookies.filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i)
    var expanded = uniqueCookies.map(cookie => {
        return {
            "cookie": cookie,
            "contextIds": dedupContext.filter(dc => dc.cookies.findIndex(c => c.name == cookie.name) > -1).map(dc => dc.id)
        }
    })

    const result = {
        contexts : dedupContext.map(d => { return { id: d.id, url: d.url, initiator: d.initiator } }),
        cookies : expanded
    }

 

    return result;
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

    console.log(settings);
    // If message is page-unload and current tag domain is inclued within configured domains
    if (
        message == "page-unload"
        && settings.domains.findIndex(dom => sender.url.includes(dom)) != -1
    ) {

        const cwc = await collectCookiesWithContext(sender.tab.id);
        

        const trackingReport = {
            pageURL: sender.url,
            cookies: cwc.cookies,
            contexts: cwc.contexts,
        }

        console.log(trackingReport);
        const endpoint = await getRemoteEndpoint();
        await postReport(trackingReport, endpoint);
    }

})




