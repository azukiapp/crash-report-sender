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

  _parseWhere(whereStr) {
    return '{ ' + whereStr.join(', ') + ' } -> ';
  }

  _defaultLogger(opts) {
    let winston = require('winston');
    return new (winston.Logger)({
      level: opts.level || 'info',
      transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({
          filename: opts.filename || '/tmp/crash-report-sender.log',
          handleExceptions: true,
          colorize: true,
          prettyPrint: true,
          json: false,
        })
      ]
    });
  }
}
