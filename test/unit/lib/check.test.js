'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const sinon = require('sinon');

describe('lib/check', () => {
	let Check;
	let defaults;
	let log;

	beforeEach(() => {
		defaults = sinon.spy(require('lodash/defaults'));
		mockery.registerMock('lodash/defaults', defaults);

		log = require('../mock/log.mock');

		Check = require('../../../lib/check');
	});

	it('exports a class constructor', () => {
		assert.isFunction(Check);
		/* eslint-disable new-cap */
		assert.throws(() => Check(), /class constructor .* without 'new'/i);
		/* eslint-enable new-cap */
	});

	describe('new Check(options)', () => {
		let instance;
		let mockDate;
		let mockIsoString;
		let options;
		let startMock;

		beforeEach(() => {
			options = {
				businessImpact: 'mock business impact',
				id: 'mock-id',
				interval: 123,
				log: log,
				name: 'mock name',
				panicGuide: 'mock panic guide',
				severity: 2,
				technicalSummary: 'mock technical summary'
			};
			sinon.stub(Check, 'assertOptionValidity');
			mockIsoString = 'mock-iso-string';
			mockDate = {
				mock: true,
				toISOString: sinon.stub().returns(mockIsoString)
			};
			sinon.stub(global, 'Date').returns(mockDate);
			startMock = sinon.stub(Check.prototype, 'start');
			instance = new Check(options);
			startMock.restore();
		});

		afterEach(() => {
			Date.restore();
		});

		it('defaults the passed in options', () => {
			assert.calledOnce(defaults);
			assert.isObject(defaults.firstCall.args[0]);
			assert.strictEqual(defaults.firstCall.args[1], options);
			assert.strictEqual(defaults.firstCall.args[2], Check.defaultOptions);
		});

		it('asserts that the defaulted options are valid', () => {
			assert.calledOnce(Check.assertOptionValidity);
			assert.calledWithExactly(Check.assertOptionValidity, defaults.firstCall.returnValue);
		});

		it('has an `options` property set to the defaulted options', () => {
			assert.isDefined(instance.options);
			assert.strictEqual(instance.options, defaults.firstCall.returnValue);
		});

		it('has a `businessImpact` property set to the corresponding option value', () => {
			assert.strictEqual(instance.businessImpact, options.businessImpact);
		});

		it('has a `checkOutput` property set to an empty string', () => {
			assert.strictEqual(instance.checkOutput, '');
		});

		it('has an `id` property set to the corresponding option value', () => {
			assert.strictEqual(instance.id, options.id);
		});

		it('has a `lastUpdated` property set to the current date and time', () => {
			assert.strictEqual(instance.lastUpdated, mockDate);
		});

		it('has a `name` property set to the corresponding option value', () => {
			assert.strictEqual(instance.name, options.name);
		});

		it('has an `ok` property set to `true`', () => {
			assert.isTrue(instance.ok);
		});

		it('has a `panicGuide` property set to the corresponding option value', () => {
			assert.strictEqual(instance.panicGuide, options.panicGuide);
		});

		it('has a `severity` property set to the corresponding option value', () => {
			assert.strictEqual(instance.severity, options.severity);
		});

		it('has a `technicalSummary` property set to the corresponding option value', () => {
			assert.strictEqual(instance.technicalSummary, options.technicalSummary);
		});

		it('has a `log` property set to the corresponding option value', () => {
			assert.strictEqual(instance.log, options.log);
		});

		it('calls the `start` method', () => {
			assert.calledOnce(startMock);
		});

		it('has a `start` method', () => {
			assert.isFunction(instance.start);
		});

		describe('.start()', () => {
			let intervalId;
			let boundRun;

			beforeEach(() => {
				intervalId = {};
				intervalId.unref = sinon.spy();
				sinon.stub(global, 'setInterval').returns(intervalId);
				sinon.stub(instance, 'isRunning').returns(false);
				boundRun = sinon.spy();
				sinon.stub(Check.prototype, 'run');
				sinon.stub(instance.run, 'bind').returns(boundRun);
				instance.start();
			});

			afterEach(() => {
				setInterval.restore();
			});

			it('calls the `run` method', () => {
				assert.calledOnce(instance.run);
			});
			
			it('calls the `unref` method on the interval', () => {
				assert.calledOnce(intervalId.unref);
			});

			it('Sets an interval with `options.interval` and a bound version of the `run` method', () => {
				assert.calledOnce(instance.run.bind);
				assert.calledWithExactly(instance.run.bind, instance);
				assert.calledOnce(setInterval);
				assert.calledWithExactly(setInterval, boundRun, options.interval);
			});

			it('sets the `_interval` property to the created interval ID', () => {
				assert.strictEqual(instance._interval, intervalId);
			});

			describe('when the check has already been started', () => {

				beforeEach(() => {
					instance.isRunning.returns(true);
				});

				it('throws an error', () => {
					assert.throws(() => instance.start(), 'The check has already been started');
				});

			});

		});

		it('has a `stop` method', () => {
			assert.isFunction(instance.stop);
		});

		describe('.stop()', () => {
			let intervalId;

			beforeEach(() => {
				sinon.stub(instance, 'isRunning').returns(true);
				instance._interval = intervalId = {};
				sinon.stub(global, 'clearInterval');
				instance.stop();
			});

			afterEach(() => {
				clearInterval.restore();
			});

			it('Clears the interval created by `start`', () => {
				assert.calledOnce(clearInterval);
				assert.calledWithExactly(clearInterval, intervalId);
			});

			it('sets the `_interval` property to undefined', () => {
				assert.isUndefined(instance._interval);
			});

			describe('when the check has not been started', () => {

				beforeEach(() => {
					instance.isRunning.returns(false);
				});

				it('throws an error', () => {
					assert.throws(() => instance.stop(), 'The check has not been started');
				});

			});

		});

		it('has an `isRunning` method', () => {
			assert.isFunction(instance.isRunning);
		});

		describe('.isRunning()', () => {

			describe('when the `_interval` property is set', () => {

				it('returns `true`', () => {
					instance._interval = 'mock-interval';
					assert.isTrue(instance.isRunning());
				});

			});

			describe('when the `_interval` property is not set', () => {

				it('returns `false`', () => {
					delete instance._interval;
					assert.isFalse(instance.isRunning());
				});

			});

		});

		it('has an `run` method', () => {
			assert.isFunction(instance.run);
		});

		describe('.run()', () => {

			it('throws an error', () => {
				assert.throws(() => instance.run(), 'The Check class must be extended rather than used directly');
			});

		});

		it('has a `toJSON` method', () => {
			assert.isFunction(instance.toJSON);
		});

		describe('.toJSON()', () => {
			let returnValue;

			beforeEach(() => {
				returnValue = instance.toJSON();
			});

			it('returns an object with the check output properties', () => {
				assert.isObject(returnValue);
				assert.deepEqual(returnValue, {
					id: instance.id,
					name: instance.name,
					ok: instance.ok,
					severity: instance.severity,
					businessImpact: instance.businessImpact,
					technicalSummary: instance.technicalSummary,
					panicGuide: instance.panicGuide,
					checkOutput: instance.checkOutput,
					lastUpdated: mockIsoString
				});
			});

		});

		it('has an `inspect` method', () => {
			assert.isFunction(instance.inspect);
		});

		describe('.inspect()', () => {
			let returnValue;

			beforeEach(() => {
				returnValue = instance.inspect();
			});

			it('returns a string with the check name and status', () => {
				assert.strictEqual(returnValue, `Check [OK] mock name (updated ${mockIsoString})`);
			});

			describe('when the `ok` property is `false`', () => {

				beforeEach(() => {
					instance.ok = false;
					returnValue = instance.inspect();
				});

				it('returns a string with the correct status', () => {
					assert.strictEqual(returnValue, `Check [NOT OK] mock name (updated ${mockIsoString})`);
				});

			});

		});

	});

	it('has a `defaultOptions` static property', () => {
		assert.isObject(Check.defaultOptions);
	});

	describe('.defaultOptions', () => {

		it('has an `interval` property', () => {
			assert.strictEqual(Check.defaultOptions.interval, 30000);
		});

		it('has a `severity` property', () => {
			assert.strictEqual(Check.defaultOptions.severity, 1);
		});

		it('has a `log` property', () => {
			assert.strictEqual(Check.defaultOptions.log, console);
		});

	});

	it('has a `requiredOptions` static property', () => {
		assert.instanceOf(Check.requiredOptions, Set);
		assert.deepEqual(Array.from(Check.requiredOptions), [
			'businessImpact',
			'id',
			'interval',
			'name',
			'panicGuide',
			'severity',
			'technicalSummary'
		]);
	});

	it('has a `validateOptions` static method', () => {
		assert.isFunction(Check.validateOptions);
	});

	describe('.validateOptions(options)', () => {
		let options;
		let returnValue;

		beforeEach(() => {
			options = {
				businessImpact: 'mock business impact',
				id: 'mock-id',
				interval: 123,
				name: 'mock name',
				panicGuide: 'mock panic guide',
				severity: 2,
				technicalSummary: 'mock technical summary'
			};
			returnValue = Check.validateOptions(options);
		});

		it('returns `true`', () => {
			assert.isTrue(returnValue);
		});

		describe('when `options` is not an object', () => {

			it('returns a descriptive error', () => {
				const expectedErrorMessage = 'Options must be an object';
				returnValue = Check.validateOptions('');
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage);
				returnValue = Check.validateOptions([]);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage);
				returnValue = Check.validateOptions(null);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage);
			});

		});

		describe('when `options` is missing a required property', () => {

			beforeEach(() => {
				Check.requiredOptions = new Set([
					'mock'
				]);
			});

			it('returns a descriptive error', () => {
				returnValue = Check.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, 'Missing required option: mock');
			});

		});

		describe('when `options` has an invalid `businessImpact` property', () => {

			it('returns a descriptive error', () => {
				const expectedErrorMessage = 'Invalid option: businessImpact must be a non-empty string';
				options.businessImpact = '';
				returnValue = Check.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'empty string');
				options.businessImpact = 123;
				returnValue = Check.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'non-string');
			});

		});

		describe('when `options` has an invalid `id` property', () => {

			it('returns a descriptive error', () => {
				const expectedErrorMessage = 'Invalid option: id must be lowercase and alphanumeric with hyphens';
				options.id = '';
				returnValue = Check.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'empty string');
				options.id = 'has spaces';
				returnValue = Check.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'spaces');
				options.id = 123;
				returnValue = Check.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'non-string');
			});

		});

		describe('when `options` has an invalid `name` property', () => {

			it('returns a descriptive error', () => {
				const expectedErrorMessage = 'Invalid option: name must be a non-empty string';
				options.name = '';
				returnValue = Check.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'empty string');
				options.name = 123;
				returnValue = Check.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'non-string');
			});

		});

		describe('when `options` has an invalid `panicGuide` property', () => {

			it('returns a descriptive error', () => {
				const expectedErrorMessage = 'Invalid option: panicGuide must be a non-empty string';
				options.panicGuide = '';
				returnValue = Check.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'empty string');
				options.panicGuide = 123;
				returnValue = Check.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'non-string');
			});

		});

		describe('when `options` has an invalid `severity` property', () => {

			it('returns a descriptive error', () => {
				const expectedErrorMessage = 'Invalid option: severity must be 1, 2, or 3';
				options.severity = 4;
				returnValue = Check.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'too high');
				options.severity = 0;
				returnValue = Check.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'too low');
				options.severity = '';
				returnValue = Check.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'non-number');
			});

		});

		describe('when `options` has an invalid `technicalSummary` property', () => {

			it('returns a descriptive error', () => {
				const expectedErrorMessage = 'Invalid option: technicalSummary must be a non-empty string';
				options.technicalSummary = '';
				returnValue = Check.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'empty string');
				options.technicalSummary = 123;
				returnValue = Check.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'non-string');
			});

		});

	});

	it('has an `assertOptionValidity` static method', () => {
		assert.isFunction(Check.assertOptionValidity);
	});

	describe('.assertOptionValidity(options)', () => {
		let options;

		beforeEach(() => {
			options = {
				mock: true
			};
			sinon.stub(Check, 'validateOptions').returns(true);
		});

		it('validates the options', () => {
			Check.assertOptionValidity(options);
			assert.calledOnce(Check.validateOptions);
			assert.calledWithExactly(Check.validateOptions, options);
		});

		it('does not throw', () => {
			assert.doesNotThrow(() => Check.assertOptionValidity(options));
		});

		describe('when the options are invalid', () => {
			let mockError;

			beforeEach(() => {
				mockError = new Error('mock error');
				Check.validateOptions.returns(mockError);
			});

			it('throws a validation error', () => {
				let caughtError;
				try {
					Check.assertOptionValidity(options);
				} catch (error) {
					caughtError = error;
				}
				assert.strictEqual(caughtError, mockError);
			});

		});

	});

});
