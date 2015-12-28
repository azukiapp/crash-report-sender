import net from 'net';
import Sender from './sender';

require('source-map-support').install();

let pipe = new net.Socket({ fd: 3 });

pipe.on('data', function (buf) {
  let data   = JSON.parse(buf.toString('utf8'));
  let sender = new Sender({}, data['logger_opts']);

  sender._send(data['data_send'])
    .finally(() => {
      pipe.end();
      // wait one second to log save file
      sender.logger.flush();
    });
});
