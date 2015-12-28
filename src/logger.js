import merge from 'lodash.merge';
import path from 'path';

export default class LoggerWraper {
  constructor(opts = {}) {
    if (typeof(opts.logger) === 'undefined') {
      this.logger = this._defaultLogger(opts);
    } else {
      this.logger = opts.logger;
    }
    this.error_level = opts.error_level || 'error';
    this.prefix = '[crash-report-sender] ';
  }

  log(level, where, str) {
    this.logger.log(level, this.prefix, this._parseWhere(where), str);
  }

  error(where, str) {
    this.log(this.error_level, where, str);
  }

  /**
   * Return filename for file log transport
   */
  get filename() {
    let transport = this.logger.transports.file;
    if (transport) {
      return path.join(transport.dirname, transport.filename);
    }
  }

  flush() {
    this.logger.flush();
  }

  _parseWhere(whereStr) {
    return '{ ' + whereStr.join(', ') + ' } -> ';
  }

  _defaultLogger(opts) {
    let winston = require('winston');
    let transports = [];

    opts = merge({}, {
      console: true,
    }, opts)

    // Log in console?
    if (opts.console) {
      transports.push(new (winston.transports.Console)());
    }

    // File log transport
    transports.push(new (winston.transports.File)({
      filename: opts.filename || '/tmp/crash-report-sender.log',
      handleExceptions: true,
      colorize: false,
      prettyPrint: true,
      json: false,
    }));

    return new (winston.Logger)({
      level: opts.level || 'info',
      transports: transports,
    });
  }
}
