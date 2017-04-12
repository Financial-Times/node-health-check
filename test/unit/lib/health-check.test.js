'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const sinon = require('sinon');

describe('lib/health-check', () => {
	let defaults;
	let healthCheck;
	let log;

	beforeEach(() => {
		defaults = sinon.spy(require('lodash/defaults'));
		mockery.registerMock('lodash/defaults', defaults);

		log = require('../mock/log.mock');

		healthCheck = require('../../..');
	});

	it('exports a function', () => {
		assert.isFunction(healthCheck);
	});

	it('has a `defaults` property', () => {
		assert.isObject(healthCheck.defaults);
	});

	describe('.defaults', () => {

		it('has a `checks` property', () => {
			assert.deepEqual(healthCheck.defaults.checks, []);
		});

		it('has a `log` property', () => {
			assert.strictEqual(healthCheck.defaults.log, console);
		});

	});

	describe('healthCheck(options)', () => {
		let health;
		let options;

		beforeEach(() => {
			options = {
				checks: [
					{
						name: 'mock-check'
					}
				],
				log
			};
			health = healthCheck(options);
		});

		it('defaults the passed in options', () => {
			assert.isObject(defaults.firstCall.args[0]);
			assert.strictEqual(defaults.firstCall.args[1], options);
			assert.strictEqual(defaults.firstCall.args[2], healthCheck.defaults);
		});

		it('returns an object', () => {
			assert.isObject(health);
			assert.isNotNull(health);
		});

		describe('returned object', () => {

			it('has an `options` property set to the defaulted options', () => {
				assert.isDefined(health.options);
				assert.strictEqual(health.options, defaults.firstCall.returnValue);
			});

		});

		describe('when `options` is not defined', () => {

			beforeEach(() => {
				defaults.reset();
				health = healthCheck();
			});

			it('defaults to an empty object', () => {
				assert.deepEqual(defaults.firstCall.args[1], {});
			});

		});

	});

});
