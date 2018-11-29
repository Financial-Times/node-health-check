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
 * Class representing a single health check that periodically checks a Graphite metric.
 */
module.exports = class GraphiteThresholdCheck extends Check {

	/**
	 * Create a Graphite threshold health check. Accepts the same options as Check, but with a few additions.
	 * @param {Object} options - The health check options.
	 * @param {String} [options.method=GET] - The method to use when pinging the URL.
	 * @param {String} options.url - The URL to ping when the health check runs.
	 * @throws {TypeError} Will throw if any options are invalid.
	 */
	constructor(options) {
		super(options);
		GraphiteThresholdCheck.assertOptionValidity(options);
		this.direction = options.direction;
		this.threshold = options.threshold;
		this.graphiteKey = options.graphiteKey;
	}

	/**
	 * Actually perform the health check. This updates the relevant properties.
	 * @returns {Promise} A promise which resolves with undefined.
	 */
	run() {
		return request({
			uri: this.options.url,
			method: this.options.method || 'GET',
			resolveWithFullResponse: true,
			timeout: this.options.interval,
			headers: { key: this.options.graphiteKey }
		})
		.then((response) => {
			this.response = JSON.parse(response.body);
			this.currentReading = this.response[0].datapoints[0][0];
			if (this.direction === 'below') {
				if (this.currentReading < this.threshold) {
					this.ok = false;
				} else {
					this.ok = true;
				}
			} else {
				if (this.currentReading > this.threshold) {
					this.ok = false;
				} else {
					this.ok = true;
				}
			}
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
			return new TypeError('Invalid option: url must be a non-empty string');
		}
		if (typeof options.threshold !== 'number') {
			return new Error('You must set a numerical threshold');
		}
		if (!options.graphiteKey) {
			return new Error('You must set up your Graphite key in your environment variables.');
		}
		if (options.direction !== 'above' && options.direction !== 'below') {
			return new Error('You must set whether you want to check "above" or "below" a threshold.');
		}
		return true;
	}

	/**
	 * Assert that health check options are valid.
	 * @param {Object} options - The options to assert validity of.
	 * @throws {TypeError} Will throw if the options are invalid.
	 */
	static assertOptionValidity(options) {
		const validationResult = GraphiteThresholdCheck.validateOptions(options);
		if (validationResult instanceof Error) {
			throw validationResult;
		}
	}

};
