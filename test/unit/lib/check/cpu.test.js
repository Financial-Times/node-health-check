'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const sinon = require('sinon');

describe('lib/check/cpu', () => {
	let Check;
	let log;
	let CpuCheck;
	let pidusage;

	beforeEach(() => {
		Check = require('../../../../lib/check');

		log = require('../../mock/log.mock');

		pidusage = require('../../mock/pidusage.mock');
		mockery.registerMock('pidusage', pidusage);

		CpuCheck = require('../../../../lib/check/cpu');
	});

	it('exports a class constructor', () => {
		assert.isFunction(CpuCheck);
		/* eslint-disable new-cap */
		assert.throws(() => CpuCheck(), /class constructor .* without 'new'/i);
		/* eslint-enable new-cap */
	});

	describe('new CpuCheck(options)', () => {
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
				threshold: 30
			};
			sinon.stub(CpuCheck, 'assertOptionValidity');
			startMock = sinon.stub(CpuCheck.prototype, 'start');
			instance = new CpuCheck(options);
			startMock.restore();
		});

		it('extends Check', () => {
			assert.instanceOf(instance, Check);
		});

		it('asserts that the defaulted options are valid', () => {
			assert.calledOnce(CpuCheck.assertOptionValidity);
			assert.calledWithExactly(CpuCheck.assertOptionValidity, options);
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

				it('sets the `checkOutput` property to the percentage CPU usage', () => {
					assert.strictEqual(instance.checkOutput, `${pidusage.mockPidusage.cpu}% used`);
				});

				it('updates the `lastUpdated` property', () => {
					assert.strictEqual(instance.lastUpdated, mockDate);
				});

			});

			describe('when the usage is above `threshold` percent', () => {

				beforeEach(() => {
					pidusage.mockPidusage.cpu = 75;
					instance.ok = true;
					instance.checkOutput = '';
					instance.hasRun = true;
					pidusage.reset();
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

					it('sets the `checkOutput` property to the percentage CPU usage', () => {
						assert.strictEqual(instance.checkOutput, `${pidusage.mockPidusage.cpu}% used`);
					});

					it('updates the `lastUpdated` property', () => {
						assert.strictEqual(instance.lastUpdated, mockDate);
					});

					it('logs that the usage failed', () => {
						assert.calledWithExactly(log.error, `Health check "mock name" failed: ${pidusage.mockPidusage.cpu}% used`);
					});

				});

			});

			describe('when the usage is above `threshold` percent but this is the first run', () => {

				beforeEach(() => {
					pidusage.mockPidusage.cpu = 75;
					instance.ok = false;
					instance.checkOutput = 'mock output';
					delete instance.hasRun;
					pidusage.reset();
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

					it('sets the `ok` property to `true`', () => {
						assert.isTrue(instance.ok);
					});

					it('sets the `checkOutput` property to the percentage CPU usage', () => {
						assert.strictEqual(instance.checkOutput, `${pidusage.mockPidusage.cpu}% used`);
					});

					it('updates the `lastUpdated` property', () => {
						assert.strictEqual(instance.lastUpdated, mockDate);
					});

					it('sets the `hasRun` property to `true`', () => {
						assert.isTrue(instance.hasRun);
					});

				});

			});

			describe('when the usage check errors', () => {
				let pidusageError;

				beforeEach(() => {
					instance.ok = true;
					instance.checkOutput = '';
					pidusageError = new Error('pidusage error');
					pidusage.reset();
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
				assert.match(instance.inspect(), /^CpuCheck /);
			});

		});

		describe('when `options.threshold` is not defined', () => {

			beforeEach(() => {
				startMock = sinon.stub(CpuCheck.prototype, 'start');
				delete options.threshold;
				instance = new CpuCheck(options);
				startMock.restore();
			});

			it('defaults to 50', () => {
				assert.strictEqual(instance.options.threshold, 50);
			});

		});

	});

	it('has a `validateOptions` static method', () => {
		assert.isFunction(CpuCheck.validateOptions);
	});

	describe('.validateOptions(options)', () => {
		let options;
		let returnValue;

		beforeEach(() => {
			options = {
				threshold: 50
			};
			returnValue = CpuCheck.validateOptions(options);
		});

		it('returns `true`', () => {
			assert.isTrue(returnValue);
		});

		describe('when `options` is not an object', () => {

			it('returns a descriptive error', () => {
				const expectedErrorMessage = 'Options must be an object';
				returnValue = CpuCheck.validateOptions('');
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage);
				returnValue = CpuCheck.validateOptions([]);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage);
				returnValue = CpuCheck.validateOptions(null);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage);
			});

		});

		describe('when `options` has an invalid `threshold` property', () => {

			it('returns a descriptive error', () => {
				const expectedErrorMessage = 'Invalid option: threshold must be a number between 1 and 200';
				options.threshold = 234;
				returnValue = CpuCheck.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'too high');
				options.threshold = 0;
				returnValue = CpuCheck.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'too low');
				options.threshold = '';
				returnValue = CpuCheck.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'non-number');
			});

		});

	});

	it('has an `assertOptionValidity` static method', () => {
		assert.isFunction(CpuCheck.assertOptionValidity);
	});

	describe('.assertOptionValidity(options)', () => {
		let options;

		beforeEach(() => {
			options = {
				mock: true
			};
			sinon.stub(CpuCheck, 'validateOptions').returns(true);
		});

		it('validates the options', () => {
			CpuCheck.assertOptionValidity(options);
			assert.calledOnce(CpuCheck.validateOptions);
			assert.calledWithExactly(CpuCheck.validateOptions, options);
		});

		it('does not throw', () => {
			assert.doesNotThrow(() => CpuCheck.assertOptionValidity(options));
		});

		describe('when the options are invalid', () => {
			let mockError;

			beforeEach(() => {
				mockError = new Error('mock error');
				CpuCheck.validateOptions.returns(mockError);
			});

			it('throws a validation error', () => {
				let caughtError;
				try {
					CpuCheck.assertOptionValidity(options);
				} catch (error) {
					caughtError = error;
				}
				assert.strictEqual(caughtError, mockError);
			});

		});

	});

});
