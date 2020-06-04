/**
 * Module to create a health check object that pings a hostname/port through TCP/IP.
 */
'use strict';

const Check = require('../check');
const isNumber = require('lodash/isNumber');
const isPlainObject = require('lodash/isPlainObject');
const isString = require('lodash/isString');
const net = require('net');

/**
 * Class representing a single health check that pings a hostname/port through TCP/IP.
 */
module.exports = class TcpIpCheck extends Check {

	/**
	 * Create a TCP/IP health check. Accepts the same options as Check, but with a few additions.
	 * @param {Object} options - The health check options.
	 * @param {String} options.host - The hostname to ping when the health check runs.
	 * @param {Number} [options.port=80] - The method to use when pinging the host.
	 * @throws {TypeError} Will throw if any options are invalid.
	 */
	constructor(options) {
		TcpIpCheck.assertOptionValidity(options);
		super(options);
	}

	/**
	 * Actually perform the health check. This updates the relevant properties.
	 * @returns {Promise} A promise which resolves with undefined.
	 */
	run() {
		const socket = net.connect(this.options.port, this.options.host);

		return new Promise(resolve => {

			const timer = setTimeout(() => {
				socket.destroy();
				this.ok = false;
				this.checkOutput = 'timed out';
				this.lastUpdated = new Date();
				this.log.error(`Health check "${this.options.name}" failed: ${this.checkOutput}`);
				resolve();
			}, this.options.interval);
			
			if (timer.unref) {
				timer.unref();
			}

			socket.on('connect', () => {
				clearTimeout(timer);
				socket.destroy();
				this.ok = true;
				this.checkOutput = '';
				this.lastUpdated = new Date();
				resolve();
			});

			socket.on('error', error => {
				clearTimeout(timer);
				socket.destroy();
				this.ok = false;
				this.checkOutput = error.message;
				this.lastUpdated = new Date();
				this.log.error(`Health check "${this.options.name}" failed: ${error.message}`);
				resolve();
			});

		});
	}

	/**
	 * Validate health check options against the standard.
	 * @param {Object} options - The options to check.
	 * @returns {(Boolean|TypeError)} Will return `true` if the options are valid, or a descriptive error if not.
	 */
	static validateOptions(options) {
		if (!isPlainObject(options)) {
			return new TypeError('Options must be an object');
		}
		if (!isString(options.host) || !options.host.trim()) {
			return new TypeError('Invalid option: host must be a non-empty string');
		}
		if (!isNumber(options.port) || options.port < 1 || options.port > 65535) {
			return new TypeError('Invalid option: port must be a number between 1 and 65535');
		}
		return true;
	}

	/**
	 * Assert that health check options are valid.
	 * @param {Object} options - The options to assert validity of.
	 * @throws {TypeError} Will throw if the options are invalid.
	 */
	static assertOptionValidity(options) {
		const validationResult = TcpIpCheck.validateOptions(options);
		if (validationResult instanceof Error) {
			throw validationResult;
		}
	}

};
