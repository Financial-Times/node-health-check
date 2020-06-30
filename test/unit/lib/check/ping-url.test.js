'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const sinon = require('sinon');

describe('lib/check/ping-url', () => {
	let Check;
	let log;
	let PingUrlCheck;
	let axios;

	beforeEach(() => {
		Check = require('../../../../lib/check');

		log = require('../../mock/log.mock');

		axios = require('../../mock/axios.mock');
		mockery.registerMock('axios', axios);

		PingUrlCheck = require('../../../../lib/check/ping-url');
	});

	it('exports a class constructor', () => {
		assert.isFunction(PingUrlCheck);
		/* eslint-disable new-cap */
		assert.throws(() => PingUrlCheck(), /class constructor .* without 'new'/i);
		/* eslint-enable new-cap */
	});

	describe('new PingUrlCheck(options)', () => {
		let instance;
		let options;
		let startMock;

		beforeEach(() => {
			options = {
				businessImpact: 'mock business impact',
				id: 'mock-id',
				log: log,
				method: 'MOCK',
				name: 'mock name',
				panicGuide: 'mock panic guide',
				technicalSummary: 'mock technical summary',
				url: 'mock-url'
			};
			sinon.stub(PingUrlCheck, 'assertOptionValidity');
			startMock = sinon.stub(PingUrlCheck.prototype, 'start');
			instance = new PingUrlCheck(options);
			startMock.restore();
		});

		it('extends Check', () => {
			assert.instanceOf(instance, Check);
		});

		it('asserts that the defaulted options are valid', () => {
			assert.calledOnce(PingUrlCheck.assertOptionValidity);
			assert.calledWithExactly(PingUrlCheck.assertOptionValidity, options);
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

			it('calls `axios` with the expected options', () => {
				assert.calledOnce(axios);
				assert.calledWith(axios, {
					url: 'mock-url',
					headers: {},
					method: 'MOCK',
					timeout: instance.options.interval
				});
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

				it('sets the `checkOutput` property to an empty string', () => {
					assert.strictEqual(instance.checkOutput, '');
				});

				it('updates the `lastUpdated` property', () => {
					assert.strictEqual(instance.lastUpdated, mockDate);
				});

			});

			describe('when `options.url` is a function', () => {

				beforeEach(() => {
					instance.ok = false;
					instance.checkOutput = 'mock output';
					axios.reset();
					instance.options.url = () => 'mock-url-from-function';
					returnedPromise = instance.run();
				});

				it('calls `axios` with the expected options', () => {
					assert.calledOnce(axios);
					assert.calledWith(axios, {
						url: 'mock-url-from-function',
						headers: {},
						method: 'MOCK',
						timeout: instance.options.interval
					});
				});

			});

			describe('when `options.headers` is an object', () => {

				beforeEach(() => {
					instance.ok = false;
					instance.checkOutput = 'mock output';
					axios.reset();
					instance.options.headers = { key : 'mock' };
					returnedPromise = instance.run();
				});

				it('calls `axios` with the expected options', () => {
					assert.calledOnce(axios);
					assert.calledWith(axios, {
						url: 'mock-url',
						headers: { key : 'mock' },
						method: 'MOCK',
						timeout: instance.options.interval
					});
				});

			});
			describe('when the request fails', () => {
				let requestError;

				beforeEach(() => {
					instance.ok = true;
					instance.checkOutput = '';
					requestError = new Error('request error');
					axios.reset();
					axios.rejects(requestError);
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
						assert.strictEqual(instance.checkOutput, 'request error');
					});

					it('updates the `lastUpdated` property', () => {
						assert.strictEqual(instance.lastUpdated, mockDate);
					});

					it('logs that the request failed', () => {
						assert.calledWithExactly(log.error, 'Health check "mock name" failed: request error');
					});

				});

			});

			describe('when no `method` option was specified', () => {

				beforeEach(() => {
					axios.reset();
					delete instance.options.method;
					returnedPromise = instance.run();
				});

				it('defaults to "HEAD"', () => {
					assert.calledOnce(axios);
					assert.calledWith(axios, {
						url: 'mock-url',
						headers: {},
						method: 'HEAD',
						timeout: instance.options.interval
					});
				});

			});

		});

		describe('.inspect()', () => {

			it('returns a string with the check name and status', () => {
				assert.match(instance.inspect(), /^PingUrlCheck /);
			});

		});

	});

	it('has a `validateOptions` static method', () => {
		assert.isFunction(PingUrlCheck.validateOptions);
	});

	describe('.validateOptions(options)', () => {
		let options;
		let returnValue;

		beforeEach(() => {
			options = {
				method: 'MOCK',
				url: 'mock-url'
			};
			returnValue = PingUrlCheck.validateOptions(options);
		});

		it('returns `true`', () => {
			assert.isTrue(returnValue);
		});

		describe('when `options` is not an object', () => {

			it('returns a descriptive error', () => {
				const expectedErrorMessage = 'Options must be an object';
				returnValue = PingUrlCheck.validateOptions('');
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage);
				returnValue = PingUrlCheck.validateOptions([]);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage);
				returnValue = PingUrlCheck.validateOptions(null);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage);
			});

		});

		describe('when `options` has an invalid `url` property', () => {

			it('returns a descriptive error', () => {
				const expectedErrorMessage = 'Invalid option: url must be a non-empty string or a function';
				options.url = '';
				returnValue = PingUrlCheck.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'empty string');
				options.url = 123;
				returnValue = PingUrlCheck.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'non-string');
			});

		});

		describe('when `options.url` is a function', () => {

			beforeEach(() => {
				options.url = () => 'mock-url';
				returnValue = PingUrlCheck.validateOptions(options);
			});

			it('returns `true`', () => {
				assert.isTrue(returnValue);
			});

		});
		
		describe('when `options` has an invalid `headers` property', () => {

			it('returns a descriptive error', () => {
				const expectedErrorMessage = 'Invalid option: headers must be an object';
				options.headers = '';
				returnValue = PingUrlCheck.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'empty string');
				options.headers = 123;
				returnValue = PingUrlCheck.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'non-string');
			});

		});

	});

	it('has an `assertOptionValidity` static method', () => {
		assert.isFunction(PingUrlCheck.assertOptionValidity);
	});

	describe('.assertOptionValidity(options)', () => {
		let options;

		beforeEach(() => {
			options = {
				mock: true
			};
			sinon.stub(PingUrlCheck, 'validateOptions').returns(true);
		});

		it('validates the options', () => {
			PingUrlCheck.assertOptionValidity(options);
			assert.calledOnce(PingUrlCheck.validateOptions);
			assert.calledWithExactly(PingUrlCheck.validateOptions, options);
		});

		it('does not throw', () => {
			assert.doesNotThrow(() => PingUrlCheck.assertOptionValidity(options));
		});

		describe('when the options are invalid', () => {
			let mockError;

			beforeEach(() => {
				mockError = new Error('mock error');
				PingUrlCheck.validateOptions.returns(mockError);
			});

			it('throws a validation error', () => {
				let caughtError;
				try {
					PingUrlCheck.assertOptionValidity(options);
				} catch (error) {
					caughtError = error;
				}
				assert.strictEqual(caughtError, mockError);
			});

		});

	});

});
