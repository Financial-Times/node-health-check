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
module.exports = class GraphiteThresholdCheck extends Check {

	/**
	 * Create a ping URL health check. Accepts the same options as Check, but with a few additions.
	 * @param {Object} options - The health check options.
	 * @param {String} [options.method=GET] - The method to use when pinging the URL.
	 * @param {String} options.url - The URL to ping when the health check runs.
	 * @throws {TypeError} Will throw if any options are invalid.
	 */
	constructor(options) {
		super(options);
		GraphiteThresholdCheck.assertOptionValidity(options);
		this.full = options.full;
		this.response = options.response;
		this.direction = options.direction;
		this.threshold = options.threshold;
		if (typeof this.threshold !== 'number') {
			throw new Error('You must set a numerical threshold');
		}
		if (typeof this.threshold !== 'number') {
			throw new Error('You must set a numerical threshold');
		}
		if (!process.env.FT_GRAPHITE_KEY) {
			throw new Error('You must set up your Graphite key in your environment variables.')
		}
		if (!options.direction) {
			throw new Error('You must set whether you want to check "above" or "below" a threshold.')
		}
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
			headers: { key: process.env.FT_GRAPHITE_KEY }
		})
		.then((response) => {
			this.response = JSON.parse(response.body)[0].datapoints[0][0];
			if (this.direction == 'below') {
				if (this.response < this.threshold) {
					this.ok = false;
				} else {
					this.ok = true;
				}
			} else if (this.direction == 'above') {
				if (this.response > this.threshold) {
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
			return new TypeError('Invalid option: url must be a non-empty string or a function');
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