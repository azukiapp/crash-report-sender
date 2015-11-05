# bug-report-sender

[![Build Status](https://travis-ci.org/azukiapp/bug-report-sender.svg)](https://travis-ci.org/azukiapp/bug-report-sender)

send bugs to be analysed

#### install

```sh
npm install bug-report-sender --save

# dependency to inject
npm install request --save
```

#### usage

```js
var bugSender = require('bug-report-sender');
var libs = {request: request};

var error_to_send = new Error('THIS IS AN ERROR');

var options = {
  err: error_to_send,
  extra_values: {
    extra1: 'EXTRA VALUE 1',
    extra2: 'EXTRA VALUE 2'
  },
  libs: {requestFunction: require('request')},
  url: 'SOME_URL',
};

bugSender.send(options)
.then(function(result) {
  // OK
});

```

#### Test

```sh
gulp
```

#### Test (with integration test)

> to run integration test you need set `ENTRYPOINT` env

e.g.:
```sh
ENTRYPOINT=http://api.io/report/uruwhswaB0z3NMBnIxlPV8xXcy+98FBV gulp
```

#### Publish

```
npm run deploy <version>
```
