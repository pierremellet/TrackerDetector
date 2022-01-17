const http = require('http');

const query = `
mutation {
    createPartialReport(
      input: {
        url: "http://localhost/test"
        cookies: [
          {
            name: "cookie_a"
            domain: ".test.fr"
            path: "/"
            httpOnly: false
            secure: false
            hostOnly: false
            session: false
          },
          {
            name: "cookie_b"
            domain: ".test.fr"
            path: "/"
            httpOnly: false
            secure: false
            hostOnly: false
            session: true
          }
        ]
      }
    )
  }
`

const graphqlQuery = JSON.stringify({
    "query": query,
    "operationName": null,
    "variables": {}
})

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/graphql',
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': graphqlQuery.length
    }
}

const req = http.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`)

    res.on('data', d => {
        process.stdout.write(d)
    })
})

req.on('error', error => {
    console.error(error)
});

req.write(graphqlQuery);
req.end();