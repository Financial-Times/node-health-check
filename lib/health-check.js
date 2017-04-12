/**
 * Module to build health check functions which comply with the FT health check standard.
 * @module @financial-times/health-check
 */
'use strict';

const defaults = require('lodash/defaults');

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
 * Create a health check object.
 * @param {Object} [options={}] - The health check options.
 * @param {Array.<Object>} options.checks - An array of health check configurations.
 * @returns {Object} The created health check object.
 */
function healthCheck(options = {}) {
	options = defaultOptions(options);
	return {options};
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
