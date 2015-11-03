import net from 'net';
import fs from 'fs';
var pipe = new net.Socket({ fd: 3 });

pipe.on('data', function (buf) {
  var data = JSON.parse(buf.toString('utf8'));

  var Sender = require('./sender');
  var sender = new Sender();

  sender._send(data)
  .then((result) => {
    pipe.end();
    if (data.enable_tmp_file_debug) {
      result.isError = false;
      fs.writeFileSync('/tmp/bug-report-sender.log', JSON.stringify(result, ' ', 2), 'utf8');
    }
    process.exit(0);
  })
  .catch((err) => {
    if (data.enable_tmp_file_debug) {
      err.isError = true;
      fs.writeFileSync('/tmp/bug-report-sender.log', JSON.stringify(err, ' ', 2), 'utf8');
    }
    process.exit(1);
  });

});
