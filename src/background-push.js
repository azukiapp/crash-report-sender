import net from 'net';
import Sender from './sender';
import JStream from 'jstream';

require('source-map-support').install();

function send(data) {
  let sender = new Sender({}, data['logger_opts']);
  sender._send_now(data['data_send'])
    .catch((error) => {
      sender.logger.error(['_background-push'], error);
    })
}

let stream  = new net.Socket({ fd: 3 });
let jstream = new JStream();
stream.pipe(jstream).on('data', send);
