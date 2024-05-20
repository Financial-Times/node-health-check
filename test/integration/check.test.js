'use strict';

const process = require('process');

process.env.FT_GRAPHITE_KEY = 'test';

const assert = require('proclaim');
const Check = require('../../lib/check');
const CpuCheck = require('../../lib/check/cpu');
const DiskSpaceCheck = require('../../lib/check/disk-space');
const MemoryCheck = require('../../lib/check/memory');
const PingUrlCheck = require('../../lib/check/ping-url');
const TcpIpCheck = require('../../lib/check/tcp-ip');

describe('health-check', function () {
	this.timeout(10000);
	const HealthCheck = require('../../lib/health-check');
    // Create a custom health check class to demonstrate
    // how you can make reusable health checks
    class CustomCheck extends HealthCheck.Check {
        constructor(options) {
            super(options);
        }

        // Must return a promise that does not reject
        run() {
            return Promise.resolve().then(() => {
                // Setting the `ok` property is how you indicate
                // that the health check is passing or failing
                this.ok = true;
                this.checkOutput = '';
                // You must always set the `lastUpdated` property
                // to a new date
                this.lastUpdated = new Date();
            });
        }
    }

	it('exports a class constructor', () => {
		assert.isFunction(HealthCheck);
		/* eslint-disable new-cap */
		// @ts-ignore
		assert.throws(() => HealthCheck(), /class constructor .* without 'new'/i);
		/* eslint-enable new-cap */
	});

	describe('new HealthCheck(options)', () => {
		let health;

		beforeEach(() => {

			// Create a health check object
			health = new HealthCheck({
				checks: [
					new CustomCheck({
						interval: 1000,
						id: 'custom',
						name: 'custom check',
						severity: 1,
						businessImpact: 'Things may not work',
						technicalSummary: 'Something went wrong!',
						panicGuide: 'Don\'t panic',
					}),

					// This check pings the FT.com home page every
					// 30 seconds. It will fail if it receives a
					// non-200 response
					{
						// These properties are used to configure
						// the URL ping
						type: 'ping-url',
						url: 'https://www.ft.com/',
						interval: 30000,

						// These properties are output in the health
						// check JSON
						id: 'ft-home',
						name: 'FT.com Home Page',
						severity: 1,
						businessImpact: 'Users may not see the home page',
						technicalSummary: 'Something went wrong!',
						panicGuide: 'Don\'t panic',
					},

					// This check monitors the process memory usage
					// It will fail if usage is above the threshold
					{
						// These properties are used to configure
						// the memory check
						type: 'memory',
						threshold: 50,
						interval: 15000,

						// These properties are output in the health
						// check JSON
						id: 'system-memory',
						name: 'System Memory Usage',
						severity: 2,
						businessImpact: 'Things may be slow',
						technicalSummary: 'Something went wrong!',
						panicGuide: 'Don\'t panic',
					},

					// This check monitors the system CPU usage
					// It will fail if usage is above the threshold
					{
						// These properties are used to configure
						// the CPU check
						type: 'cpu',
						threshold: 50,
						interval: 5000,

						// These properties are output in the health
						// check JSON
						id: 'system-cpu',
						name: 'System CPU Usage',
						severity: 2,
						businessImpact: 'Things may be slow',
						technicalSummary: 'Something went wrong!',
						panicGuide: 'Don\'t panic',
					},

					// This check pings GitHub.com on port 80 every
					// 30 seconds. It will fail if it cannot connect
					{
						// These properties are used to configure
						// the TCP/IP check
						type: 'tcp-ip',
						host: 'github.com',
						port: 80,
						interval: 30000,

						// These properties are output in the health
						// check JSON
						id: 'github-port-80',
						name: 'GitHub TCP/IP Port 80',
						severity: 2,
						businessImpact: 'Things won\'t install',
						technicalSummary: 'Something went wrong!',
						panicGuide: 'Don\'t panic',
					},

					// This check monitors the system disk space usage
					// It will fail if usage is above the threshold
					{
						// These properties are used to configure
						// the disk space check
						type: 'disk-space',
						threshold: 80,
						interval: 15000,

						// These properties are output in the health
						// check JSON
						id: 'system-disk-space',
						name: 'System Disk Space Usage',
						severity: 2,
						businessImpact: 'New files may not be saved',
						technicalSummary: 'Something went wrong!',
						panicGuide: 'Don\'t panic',
					}
				],
			});
		});

		it('has an `options` property set', () => {
			assert.isDefined(health.options);
		});


		it('has a `checkObjects` property set to an array of the created checks', () => {
            assert.isArray(health.checkObjects);
            assert.deepStrictEqual(health.checkObjects.length, 6);
		});

        it('creates a Check for each configuration in `options.checks`, using the class that their `type` property maps to', () => {
            assert.isInstanceOf(health.checkObjects[0], CustomCheck);
        });

		it('has a `stop` method', () => {
			assert.isFunction(health.stop);
		});

		it('has a `checks` method', () => {
			assert.isFunction(health.checks);
		});

		describe('.checks()', () => {

			it('returns a function', () => {
				assert.isFunction(health.checks());
			});

			describe('.checks()()', () => {

				it('returns a promise', () => {
					assert.isInstanceOf(health.checks()(), Promise);
				});

				describe('.then()', () => {

					it('resolves with the health check as an array', async () => {
                        const result = await health.checks()();
						assert.isArray(result);
					});
				});
			});
		});

		it('has a `gtg` method', () => {
			assert.isFunction(health.gtg);
		});

		describe('.gtg()', () => {

			it('returns a function', () => {
				assert.isFunction(health.gtg());
			});

			describe('.gtg()()', () => {

				it('returns a promise', () => {
					assert.isInstanceOf(health.gtg()(), Promise);
				});

				describe('.then()', () => {
					it('resolves with `true`', async () => {
                        const result = await health.gtg()();
						assert.isTrue(result);
					});
				});
			});
		});

		it('has a `toJSON` method', () => {
			assert.isFunction(health.toJSON);
		});

		describe('.toJSON()', () => {
			it('returns an array of each check JSONified', () => {
				assert.isArray(health.toJSON());
                for (const check of health.toJSON()) {
                    assert.isDefined(check, 'businessImpact');
                    assert.isDefined(check, 'checkOutput');
                    assert.isDefined(check, 'id');
                    assert.isDefined(check, 'lastUpdated');
                    assert.isDefined(check, 'name');
                    assert.isDefined(check, 'ok');
                    assert.isDefined(check, 'panicGuide');
                    assert.isDefined(check, 'severity');
                    assert.isDefined(check, 'technicalSummary');
                }
			});
		});

		it('has an `inspect` method', () => {
			assert.isFunction(health.inspect);
		});

		describe('when a class does not exist for a given check type', () => {

			it('throws an error', () => {
				assert.throws(
					() => new HealthCheck({
                        checks: [
                            {
                                id: 'mock-check-4',
                                type: 'mock-type-4',
                            }
                        ]
                    }),
					'Invalid check type: mock-type-4'
				);
			});
		});

        describe('.stop()', () => {
			beforeEach(() => {
				health.stop();
			});

			it('stops each check from running', () => {
                for (const check of health.checkObjects) {
                    assert.isFalse(check.isRunning());
                }
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
		assert.isInstanceOf(HealthCheck.checkTypeMap, Object);
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
