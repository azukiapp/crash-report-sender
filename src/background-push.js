import net from 'net';
import Sender from './sender';

require('source-map-support').install();

var pipe = new net.Socket({ fd: 3 });
var sender = new Sender();

pipe.on('data', function (buf) {
  var data = JSON.parse(buf.toString('utf8'));
  sender._send(data)
  .then(() => {
    pipe.end();
    // wait one second to log save file
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  })
  .catch(() => {
    pipe.end();
    // wait one second to log save file
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

});
