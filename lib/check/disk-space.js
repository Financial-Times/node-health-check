/**
 * Module to create a health check object that polls disk space usage.
 */
'use strict';

const Check = require('../check');
const isNumber = require('lodash/isNumber');
const isPlainObject = require('lodash/isPlainObject');
const disk = require('diskusage');

/**
 * Class representing a single health check that polls disk space usage.
 */
module.exports = class DiskSpaceCheck extends Check {

	/**
	 * Create a disk space health check. Accepts the same options as Check, but with a few additions.
	 * @param {Object} options - The health check options.
	 * @param {Number} [options.threshold=75] - The maximum disk space usage (percentage) to allow before alerting.
	 * @throws {TypeError} Will throw if any options are invalid.
	 */
	constructor(options) {
		if (options && !options.threshold) {
			options.threshold = 75;
		}
		DiskSpaceCheck.assertOptionValidity(options);
		super(options);
	}

	/**
	 * Actually perform the health check. This updates the relevant properties.
	 * @returns {Promise} A promise which resolves with undefined.
	 */
	run() {
		return new Promise(resolve => {
			disk.check('/', (error, result) => {
				if (error) {
					this.ok = false;
					this.checkOutput = error.message;
					this.log.error(`Health check "${this.options.name}" failed: ${error.message}`);
				} else {
					const diskUsed = result.available - result.free;
					const diskPercentageUsed = (diskUsed / result.available) * 100;
					this.checkOutput = `${diskPercentageUsed}% used`;
					if (diskPercentageUsed <= this.options.threshold) {
						this.ok = true;
					} else {
						this.ok = false;
						this.log.error(`Health check "${this.options.name}" failed: ${this.checkOutput}`);
					}
				}
				this.lastUpdated = new Date();
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
		if (!isNumber(options.threshold) || options.threshold < 1 || options.threshold > 100) {
			return new TypeError('Invalid option: threshold must be a number between 1 and 100');
		}
		return true;
	}

	/**
	 * Assert that health check options are valid.
	 * @param {Object} options - The options to assert validity of.
	 * @throws {TypeError} Will throw if the options are invalid.
	 */
	static assertOptionValidity(options) {
		const validationResult = DiskSpaceCheck.validateOptions(options);
		if (validationResult instanceof Error) {
			throw validationResult;
		}
	}

};
