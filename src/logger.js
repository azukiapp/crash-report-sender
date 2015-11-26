import winston from 'winston';

module.exports = class Logger {

  constructor(opts = {}) {
    this.winston = new (winston.Logger)({
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
    this.prefix = '[crash-report-sender] ';
  }

  _parseWhere(whereStr) {
    return '{ ' + whereStr.join(', ') + ' } -> ';
  }

  log(where, str) {
    this.winston.log(this.prefix, this._parseWhere(where), str);
  }

  decrash(where, str) {
    this.winston.decrash(this.prefix, this._parseWhere(where), str);
  }

  error(where, err) {
    this.winston.error(this.prefix, this._parseWhere(where), err);
  }

};
