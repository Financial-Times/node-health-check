'use strict';

const assert = require('proclaim');

describe('lib/validate-health-check', () => {
	let validateHealthCheck;

	beforeEach(() => {
		validateHealthCheck = require('../../../lib/validate-health-check');
	});

	it('exports a function', () => {
		assert.isFunction(validateHealthCheck);
	});

	describe('validateHealthCheck(check)', () => {
		let check;

		beforeEach(() => {
			check = {
				id: 'mock-id',
				name: 'mock name',
				severity: 1,
				businessImpact: 'mock-business-impact',
				technicalSummary: 'mock-technical-summary',
				panicGuide: 'mock-panicGuide'
			};
		});

		it('does not throw an error', () => {
			assert.doesNotThrow(() => validateHealthCheck(check));
		});

		describe('when `check` is not an object', () => {

			it('throws an error', () => {
				const expectedErrorMessage = 'Health check must be an object';
				assert.throws(() => validateHealthCheck(''), expectedErrorMessage);
				assert.throws(() => validateHealthCheck([]), expectedErrorMessage);
				assert.throws(() => validateHealthCheck(null), expectedErrorMessage);
			});

		});

		describe('when `check` does not have an `id` property', () => {

			beforeEach(() => {
				delete check.id;
			});

			it('throws an error', () => {
				const expectedErrorMessage = 'Missing required health check property: id';
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage);
			});

		});

		describe('when `check` has an invalid `id` property', () => {

			it('throws an error', () => {
				const expectedErrorMessage = 'Health check id must be lowercase and alphanumeric with hyphens';
				check.id = '';
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage, 'empty string');
				check.id = 'has spaces';
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage, 'spaces');
				check.id = 123;
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage, 'non-string');
			});

		});

		describe('when `check` does not have a `name` property', () => {

			beforeEach(() => {
				delete check.name;
			});

			it('throws an error', () => {
				const expectedErrorMessage = 'Missing required health check property: name';
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage);
			});

		});

		describe('when `check` has an invalid `name` property', () => {

			it('throws an error', () => {
				const expectedErrorMessage = 'Health check name must be a non-empty string';
				check.name = '';
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage, 'empty string');
				check.name = 123;
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage, 'non-string');
			});

		});

		describe('when `check` does not have a `severity` property', () => {

			beforeEach(() => {
				delete check.severity;
			});

			it('throws an error', () => {
				const expectedErrorMessage = 'Missing required health check property: severity';
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage);
			});

		});

		describe('when `check` has an invalid `severity` property', () => {

			it('throws an error', () => {
				const expectedErrorMessage = 'Health check severity must be a number between 1 and 3';
				check.severity = 4;
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage, 'too high');
				check.severity = 0;
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage, 'too low');
				check.severity = '';
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage, 'non-number');
			});

		});

		describe('when `check` does not have a `businessImpact` property', () => {

			beforeEach(() => {
				delete check.businessImpact;
			});

			it('throws an error', () => {
				const expectedErrorMessage = 'Missing required health check property: businessImpact';
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage);
			});

		});

		describe('when `check` has an invalid `businessImpact` property', () => {

			it('throws an error', () => {
				const expectedErrorMessage = 'Health check businessImpact must be a non-empty string';
				check.businessImpact = '';
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage, 'empty string');
				check.businessImpact = 123;
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage, 'non-string');
			});

		});

		describe('when `check` does not have a `technicalSummary` property', () => {

			beforeEach(() => {
				delete check.technicalSummary;
			});

			it('throws an error', () => {
				const expectedErrorMessage = 'Missing required health check property: technicalSummary';
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage);
			});

		});

		describe('when `check` has an invalid `technicalSummary` property', () => {

			it('throws an error', () => {
				const expectedErrorMessage = 'Health check technicalSummary must be a non-empty string';
				check.technicalSummary = '';
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage, 'empty string');
				check.technicalSummary = 123;
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage, 'non-string');
			});

		});

		describe('when `check` does not have a `panicGuide` property', () => {

			beforeEach(() => {
				delete check.panicGuide;
			});

			it('throws an error', () => {
				const expectedErrorMessage = 'Missing required health check property: panicGuide';
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage);
			});

		});

		describe('when `check` has an invalid `panicGuide` property', () => {

			it('throws an error', () => {
				const expectedErrorMessage = 'Health check panicGuide must be a non-empty string';
				check.panicGuide = '';
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage, 'empty string');
				check.panicGuide = 123;
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage, 'non-string');
			});

		});

		describe('when `check` has a valid `checkOutput` property', () => {

			it('throws an error', () => {
				check.checkOutput = 'mock check output';
				assert.doesNotThrow(() => validateHealthCheck(check), undefined, 'string');
				check.checkOutput = '';
				assert.doesNotThrow(() => validateHealthCheck(check), undefined, 'empty string');
			});

		});

		describe('when `check` has an invalid `checkOutput` property', () => {

			it('throws an error', () => {
				const expectedErrorMessage = 'Health check checkOutput must be a string';
				check.checkOutput = 123;
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage, 'non-string');
			});

		});

		describe('when `check` has a valid `lastUpdated` property', () => {

			it('throws an error', () => {
				check.lastUpdated = '1988-01-26T10:00:00.000Z';
				assert.doesNotThrow(() => validateHealthCheck(check), undefined, 'with milliseconds');
				check.lastUpdated = '1988-01-26T10:00:00Z';
				assert.doesNotThrow(() => validateHealthCheck(check), undefined, 'without milliseconds');
				check.lastUpdated = '1988-01-26T10:00:00+01:00';
				assert.doesNotThrow(() => validateHealthCheck(check), undefined, 'without timezone offset');
			});

		});

		describe('when `check` has an invalid `lastUpdated` property', () => {

			it('throws an error', () => {
				const expectedErrorMessage = 'Health check lastUpdated must be a valid ISO 8601 date and time';
				check.lastUpdated = '';
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage, 'empty string');
				check.lastUpdated = 123;
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage, 'non-string');
				check.lastUpdated = '1988-01-26';
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage, 'no time');
				check.lastUpdated = '1988-01-26T10:00:00';
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage, 'no timezone');
			});

		});

		describe('when `check` has additional disallowed properties', () => {

			beforeEach(() => {
				check.notAllowed = 'bad property';
			});

			it('throws an error', () => {
				const expectedErrorMessage = 'Health checks cannot have a "notAllowed" property';
				assert.throws(() => validateHealthCheck(check), expectedErrorMessage);
			});

		});

	});

});
