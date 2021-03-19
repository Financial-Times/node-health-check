'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const sinon = require('sinon');

describe('lib/check/disk-space', () => {
	let Check;
	let disk;
	let DiskSpaceCheck;
	let log;

	beforeEach(() => {
		Check = require('../../../../lib/check');

		log = require('../../mock/log.mock');

		disk = require('../../mock/disk-space.mock');
		mockery.registerMock('@financial-times/disk-space', disk);

		DiskSpaceCheck = require('../../../../lib/check/disk-space');
	});

	it('exports a class constructor', () => {
		assert.isFunction(DiskSpaceCheck);
		/* eslint-disable new-cap */
		assert.throws(() => DiskSpaceCheck(), /class constructor .* without 'new'/i);
		/* eslint-enable new-cap */
	});

	describe('new DiskSpaceCheck(options)', () => {
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
			sinon.stub(DiskSpaceCheck, 'assertOptionValidity');
			startMock = sinon.stub(DiskSpaceCheck.prototype, 'start');
			instance = new DiskSpaceCheck(options);
			startMock.restore();
		});

		it('extends Check', () => {
			assert.instanceOf(instance, Check);
		});

		it('asserts that the defaulted options are valid', () => {
			assert.calledOnce(DiskSpaceCheck.assertOptionValidity);
			assert.calledWithExactly(DiskSpaceCheck.assertOptionValidity, options);
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

			it('calls `disk` with the root path', () => {
				assert.calledOnce(disk);
				assert.calledWith(disk, '/');
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

				it('sets the `checkOutput` property to the percentage disk usage', () => {
					assert.strictEqual(instance.checkOutput, '50% used');
				});

				it('updates the `lastUpdated` property', () => {
					assert.strictEqual(instance.lastUpdated, mockDate);
				});

			});

			describe('when the usage is above `threshold` percent', () => {

				beforeEach(() => {
					disk.mockUsage.usedSize = 15000;
					instance.ok = true;
					instance.checkOutput = '';
					disk.resetHistory();
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
						assert.strictEqual(instance.checkOutput, '93.75% used');
					});

					it('updates the `lastUpdated` property', () => {
						assert.strictEqual(instance.lastUpdated, mockDate);
					});

					it('logs that the usage failed', () => {
						assert.calledWithExactly(log.error, 'Health check "mock name" failed: 93.75% used');
					});

				});

			});

			describe('when the disk check errors', () => {
				let diskSpaceError;

				beforeEach(() => {
					instance.ok = true;
					instance.checkOutput = '';
					diskSpaceError = new Error('usage error');
					disk.resetHistory();
					disk.yieldsAsync(diskSpaceError);
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
						assert.strictEqual(instance.checkOutput, 'usage error');
					});

					it('updates the `lastUpdated` property', () => {
						assert.strictEqual(instance.lastUpdated, mockDate);
					});

					it('logs that the usage failed', () => {
						assert.calledWithExactly(log.error, 'Health check "mock name" failed: usage error');
					});

				});

			});

		});

		describe('.inspect()', () => {

			it('returns a string with the check name and status', () => {
				assert.match(instance.inspect(), /^DiskSpaceCheck /);
			});

		});

		describe('when `options.threshold` is not defined', () => {

			beforeEach(() => {
				startMock = sinon.stub(DiskSpaceCheck.prototype, 'start');
				delete options.threshold;
				instance = new DiskSpaceCheck(options);
				startMock.restore();
			});

			it('defaults to 75', () => {
				assert.strictEqual(instance.options.threshold, 75);
			});

		});

	});

	it('has a `validateOptions` static method', () => {
		assert.isFunction(DiskSpaceCheck.validateOptions);
	});

	describe('.validateOptions(options)', () => {
		let options;
		let returnValue;

		beforeEach(() => {
			options = {
				threshold: 50
			};
			returnValue = DiskSpaceCheck.validateOptions(options);
		});

		it('returns `true`', () => {
			assert.isTrue(returnValue);
		});

		describe('when `options` is not an object', () => {

			it('returns a descriptive error', () => {
				const expectedErrorMessage = 'Options must be an object';
				returnValue = DiskSpaceCheck.validateOptions('');
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage);
				returnValue = DiskSpaceCheck.validateOptions([]);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage);
				returnValue = DiskSpaceCheck.validateOptions(null);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage);
			});

		});

		describe('when `options` has an invalid `threshold` property', () => {

			it('returns a descriptive error', () => {
				const expectedErrorMessage = 'Invalid option: threshold must be a number between 1 and 100';
				options.threshold = 123;
				returnValue = DiskSpaceCheck.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'too high');
				options.threshold = 0;
				returnValue = DiskSpaceCheck.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'too low');
				options.threshold = '';
				returnValue = DiskSpaceCheck.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'non-number');
			});

		});

	});

	it('has an `assertOptionValidity` static method', () => {
		assert.isFunction(DiskSpaceCheck.assertOptionValidity);
	});

	describe('.assertOptionValidity(options)', () => {
		let options;

		beforeEach(() => {
			options = {
				mock: true
			};
			sinon.stub(DiskSpaceCheck, 'validateOptions').returns(true);
		});

		it('validates the options', () => {
			DiskSpaceCheck.assertOptionValidity(options);
			assert.calledOnce(DiskSpaceCheck.validateOptions);
			assert.calledWithExactly(DiskSpaceCheck.validateOptions, options);
		});

		it('does not throw', () => {
			assert.doesNotThrow(() => DiskSpaceCheck.assertOptionValidity(options));
		});

		describe('when the options are invalid', () => {
			let mockError;

			beforeEach(() => {
				mockError = new Error('mock error');
				DiskSpaceCheck.validateOptions.returns(mockError);
			});

			it('throws a validation error', () => {
				let caughtError;
				try {
					DiskSpaceCheck.assertOptionValidity(options);
				} catch (error) {
					caughtError = error;
				}
				assert.strictEqual(caughtError, mockError);
			});

		});

	});

});
