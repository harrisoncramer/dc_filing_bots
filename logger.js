const winston  = require('winston');
const fs = require('fs');
const path = require('path');
const { environment } = require("./keys/config");
const logDir = 'log';

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const filename = environment === "production" ? path.join(logDir, 'results.log') : path.join(logDir, 'results-test.log');

const logger = winston.createLogger({
	transports: [
		new (winston.transports.Console)({
			// silent: !!process.env.TEST_ENV,
			level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
			format: winston.format.combine(
				winston.format.timestamp(),
				winston.format.printf(info => {

					const message = info[Symbol.for('splat')] ? info.message + ' - ' + info[Symbol.for('splat')][0] : info.message;

					return `[${info.timestamp}][PID=${process.pid}][${winston.format.colorize(info.level, info.level.toUpperCase())}]: ${message}`;
				})
			)
    }),
    new winston.transports.File({ filename })
	]
});

module.exports = logger;