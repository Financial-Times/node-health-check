'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const sinon = require('sinon');

describe('lib/health-check', () => {
	let defaults;
	let healthCheck;
	let log;
	let validateHealthCheck;

	beforeEach(() => {
		defaults = sinon.spy(require('lodash/defaults'));
		mockery.registerMock('lodash/defaults', defaults);

		log = require('../mock/log.mock');

		validateHealthCheck = sinon.stub();
		mockery.registerMock('./validate-health-check', validateHealthCheck);

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

	it('has a `defaults` property', () => {
		assert.isObject(healthCheck.defaults);
	});

	describe('.checkDefaults', () => {

		it('has an `interval` property', () => {
			assert.deepEqual(healthCheck.checkDefaults.interval, 30000);
		});

	});

	describe('healthCheck(options)', () => {
		let health;
		let options;

		beforeEach(() => {
			options = {
				checks: [
					{
						output: {
							id: 'mock-check-1'
						},
						config: {
							interval: 123
						}
					},
					{
						output: {
							name: 'mock-check-2'
						}
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

		it('defaults the passed in health check options', () => {
			assert.isObject(defaults.secondCall.args[0]);
			assert.strictEqual(defaults.secondCall.args[1], options.checks[0].config);
			assert.strictEqual(defaults.secondCall.args[2], healthCheck.checkDefaults);
			assert.isObject(defaults.thirdCall.args[0]);
			assert.isUndefined(defaults.thirdCall.args[1]);
			assert.strictEqual(defaults.thirdCall.args[2], healthCheck.checkDefaults);
		});

		it('validates the passed in health check outputs', () => {
			assert.calledTwice(validateHealthCheck);
			assert.calledWithExactly(validateHealthCheck, options.checks[0].output);
			assert.calledWithExactly(validateHealthCheck, options.checks[1].output);
		});

		it('returns an object', () => {
			assert.isObject(health);
			assert.isNotNull(health);
		});

		describe('returned object', () => {

			it('has a `_checks` property set to the defaulted _checks', () => {
				assert.isDefined(health._checks);
				assert.isArray(health._checks);
				assert.deepEqual(health._checks[0], {
					config: defaults.secondCall.returnValue,
					output: options.checks[0].output
				});
				assert.deepEqual(health._checks[1], {
					config: defaults.thirdCall.returnValue,
					output: options.checks[1].output
				});
			});

			it('has an `_options` property set to the defaulted _options', () => {
				assert.isDefined(health._options);
				assert.strictEqual(health._options, defaults.firstCall.returnValue);
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
