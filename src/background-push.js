import net from 'net';
import Sender from './sender';
import JStream from 'jstream';

require('source-map-support').install();

let stream  = new net.Socket({ fd: 3 });

function send(data) {
  let sender = new Sender({}, data.logger_opts);
  sender._send_now(data.data_send)
    .catch((error) => {
      sender.logger.error(['_background-push'], error);
    })
    .finally(() => stream.end());
}

let jstream = new JStream();
stream.pipe(jstream).on('data', send);
