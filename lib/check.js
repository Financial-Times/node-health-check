/**
 * Module to create a health check object.
 */
'use strict';

const defaults = require('lodash/defaults');
const isFinite = require('lodash/isFinite');
const isPlainObject = require('lodash/isPlainObject');
const isString = require('lodash/isString');

/**
 * Class representing a single health check.
 */
module.exports = class Check {

	/**
	 * Create a health check. The options used here are documented in the Health check standard:
	 * https://docs.google.com/document/d/18hefJjImF5IFp9WvPAm9Iq5_GmWzI9ahlKSzShpQl1s/edit
	 * @param {Object} options - The health check options.
	 * @param {String} options.businessImpact - The business impact of the health check.
	 * @param {String} options.id - The unique ID of the health check. Must use only lowercase alphanumeric characters and hyphens.
	 * @param {Number} [options.interval=30000] - The number of milliseconds to wait between checks.
	 * @param {Object} [options.log=console] - A logging object.
	 * @param {Function} [options.log.error] - A function to log error level messages.
	 * @param {String} options.name - The name of the health check.
	 * @param {String} options.panicGuide - The panic guide for the health check.
	 * @param {Number} [options.severity=1] - The severity level of the health check if it is failing. Must be one of 1 (high), 2 (medium), 3 (low).
	 * @param {String} options.technicalSummary - The technical summary for the health check.
	 * @throws {TypeError} Will throw if any options are invalid.
	 */
	constructor(options) {
		this.options = defaults({}, options, Check.defaultOptions);
		Check.assertOptionValidity(this.options);
		this.log = this.options.log;

		// Save output options to properties
		this.businessImpact = this.options.businessImpact;
		this.id = this.options.id;
		this.interval = this.options.interval;
		this.name = this.options.name;
		this.panicGuide = this.options.panicGuide;
		this.severity = this.options.severity;
		this.technicalSummary = this.options.technicalSummary;

		// Set defaults
		this.checkOutput = '';
		this.ok = true;
		this.lastUpdated = new Date();

		// Start running the healthcheck
		this.start();
	}

	/**
	 * Start running the health check.
	 * @throws {Error} Will throw if the health check is already running.
	 */
	start() {
		if (this.isRunning()) {
			throw new Error('The check has already been started');
		}
		this.run();
		this._interval = setInterval(this.run.bind(this), this.options.interval);
	}

	/**
	 * Stop running the health check.
	 * @throws {Error} Will throw if the health check is not running.
	 */
	stop() {
		if (!this.isRunning()) {
			throw new Error('The check has not been started');
		}
		clearInterval(this._interval);
		delete this._interval;
	}

	/**
	 * Check whether the check is currently running.
	 * @returns {Boolean} Returns whether the check is running.
	 */
	isRunning() {
		return Boolean(this._interval);
	}

	/**
	 * Actually perform the health check. This updates the relevant properties.
	 * @returns {Promise} A promise which resolves with undefined.
	 */
	run() {
		throw new Error('The Check class must be extended rather than used directly');
	}

	/**
	 * Get a JSON representation of the health check.
	 * @access private
	 * @returns {Object} The health check as a JSON-friendly object.
	 */
	toJSON() {
		return {
			id: this.id,
			name: this.name,
			ok: this.ok,
			severity: this.severity,
			businessImpact: this.businessImpact,
			technicalSummary: this.technicalSummary,
			panicGuide: this.panicGuide,
			checkOutput: this.checkOutput,
			lastUpdated: this.lastUpdated.toISOString()
		};
	}

	/**
	 * Get console-friendly representation of the health check.
	 * @access private
	 * @returns {String} The console-friendly representation.
	 */
	inspect() {
		return `${this.constructor.name} [${this.ok ? 'OK' : 'NOT OK'}] ${this.name} (updated ${this.lastUpdated.toISOString()})`;
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
		for (const option of module.exports.requiredOptions) {
			if (options[option] === undefined) {
				return new TypeError(`Missing required option: ${option}`);
			}
		}
		if (!isString(options.businessImpact) || !options.businessImpact.trim()) {
			return new TypeError('Invalid option: businessImpact must be a non-empty string');
		}
		if (!isString(options.id) || !/^[a-z0-9\-]+$/.test(options.id)) {
			return new TypeError('Invalid option: id must be lowercase and alphanumeric with hyphens');
		}
		if (!isString(options.name) || !options.name.trim()) {
			return new TypeError('Invalid option: name must be a non-empty string');
		}
		if (!isString(options.panicGuide) || !options.panicGuide.trim()) {
			return new TypeError('Invalid option: panicGuide must be a non-empty string');
		}
		if (!isFinite(options.severity) || options.severity < 1 || options.severity > 3) {
			return new TypeError('Invalid option: severity must be 1, 2, or 3');
		}
		if (!isString(options.technicalSummary) || !options.technicalSummary.trim()) {
			return new TypeError('Invalid option: technicalSummary must be a non-empty string');
		}
		return true;
	}

	/**
	 * Assert that health check options are valid.
	 * @param {Object} options - The options to assert validity of.
	 * @throws {TypeError} Will throw if the options are invalid.
	 */
	static assertOptionValidity(options) {
		const validationResult = Check.validateOptions(options);
		if (validationResult instanceof Error) {
			throw validationResult;
		}
	}

};

/**
 * Check option defaults. This will be merged with user options.
 * @access private
 */
module.exports.defaultOptions = {
	interval: 30000,
	log: console,
	severity: 1
};

/**
 * A list of options that are required.
 * @access private
 */
module.exports.requiredOptions = new Set([
	'businessImpact',
	'id',
	'interval',
	'name',
	'panicGuide',
	'severity',
	'technicalSummary'
]);
