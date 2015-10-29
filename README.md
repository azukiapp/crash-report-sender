# bug-report-sender

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
var request = require('request');
var libs = {request: request};

var error_to_send = new Error('THIS IS AN ERROR');

var options = {
  err: error_to_send,
  extra_values: {
    extra1: 'EXTRA VALUE 1',
    extra2: 'EXTRA VALUE 2'
  },
  libs: {requestLib: request},
  url: 'SOME_URL',
};

bugSender.send(options)
.then(function(result) {
  // OK
});

```

#### test/lint and watch

```sh
npm test
```
