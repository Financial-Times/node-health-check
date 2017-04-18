/**
 * Module to validate health check objects.
 */
'use strict';

const isPlainObject = require('lodash/isPlainObject');

module.exports = validateHealthCheck;

/**
 * A list of allowed health check properties.
 * @access private
 */
const allowedHealthCheckProperties = new Set([
	'id',
	'name',
	'ok',
	'severity',
	'businessImpact',
	'technicalSummary',
	'panicGuide',
	'checkOutput',
	'lastUpdated'
]);

/**
 * A list of required health check properties.
 * @access private
 */
const requiredHealthCheckProperties = new Set([
	'id',
	'name',
	'severity',
	'businessImpact',
	'technicalSummary',
	'panicGuide'
]);

/**
 * A map of health check properties and their validation functions.
 * @access private
 */
const healthCheckPropertyValidators = new Map([
	['id', assertIsValidId],
	['name', assertIsNonEmptyString],
	['severity', assertIsValidSeverity],
	['businessImpact', assertIsNonEmptyString],
	['technicalSummary', assertIsNonEmptyString],
	['panicGuide', assertIsNonEmptyString],
	['checkOutput', assertIsString],
	['lastUpdated', assertIsValidIsoDate]
]);

/**
 * A map of health check properties and their validation errors.
 * @access private
 */
const healthCheckPropertyValidationErrors = new Map([
	['id', 'Health check id must be lowercase and alphanumeric with hyphens'],
	['name', 'Health check name must be a non-empty string'],
	['severity', 'Health check severity must be a number between 1 and 3'],
	['businessImpact', 'Health check businessImpact must be a non-empty string'],
	['technicalSummary', 'Health check technicalSummary must be a non-empty string'],
	['panicGuide', 'Health check panicGuide must be a non-empty string'],
	['checkOutput', 'Health check checkOutput must be a string'],
	['lastUpdated', 'Health check lastUpdated must be a valid ISO 8601 date and time']
]);

/**
 * Assert that a health check object is valid.
 * @param {Object} check - The health check object.
 * @throws {TypeError} Will throw if the health check is invalid.
 */
function validateHealthCheck(check) {
	assertIsObject(check, 'Health check must be an object');
	for (const property of requiredHealthCheckProperties) {
		assertIsDefined(check[property], `Missing required health check property: ${property}`);
	}
	for (const property of Object.keys(check)) {
		if (!allowedHealthCheckProperties.has(property)) {
			throw new Error(`Health checks cannot have a "${property}" property`);
		}
	}
	for (const [property, validateProperty] of healthCheckPropertyValidators) {
		if (check[property] !== undefined) {
			validateProperty(check[property], healthCheckPropertyValidationErrors.get(property));
		}
	}
}

/**
 * Assert that a value is a plain object.
 * @access private
 * @param {*} value - The value to check.
 * @param {String} errorMessage - The error message to throw if `value` is not a plain object.
 * @throws {TypeError} Will throw if the value is not a plain object.
 */
function assertIsObject(value, errorMessage) {
	if (!isPlainObject(value)) {
		throw new TypeError(errorMessage);
	}
}

/**
 * Assert that a value is defined.
 * @access private
 * @param {*} value - The value to check.
 * @param {String} errorMessage - The error message to throw if `value` is not defined.
 * @throws {TypeError} Will throw if the value is not defined.
 */
function assertIsDefined(value, errorMessage) {
	if (value === undefined) {
		throw new TypeError(errorMessage);
	}
}

/**
 * Assert that a value is a valid health check ID.
 * @access private
 * @param {*} value - The value to check.
 * @param {String} errorMessage - The error message to throw if `value` is invalid.
 * @throws {TypeError} Will throw if the value is invalid.
 */
function assertIsValidId(value, errorMessage) {
	assertIsNonEmptyString(value, errorMessage);
	if (!/^[a-z0-9\-]+$/.test(value)) {
		throw new TypeError(errorMessage);
	}
}

/**
 * Assert that a non-empty string.
 * @access private
 * @param {*} value - The value to check.
 * @param {String} errorMessage - The error message to throw if `value` is invalid.
 * @throws {TypeError} Will throw if the value is invalid.
 */
function assertIsNonEmptyString(value, errorMessage) {
	assertIsString(value, errorMessage);
	if (!value.trim()) {
		throw new TypeError(errorMessage);
	}
}

/**
 * Assert that a value is a string.
 * @access private
 * @param {*} value - The value to check.
 * @param {String} errorMessage - The error message to throw if `value` is invalid.
 * @throws {TypeError} Will throw if the value is invalid.
 */
function assertIsString(value, errorMessage) {
	if (typeof value !== 'string') {
		throw new TypeError(errorMessage);
	}
}

/**
 * Assert that a value is a valid health check severity.
 * @access private
 * @param {*} value - The value to check.
 * @param {String} errorMessage - The error message to throw if `value` is invalid.
 * @throws {TypeError} Will throw if the value is invalid.
 */
function assertIsValidSeverity(value, errorMessage) {
	if (typeof value !== 'number' || value < 1 || value > 3) {
		throw new TypeError(errorMessage);
	}
}

/**
 * Assert that a value is a valid ISO 8601 date/time.
 * @access private
 * @param {*} value - The value to check.
 * @param {String} errorMessage - The error message to throw if `value` is invalid.
 * @throws {TypeError} Will throw if the value is invalid.
 */
function assertIsValidIsoDate(value, errorMessage) {
	assertIsNonEmptyString(value, errorMessage);
	if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|\+\d{2}:\d{2})$/i.test(value)) {
		throw new TypeError(errorMessage);
	}
}
