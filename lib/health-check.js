/**
 * Module to build health check functions which comply with the FT health check standard.
 * @module @financial-times/health-check
 */
'use strict';

const Check = require('./check');
const defaults = require('lodash/defaults');

/**
 * Class representing a set of health checks.
 */
module.exports = class HealthCheck {

	/**
	 * Create a health check set.
	 * @param {Object} options - The health check set options.
	 * @param {Array} options.checks - An array of health check configurations.
	 * @param {Object} [options.log=console] - A logging object.
	 * @throws {TypeError} Will throw if any options are invalid.
	 */
	constructor(options) {
		this.options = defaults({}, options, HealthCheck.defaultOptions);
		this.checkObjects = this.options.checks.map(checkOptions => {
			checkOptions.log = this.options.log;

			if (checkOptions instanceof HealthCheck.Check) {
				return checkOptions;
			}
			if (!Object.prototype.hasOwnProperty.call(HealthCheck.checkTypeMap,checkOptions.type)) {
				throw new TypeError(`Invalid check type: ${checkOptions.type}`);
			}
			const CheckTypeClass = HealthCheck.checkTypeMap[checkOptions.type];
			return new CheckTypeClass(checkOptions);
		});
		this.log = this.options.log;
	}

	/**
	 * Stop all of the checks from running, calling the `stop` method of each.
	 * @returns {undefined}
	 */
	stop() {
		this.checkObjects.forEach(check => {
			if (check.isRunning()) {
				check.stop();
			}
		});
	}

	/**
	 * Get a health check function that's compatible with:
	 * https://github.com/Financial-Times/express-web-service
	 * @returns {Function} A function which returns a promise that resolves to the check data.
	 */
	checks() {
		return () => Promise.resolve(this.toJSON());
	}

	/**
	 * Get a good-to-go function that's compatible with:
	 * https://github.com/Financial-Times/express-web-service
	 * @returns {Function} A function which returns a promise that resolves to a boolean indicating whether all the health checks are OK.
	 */
	gtg() {
		return () => {
			const ok = this.toJSON()
				.filter(check => check.severity === 1)
				.every(check => check.ok);
			return Promise.resolve(ok);
		};
	}

	/**
	 * Get a JSON representation of the health check set.
	 * @access private
	 * @returns {Object} The health check set as a JSON-friendly object.
	 */
	toJSON() {
		return this.checkObjects.map(check => check.toJSON());
	}

	/**
	 * Get console-friendly representation of the health check set.
	 * @access private
	 * @returns {String} The console-friendly representation.
	 */
	inspect() {
		const inspect = this.checkObjects.map(check => `  ${check.inspect()}`);
		inspect.unshift(`${this.constructor.name} {`);
		inspect.push('}');
		return inspect.join('\n');
	}

};

/**
 * HealthCheck option defaults. This will be merged with user options.
 * @access private
 */
module.exports.defaultOptions = {
	checks: [],
	log: console
};

/**
 * HealthCheck type to class map.
 * @access private
 */
module.exports.checkTypeMap = {
	get 'cpu' () {
		return require('./check/cpu');
	},
	get 'disk-space' () {
		return require('./check/disk-space');
	},
	get 'memory' () {
		return require('./check/memory');
	},
	get 'ping-url' () {
		return require('./check/ping-url');
	},
	get 'tcp-ip' () {
		return require('./check/tcp-ip');
	}
};

/**
 * HealthCheck Check class.
 * @access public
 */
module.exports.Check = Check;
