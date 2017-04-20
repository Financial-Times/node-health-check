/**
 * Module to build health check functions which comply with the FT health check standard.
 * @module @financial-times/health-check
 */
'use strict';

const defaults = require('lodash/defaults');
const validateHealthCheck = require('./validate-health-check');

module.exports = healthCheck;

/**
 * Health check option defaults. This will be merged with user options.
 * @access private
 */
module.exports.defaults = {
	checks: [],
	log: console
};

/**
 * Individual health check option defaults. This will be merged with user options.
 * @access private
 */
module.exports.checkDefaults = {
	interval: 30000
};

/**
 * Create a health check object.
 * @param {Object} [options={}] - The health check options.
 * @param {Array.<Object>} options.checks - An array of health check configurations.
 * @throws {TypeError} Will throw if any of the health checks are invalid.
 * @returns {Object} The created health check object.
 */
function healthCheck(options = {}) {
	options = defaultOptions(options);
	const checks = sanitizeChecks(options.checks);
	return {
		_checks: checks,
		_options: options
	};
}

/**
 * Default the health check options.
 * @access private
 * @param {Object} [options] - The health check options.
 * @returns {Object} The defaulted options.
 */
function defaultOptions(options) {
	return defaults({}, options, module.exports.defaults);
}

/**
 * Sanitize and validate each health check.
 * @access private
 * @param {Array} [checks] - The health checks array.
 * @returns {Array} The sanitized and validated health checks.
 */
function sanitizeChecks(checks) {
	return checks.map(check => {
		validateHealthCheck(check.output);
		return {
			config: defaults({}, check.config, module.exports.checkDefaults),
			output: check.output
		};
	});
}
