/**
 * Module to create a health check object that pings a URL.
 */
'use strict';

const Check = require('../check');
const isFunction = require('lodash/isFunction');
const isPlainObject = require('lodash/isPlainObject');
const isString = require('lodash/isString');
const request = require('request-promise-native');

/**
 * Class representing a single health check that pings a URL.
 */
module.exports = class PingUrlCheck extends Check {

	/**
	 * Create a ping URL health check. Accepts the same options as Check, but with a few additions.
	 * @param {Object} options - The health check options.
	 * @param {String} [options.method=HEAD] - The method to use when pinging the URL.
	 * @param {String} options.url - The URL to ping when the health check runs.
	 * @throws {TypeError} Will throw if any options are invalid.
	 */
	constructor(options) {
		PingUrlCheck.assertOptionValidity(options);
		super(options);
	}

	/**
	 * Actually perform the health check. This updates the relevant properties.
	 * @returns {Promise} A promise which resolves with undefined.
	 */
	run() {
		return request({
			uri: (typeof this.options.url === 'function' ? this.options.url() : this.options.url),
			method: this.options.method || 'HEAD',
			headers: this.options.headers || {},
			resolveWithFullResponse: true,
			timeout: this.options.interval
		})
		.then(() => {
			this.ok = true;
			this.checkOutput = '';
			this.lastUpdated = new Date();
		})
		.catch(error => {
			this.ok = false;
			this.checkOutput = error.message;
			this.lastUpdated = new Date();
			this.log.error(`Health check "${this.options.name}" failed: ${error.message}`);
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
		if (!isFunction(options.url) && (!isString(options.url) || !options.url.trim())) {
			return new TypeError('Invalid option: url must be a non-empty string or a function');
		}
		if (options.headers !== undefined && !isPlainObject(options.headers)) {
			return new TypeError('Invalid option: headers must be an object');
		}
		return true;
	}

	/**
	 * Assert that health check options are valid.
	 * @param {Object} options - The options to assert validity of.
	 * @throws {TypeError} Will throw if the options are invalid.
	 */
	static assertOptionValidity(options) {
		const validationResult = PingUrlCheck.validateOptions(options);
		if (validationResult instanceof Error) {
			throw validationResult;
		}
	}

};
