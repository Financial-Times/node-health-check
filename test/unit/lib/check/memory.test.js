'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const sinon = require('sinon');

describe('lib/check/memory', () => {
	let Check;
	let log;
	let MemoryCheck;
	let pidusage;
	let os;

	beforeEach(() => {
		Check = require('../../../../lib/check');

		log = require('../../mock/log.mock');

		pidusage = require('../../mock/pidusage.mock');
		os = require('../../mock/os.mock');
		mockery.registerMock('pidusage', pidusage);
		mockery.registerMock('os', os);

		MemoryCheck = require('../../../../lib/check/memory');
	});

	it('exports a class constructor', () => {
		assert.isFunction(MemoryCheck);
		/* eslint-disable new-cap */
		assert.throws(() => MemoryCheck(), /class constructor .* without 'new'/i);
		/* eslint-enable new-cap */
	});

	describe('new MemoryCheck(options)', () => {
		let instance;
		let options;
		let startMock;

		beforeEach(() => {
			options = {
				businessImpact: 'mock business impact',
				id: 'mock-id',
				log: log,
				name: 'mock name',
				panicGuide: 'mock panic guide',
				technicalSummary: 'mock technical summary',
				threshold: 80
			};
			sinon.stub(MemoryCheck, 'assertOptionValidity');
			startMock = sinon.stub(MemoryCheck.prototype, 'start');
			instance = new MemoryCheck(options);
			startMock.restore();
		});

		it('extends Check', () => {
			assert.instanceOf(instance, Check);
		});

		it('asserts that the defaulted options are valid', () => {
			assert.calledOnce(MemoryCheck.assertOptionValidity);
			assert.calledWithExactly(MemoryCheck.assertOptionValidity, options);
		});

		describe('.run()', () => {
			let mockDate;
			let returnedPromise;

			beforeEach(() => {
				mockDate = {
					mock: true
				};
				sinon.stub(global, 'Date').returns(mockDate);
				instance.ok = false;
				instance.checkOutput = 'mock output';
				returnedPromise = instance.run();
			});

			afterEach(() => {
				Date.restore();
			});

			it('calls `pidusage` with the process ID', () => {
				assert.calledOnce(pidusage);
				assert.calledWith(pidusage, process.pid);
			});

			it('returns a promise', () => {
				assert.instanceOf(returnedPromise, Promise);
			});

			describe('.then()', () => {
				let resolvedValue;

				beforeEach(() => {
					return returnedPromise.then(value => {
						resolvedValue = value;
					});
				});

				it('resolves with nothing', () => {
					assert.isUndefined(resolvedValue);
				});

				it('sets the `ok` property to `true`', () => {
					assert.isTrue(instance.ok);
				});

				it('sets the `checkOutput` property to the percentage memory usage', () => {
					const expectedPercentage = (pidusage.mockPidusage.memory / os.totalmem()) * 100;
					assert.strictEqual(instance.checkOutput, `${expectedPercentage}% used`);
				});

				it('updates the `lastUpdated` property', () => {
					assert.strictEqual(instance.lastUpdated, mockDate);
				});

			});

			describe('when the usage is above `threshold` percent', () => {

				beforeEach(() => {
					pidusage.mockPidusage.memory = 1900000000;
					instance.ok = true;
					instance.checkOutput = '';
					pidusage.resetHistory();
					returnedPromise = instance.run();
				});

				describe('.then()', () => {
					let resolvedValue;

					beforeEach(() => {
						return returnedPromise.then(value => {
							resolvedValue = value;
						});
					});

					it('resolves with nothing', () => {
						assert.isUndefined(resolvedValue);
					});

					it('sets the `ok` property to `false`', () => {
						assert.isFalse(instance.ok);
					});

					it('sets the `checkOutput` property to the percentage memory usage', () => {
						const expectedPercentage = (pidusage.mockPidusage.memory / os.totalmem()) * 100;
						assert.strictEqual(instance.checkOutput, `${expectedPercentage}% used`);
					});

					it('updates the `lastUpdated` property', () => {
						assert.strictEqual(instance.lastUpdated, mockDate);
					});

					it('logs that the usage failed', () => {
						const expectedPercentage = (pidusage.mockPidusage.memory / os.totalmem()) * 100;
						assert.calledWithExactly(log.error, `Health check "mock name" failed: ${expectedPercentage}% used`);
					});

				});

			});

			describe('when the usage check errors', () => {
				let pidusageError;

				beforeEach(() => {
					instance.ok = true;
					instance.checkOutput = '';
					pidusageError = new Error('pidusage error');
					pidusage.resetHistory();
					pidusage.yieldsAsync(pidusageError);
					returnedPromise = instance.run();
				});

				describe('.then()', () => {
					let resolvedValue;

					beforeEach(() => {
						return returnedPromise.then(value => {
							resolvedValue = value;
						});
					});

					it('resolves with nothing', () => {
						assert.isUndefined(resolvedValue);
					});

					it('sets the `ok` property to `false`', () => {
						assert.isFalse(instance.ok);
					});

					it('sets the `checkOutput` property to the error message', () => {
						assert.strictEqual(instance.checkOutput, 'pidusage error');
					});

					it('updates the `lastUpdated` property', () => {
						assert.strictEqual(instance.lastUpdated, mockDate);
					});

					it('logs that the usage failed', () => {
						assert.calledWithExactly(log.error, 'Health check "mock name" failed: pidusage error');
					});

				});

			});

		});

		describe('.inspect()', () => {

			it('returns a string with the check name and status', () => {
				assert.match(instance.inspect(), /^MemoryCheck /);
			});

		});

		describe('when `options.threshold` is not defined', () => {

			beforeEach(() => {
				startMock = sinon.stub(MemoryCheck.prototype, 'start');
				delete options.threshold;
				instance = new MemoryCheck(options);
				startMock.restore();
			});

			it('defaults to 75', () => {
				assert.strictEqual(instance.options.threshold, 75);
			});

		});

	});

	it('has a `validateOptions` static method', () => {
		assert.isFunction(MemoryCheck.validateOptions);
	});

	describe('.validateOptions(options)', () => {
		let options;
		let returnValue;

		beforeEach(() => {
			options = {
				threshold: 50
			};
			returnValue = MemoryCheck.validateOptions(options);
		});

		it('returns `true`', () => {
			assert.isTrue(returnValue);
		});

		describe('when `options` is not an object', () => {

			it('returns a descriptive error', () => {
				const expectedErrorMessage = 'Options must be an object';
				returnValue = MemoryCheck.validateOptions('');
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage);
				returnValue = MemoryCheck.validateOptions([]);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage);
				returnValue = MemoryCheck.validateOptions(null);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage);
			});

		});

		describe('when `options` has an invalid `threshold` property', () => {

			it('returns a descriptive error', () => {
				const expectedErrorMessage = 'Invalid option: threshold must be a number between 1 and 100';
				options.threshold = 123;
				returnValue = MemoryCheck.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'too high');
				options.threshold = 0;
				returnValue = MemoryCheck.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'too low');
				options.threshold = '';
				returnValue = MemoryCheck.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'non-number');
			});

		});

	});

	it('has an `assertOptionValidity` static method', () => {
		assert.isFunction(MemoryCheck.assertOptionValidity);
	});

	describe('.assertOptionValidity(options)', () => {
		let options;

		beforeEach(() => {
			options = {
				mock: true
			};
			sinon.stub(MemoryCheck, 'validateOptions').returns(true);
		});

		it('validates the options', () => {
			MemoryCheck.assertOptionValidity(options);
			assert.calledOnce(MemoryCheck.validateOptions);
			assert.calledWithExactly(MemoryCheck.validateOptions, options);
		});

		it('does not throw', () => {
			assert.doesNotThrow(() => MemoryCheck.assertOptionValidity(options));
		});

		describe('when the options are invalid', () => {
			let mockError;

			beforeEach(() => {
				mockError = new Error('mock error');
				MemoryCheck.validateOptions.returns(mockError);
			});

			it('throws a validation error', () => {
				let caughtError;
				try {
					MemoryCheck.assertOptionValidity(options);
				} catch (error) {
					caughtError = error;
				}
				assert.strictEqual(caughtError, mockError);
			});

		});

	});

});
