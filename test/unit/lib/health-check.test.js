'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const sinon = require('sinon');

describe('lib/health-check', () => {
	let Check;
	let CpuCheck;
	let defaults;
	let DiskSpaceCheck;
	let HealthCheck;
	let log;
	let MemoryCheck;
	let PingUrlCheck;
	let TcpIpCheck;

	beforeEach(() => {
		Check = require('../mock/check.mock');
		mockery.registerMock('./check', Check);

		CpuCheck = require('../mock/cpu-check.mock');
		mockery.registerMock('./check/cpu', CpuCheck);

		DiskSpaceCheck = require('../mock/disk-space-check.mock');
		mockery.registerMock('./check/disk-space', DiskSpaceCheck);

		MemoryCheck = require('../mock/memory-check.mock');
		mockery.registerMock('./check/memory', MemoryCheck);

		PingUrlCheck = require('../mock/ping-url-check.mock');
		mockery.registerMock('./check/ping-url', PingUrlCheck);

		TcpIpCheck = require('../mock/tcp-ip-check.mock');
		mockery.registerMock('./check/tcp-ip', TcpIpCheck);

		defaults = sinon.spy(require('lodash/defaults'));
		mockery.registerMock('lodash/defaults', defaults);

		log = require('../mock/log.mock');

		HealthCheck = require('../../../lib/health-check');
	});

	it('exports a class constructor', () => {
		assert.isFunction(HealthCheck);
		/* eslint-disable new-cap */
		assert.throws(() => HealthCheck(), /class constructor .* without 'new'/i);
		/* eslint-enable new-cap */
	});

	describe('new HealthCheck(options)', () => {
		let instance;
		let MockType1;
		let MockType2;
		let MockType3;
		let options;

		beforeEach(() => {
			MockType1 = sinon.spy(Check);
			MockType2 = sinon.spy(Check);
			MockType3 = sinon.spy(Check);
			HealthCheck.checkTypeMap = {
				'mock-type-1': MockType1,
				'mock-type-2': MockType2,
				'mock-type-3': MockType3
			};
			options = {
				checks: [
					{
						id: 'mock-check-1',
						type: 'mock-type-1'
					},
					{
						id: 'mock-check-2',
						type: 'mock-type-2'
					},
					{
						id: 'mock-check-3',
						type: 'mock-type-3'
					}
				],
				log: log
			};
			instance = new HealthCheck(options);
		});

		it('defaults the passed in options', () => {
			assert.calledOnce(defaults);
			assert.isObject(defaults.firstCall.args[0]);
			assert.strictEqual(defaults.firstCall.args[1], options);
			assert.strictEqual(defaults.firstCall.args[2], HealthCheck.defaultOptions);
		});

		it('has an `options` property set to the defaulted options', () => {
			assert.isDefined(instance.options);
			assert.strictEqual(instance.options, defaults.firstCall.returnValue);
		});

		it('creates a Check for each configuration in `options.checks`, using the class that their `type` property maps to', () => {
			assert.calledThrice(Check);
			assert.calledWithNew(MockType1.firstCall);
			assert.calledWithExactly(MockType1.firstCall, options.checks[0]);
			assert.calledWithNew(MockType2.firstCall);
			assert.calledWithExactly(MockType2.firstCall, options.checks[1]);
			assert.calledWithNew(MockType3.firstCall);
			assert.calledWithExactly(MockType3.firstCall, options.checks[2]);
		});

		it('has a `checkObjects` property set to an array of the created checks', () => {
			assert.deepEqual(instance.checkObjects, [
				MockType1.firstCall.returnValue,
				MockType2.firstCall.returnValue,
				MockType3.firstCall.returnValue
			]);
		});

		it('has a `log` property set to the corresponding option value', () => {
			assert.strictEqual(instance.log, options.log);
		});

		it('has a `stop` method', () => {
			assert.isFunction(instance.stop);
		});

		describe('.stop()', () => {

			beforeEach(() => {
				instance.checkObjects[2].isRunning.returns(false);
				instance.stop();
			});

			it('stops each check from running', () => {
				assert.calledOnce(instance.checkObjects[0].isRunning);
				assert.calledOnce(instance.checkObjects[0].stop);
				assert.calledOnce(instance.checkObjects[1].isRunning);
				assert.calledOnce(instance.checkObjects[1].stop);
				assert.calledOnce(instance.checkObjects[2].isRunning);
				assert.notCalled(instance.checkObjects[2].stop);
			});

		});

		it('has a `checks` method', () => {
			assert.isFunction(instance.checks);
		});

		describe('.checks()', () => {
			let mockJson;
			let returnedFunction;

			beforeEach(() => {
				mockJson = [
					{
						id: 'mock-check-1'
					},
					{
						id: 'mock-check-2'
					},
					{
						id: 'mock-check-3'
					}
				];
				sinon.stub(instance, 'toJSON').returns(mockJson);
				returnedFunction = instance.checks();
			});

			it('returns a function', () => {
				assert.isFunction(returnedFunction);
			});

			describe('.returnedFunction()', () => {
				let returnedPromise;

				beforeEach(() => {
					returnedPromise = returnedFunction();
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

					it('resolves with the health check as JSON', () => {
						assert.strictEqual(resolvedValue, mockJson);
					});

				});

			});

		});

		it('has a `gtg` method', () => {
			assert.isFunction(instance.gtg);
		});

		describe('.gtg()', () => {
			let mockJson;
			let returnedFunction;

			beforeEach(() => {
				mockJson = [
					{
						id: 'mock-check-1',
						severity: 1,
						ok: true
					},
					{
						id: 'mock-check-2',
						severity: 2,
						ok: true
					},
					{
						id: 'mock-check-3',
						severity: 3,
						ok: true
					}
				];
				sinon.stub(instance, 'toJSON').returns(mockJson);
				returnedFunction = instance.gtg();
			});

			it('returns a function', () => {
				assert.isFunction(returnedFunction);
			});

			describe('.returnedFunction()', () => {
				let returnedPromise;

				beforeEach(() => {
					returnedPromise = returnedFunction();
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

					it('resolves with `true`', () => {
						assert.isTrue(resolvedValue);
					});

				});

				describe('when a check is failing but it has a medium or low severity', () => {

					beforeEach(() => {
						mockJson[1].ok = false;
						mockJson[2].ok = false;
						returnedPromise = returnedFunction();
					});

					describe('.then()', () => {
						let resolvedValue;

						beforeEach(() => {
							return returnedPromise.then(value => {
								resolvedValue = value;
							});
						});

						it('resolves with `true`', () => {
							assert.isTrue(resolvedValue);
						});

					});

				});

				describe('when a check is failing and it has a high severity', () => {

					beforeEach(() => {
						mockJson[0].ok = false;
						returnedPromise = returnedFunction();
					});

					describe('.then()', () => {
						let resolvedValue;

						beforeEach(() => {
							return returnedPromise.then(value => {
								resolvedValue = value;
							});
						});

						it('resolves with `false`', () => {
							assert.isFalse(resolvedValue);
						});

					});

				});

			});

		});

		it('has a `toJSON` method', () => {
			assert.isFunction(instance.toJSON);
		});

		describe('.toJSON()', () => {
			let returnValue;

			beforeEach(() => {
				instance.checkObjects[0].toJSON.returns('json-1');
				instance.checkObjects[1].toJSON.returns('json-2');
				instance.checkObjects[2].toJSON.returns('json-3');
				returnValue = instance.toJSON();
			});

			it('returns an array of each check JSONified', () => {
				assert.isArray(returnValue);
				assert.deepEqual(returnValue, [
					'json-1',
					'json-2',
					'json-3'
				]);
			});

		});

		it('has an `inspect` method', () => {
			assert.isFunction(instance.inspect);
		});

		describe('.inspect()', () => {
			let returnValue;

			beforeEach(() => {
				instance.checkObjects[0].inspect.returns('inspect-1');
				instance.checkObjects[1].inspect.returns('inspect-2');
				instance.checkObjects[2].inspect.returns('inspect-3');
				returnValue = instance.inspect();
			});

			it('returns a string with a human-readable check set', () => {
				assert.strictEqual(returnValue, [
					'HealthCheck {',
					'  inspect-1',
					'  inspect-2',
					'  inspect-3',
					'}'
				].join('\n'));
			});

		});

		describe('when a check is an instance of HealthCheck.Check', () => {
			let checkInstance;

			beforeEach(() => {
				checkInstance = sinon.createStubInstance(Check);
				options.checks = [checkInstance];
				Check.reset();
				instance = new HealthCheck(options);
			});

			it('does not create a Check for the configuration', () => {
				assert.notCalled(Check);
			});

			it('adds a log property to the check', () => {
				assert.strictEqual(checkInstance.log, log);
			});

			it('has a `checkObjects` property set to an array of the created checks', () => {
				assert.deepEqual(instance.checkObjects, [
					checkInstance
				]);
			});

		});

		describe('when a class does not exist for a given check type', () => {

			beforeEach(() => {
				options.checks.push({
					id: 'mock-check-4',
					type: 'mock-type-4'
				});
			});

			it('throws an error', () => {
				assert.throws(() => new HealthCheck(options), 'Invalid check type: mock-type-4');
			});

		});

	});

	it('has a `defaultOptions` static property', () => {
		assert.isObject(HealthCheck.defaultOptions);
	});

	describe('.defaultOptions', () => {

		it('has a `checks` property', () => {
			assert.deepEqual(HealthCheck.defaultOptions.checks, []);
		});

		it('has a `log` property', () => {
			assert.strictEqual(HealthCheck.defaultOptions.log, console);
		});

	});

	it('has a `checkTypeMap` static property', () => {
		assert.instanceOf(HealthCheck.checkTypeMap, Object);
		assert.strictEqual(HealthCheck.checkTypeMap['cpu'], CpuCheck);
		assert.strictEqual(HealthCheck.checkTypeMap['disk-space'], DiskSpaceCheck);
		assert.strictEqual(HealthCheck.checkTypeMap['memory'], MemoryCheck);
		assert.strictEqual(HealthCheck.checkTypeMap['ping-url'], PingUrlCheck);
		assert.strictEqual(HealthCheck.checkTypeMap['tcp-ip'], TcpIpCheck);
	});

	it('has a `Check` static property', () => {
		assert.strictEqual(HealthCheck.Check, Check);
	});

});
