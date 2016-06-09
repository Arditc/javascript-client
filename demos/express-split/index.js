'use strict';

const app = require('express')();
const splitio = require('@splitsoftware/splitio');
let sdk;

if (process.env.SPLIT_SDK_MODE === 'offline') {
  console.log('offline mode');
  sdk = splitio({
    core: {
      authorizationKey: 'localhost'
    }
  });
} else {
  sdk = splitio({
    core: {
      authorizationKey: '5p2c0r4so20ill66lm35i45h6pkvrd2skmib' // nodejs environment
    },
    urls: {
      sdk: 'https://sdk-aws-staging.split.io/api',
      events: 'https://events-aws-staging.split.io/api'
    },
    scheduler: {
      featuresRefreshRate: 5,     // fetch feature updates each 1 sec
      segmentsRefreshRate: 5,     // fetch segment updates each 1 sec
      metricsRefreshRate: 10,     // publish metrics each 30 sec
      impressionsRefreshRate: 10  // publish evaluations each 30 sec
    }
  });
}

app.get('/in_five_keys/:key', function (req, res) {
  res.send(sdk.getTreatment(req.key, 'in_five_keys'));
});

app.get('/in_ten_keys/:key', function (req, res) {
  res.send(sdk.getTreatment(req.key, 'in_ten_keys'));
});

sdk.ready().then(function() {
  app.listen(process.env.PORT || 8889, function () {
    console.log('curl http://localhost:8889/in_five_keys/896c442121a3f0b955f6e639f88bc6');
    console.log('curl http://localhost:8889/in_ten_keys/b7192e2c16a8353f8d38453c4803e2');
  });
});
