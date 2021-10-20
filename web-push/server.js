const webPush = require('web-push');
const express = require('express');
var bodyParser = require('body-parser');
const app = express();
const port = 3000;


var x = webPush.generateVAPIDKeys();
//console.log(x);
var publicKey = 'BFlTvowRxNov9b3u_Xfpg1vFHsTdnPsXHYqXEeoJcL4np1nxoMCigD3Nq6fggKHhCVaLUhJaW2RQNzZUfqStLGM' || x.publicKey;
var privateKey = 'tv6V3sZdYHPNpgDALleVQFVmQO7s3Zysk9QVtL2nAAs' || x.privateKey;

webPush.setVapidDetails(
    'http://localhost/',
    publicKey,
    privateKey
);

var subscriptions = [];
app.get('/', (req, res) => {
    res.end('Hello World!');
});

app.get("/vapidPublicKey", (req, res) => {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    console.log(publicKey);
    res.send(publicKey);
});


// create application/json parser
var jsonParser = bodyParser.json();

app.post("/register", jsonParser, (req, res) => {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    //res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    var subscription = req.body;
    var duplicated = false;
    for (var i = 0; i < subscriptions.length; ++i) {
        if (JSON.stringify(subscriptions[i]) === JSON.stringify(subscription)) {
            console.log('duplicate: ' + subscription.endpoint);
            duplicated = true;
            break;
        }
    }
    if (duplicated === false) {
        subscriptions.push(subscription);
    }

    console.log(subscriptions.length);
    res.send(subscriptions);
});

// preflight request
app.options("*", jsonParser, (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.sendStatus(202);
});

app.post("/sendNotification", jsonParser, (req, res) => {
    var successs = true;
    for (var i = 0; i < subscriptions.length; ++i) {
        var subscription = subscriptions[i];
        //setTimeout(function (subscription) {
        console.log(subscription);

        const payload = JSON.stringify({
            path: (req.body.path || '/pwa/demo/'),
            title: (req.body.title || 'test title demo'),
            body: (req.body.body || JSON.stringify(subscription)),
        });
        const options = {
            TTL: req.body.ttl || 10
        };

        webPush.sendNotification(subscription, payload, options)
            .then(function () {
                //res.sendStatus(201);
            })
            .catch(function (error) {
                //res.sendStatus(500);
                successs = false;
                //subscriptions.splice(i, 1);
                //i--;
                
                //console.log(subscriptions.length);
                console.log(error);
            });
        //}, (req.body.delay || 2) * 1000, subscription);
    }

    if (successs && subscriptions.length > 0) {
        res.sendStatus(201);
    } else {
        res.sendStatus(500);
    }
});

app.listen(port, () => {
    console.log(`app listening at http://localhost:${port}`)
});
