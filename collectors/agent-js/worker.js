addEventListener('message', event => {

    const data = event.data.json();

    if (data.type == "unload-page") {

        data.cookies.map(c => {

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
        await postReport(trackingReport, data.endpoint);
    }

});