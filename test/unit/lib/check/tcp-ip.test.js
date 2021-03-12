'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const sinon = require('sinon');

describe('lib/check/tcp-ip', () => {
	let Check;
	let log;
	let net;
	let TcpIpCheck;

	beforeEach(() => {
		Check = require('../../../../lib/check');

		log = require('../../mock/log.mock');

		net = require('../../mock/net.mock');
		mockery.registerMock('net', net);

		TcpIpCheck = require('../../../../lib/check/tcp-ip');
	});

	it('exports a class constructor', () => {
		assert.isFunction(TcpIpCheck);
		/* eslint-disable new-cap */
		assert.throws(() => TcpIpCheck(), /class constructor .* without 'new'/i);
		/* eslint-enable new-cap */
	});

	describe('new TcpIpCheck(options)', () => {
		let instance;
		let options;
		let startMock;

		beforeEach(() => {
			options = {
				businessImpact: 'mock business impact',
				host: 'mock-host',
				id: 'mock-id',
				log: log,
				name: 'mock name',
				panicGuide: 'mock panic guide',
				port: 1234,
				technicalSummary: 'mock technical summary'
			};
			sinon.stub(TcpIpCheck, 'assertOptionValidity');
			startMock = sinon.stub(TcpIpCheck.prototype, 'start');
			instance = new TcpIpCheck(options);
			startMock.restore();
		});

		it('extends Check', () => {
			assert.instanceOf(instance, Check);
		});

		it('asserts that the defaulted options are valid', () => {
			assert.calledOnce(TcpIpCheck.assertOptionValidity);
			assert.calledWithExactly(TcpIpCheck.assertOptionValidity, options);
		});

		describe('.run()', () => {
			let mockDate;
			let returnedPromise;

			beforeEach(() => {
				mockDate = {
					mock: true
				};
				sinon.stub(global, 'Date').returns(mockDate);
				sinon.stub(global, 'setTimeout').returns('mock-timeout');
				sinon.stub(global, 'clearTimeout');
				instance.ok = false;
				instance.checkOutput = 'mock output';
				net.mockSocket.on.withArgs('connect').yieldsAsync();
				returnedPromise = instance.run();
			});

			afterEach(() => {
				Date.restore();
				setTimeout.restore();
				clearTimeout.restore();
			});

			it('creates a socket with the configured host and port', () => {
				assert.calledOnce(net.connect);
				assert.calledWith(net.connect, options.port, options.host);
			});

			it('sets a timeout', () => {
				assert.called(setTimeout);
				assert.strictEqual(setTimeout.firstCall.args[1], instance.options.interval);
			});

			it('binds to the socket "connect" event', () => {
				assert.called(net.mockSocket.on);
				assert.calledWith(net.mockSocket.on, 'connect');
			});

			it('binds to the socket "error" event', () => {
				assert.called(net.mockSocket.on);
				assert.calledWith(net.mockSocket.on, 'error');
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

				it('destroys the socket', () => {
					assert.calledOnce(net.mockSocket.destroy);
				});

				it('clears the timeout', () => {
					assert.called(clearTimeout);
					assert.calledWithExactly(clearTimeout, 'mock-timeout');
				});

			});

			describe('when the socket errors', () => {
				let socketError;

				beforeEach(() => {
					instance.ok = true;
					instance.checkOutput = '';
					socketError = new Error('socket error');
					net.mockSocket.destroy.resetHistory();
					net.mockSocket.on.resetBehavior();
					net.mockSocket.on.withArgs('error').yieldsAsync(socketError);
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
						assert.strictEqual(instance.checkOutput, 'socket error');
					});

					it('updates the `lastUpdated` property', () => {
						assert.strictEqual(instance.lastUpdated, mockDate);
					});

					it('logs that the request failed', () => {
						assert.calledWithExactly(log.error, 'Health check "mock name" failed: socket error');
					});

					it('destroys the socket', () => {
						assert.calledOnce(net.mockSocket.destroy);
					});

					it('clears the timeout', () => {
						assert.called(clearTimeout);
						assert.calledWithExactly(clearTimeout, 'mock-timeout');
					});

				});

			});

			describe('when the socket times out', () => {

				beforeEach(() => {
					instance.ok = true;
					instance.checkOutput = '';
					net.mockSocket.destroy.resetHistory();
					net.mockSocket.on.resetBehavior();
					setTimeout.callsArgAsync(0);
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

					it('sets the `checkOutput` property to an error message', () => {
						assert.strictEqual(instance.checkOutput, 'timed out');
					});

					it('updates the `lastUpdated` property', () => {
						assert.strictEqual(instance.lastUpdated, mockDate);
					});

					it('logs that the request failed', () => {
						assert.calledWithExactly(log.error, 'Health check "mock name" failed: timed out');
					});

					it('destroys the socket', () => {
						assert.calledOnce(net.mockSocket.destroy);
					});

				});

			});

		});

		describe('.inspect()', () => {

			it('returns a string with the check name and status', () => {
				assert.match(instance.inspect(), /^TcpIpCheck /);
			});

		});

	});

	it('has a `validateOptions` static method', () => {
		assert.isFunction(TcpIpCheck.validateOptions);
	});

	describe('.validateOptions(options)', () => {
		let options;
		let returnValue;

		beforeEach(() => {
			options = {
				host: 'mock-host',
				port: 1234
			};
			returnValue = TcpIpCheck.validateOptions(options);
		});

		it('returns `true`', () => {
			assert.isTrue(returnValue);
		});

		describe('when `options` is not an object', () => {

			it('returns a descriptive error', () => {
				const expectedErrorMessage = 'Options must be an object';
				returnValue = TcpIpCheck.validateOptions('');
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage);
				returnValue = TcpIpCheck.validateOptions([]);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage);
				returnValue = TcpIpCheck.validateOptions(null);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage);
			});

		});

		describe('when `options` has an invalid `host` property', () => {

			it('returns a descriptive error', () => {
				const expectedErrorMessage = 'Invalid option: host must be a non-empty string';
				options.host = '';
				returnValue = TcpIpCheck.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'empty string');
				options.host = 123;
				returnValue = TcpIpCheck.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'non-string');
			});

		});

		describe('when `options` has an invalid `port` property', () => {

			it('returns a descriptive error', () => {
				const expectedErrorMessage = 'Invalid option: port must be a number between 1 and 65535';
				options.port = 0;
				returnValue = TcpIpCheck.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'too low');
				options.port = 65536;
				returnValue = TcpIpCheck.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'too high');
				options.port = '123';
				returnValue = TcpIpCheck.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'non-number');
			});

		});

	});

	it('has an `assertOptionValidity` static method', () => {
		assert.isFunction(TcpIpCheck.assertOptionValidity);
	});

	describe('.assertOptionValidity(options)', () => {
		let options;

		beforeEach(() => {
			options = {
				mock: true
			};
			sinon.stub(TcpIpCheck, 'validateOptions').returns(true);
		});

		it('validates the options', () => {
			TcpIpCheck.assertOptionValidity(options);
			assert.calledOnce(TcpIpCheck.validateOptions);
			assert.calledWithExactly(TcpIpCheck.validateOptions, options);
		});

		it('does not throw', () => {
			assert.doesNotThrow(() => TcpIpCheck.assertOptionValidity(options));
		});

		describe('when the options are invalid', () => {
			let mockError;

			beforeEach(() => {
				mockError = new Error('mock error');
				TcpIpCheck.validateOptions.returns(mockError);
			});

			it('throws a validation error', () => {
				let caughtError;
				try {
					TcpIpCheck.assertOptionValidity(options);
				} catch (error) {
					caughtError = error;
				}
				assert.strictEqual(caughtError, mockError);
			});

		});

	});

});
