'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const sinon = require('sinon');

describe('lib/check/graphite-threshold', () => {
	let Check;
	let log;
	let GraphiteThresholdCheck;
	let request;

	beforeEach(() => {
		Check = require('../../../../lib/check');

		log = require('../../mock/log.mock');

		request = require('../../mock/request-promise-native.mock');
		mockery.registerMock('request-promise-native', request);

		GraphiteThresholdCheck = require('../../../../lib/check/graphite-threshold');
	});

	it('exports a class constructor', () => {
		assert.isFunction(GraphiteThresholdCheck);
		/* eslint-disable new-cap */
		assert.throws(() => GraphiteThresholdCheck(), /class constructor .* without 'new'/i);
		/* eslint-enable new-cap */
	});

	describe('new GraphiteThresholdCheck(options)', () => {
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
                url: 'mock-url',
                threshold: 300,
                direction: 'above',
                graphiteKey: 'mock key'
			};
			sinon.stub(GraphiteThresholdCheck, 'assertOptionValidity');
			startMock = sinon.stub(GraphiteThresholdCheck.prototype, 'start');
			instance = new GraphiteThresholdCheck(options);
			startMock.restore();
		});

		it('extends Check', () => {
			assert.instanceOf(instance, Check);
		});

		it('asserts that the defaulted options are valid', () => {
			assert.calledOnce(GraphiteThresholdCheck.assertOptionValidity);
			assert.calledWithExactly(GraphiteThresholdCheck.assertOptionValidity, options);
		});

		describe('.run()', () => {
            let mockDate;
            let returnedPromise;
            let mockResponse;

			beforeEach(() => {
				mockDate = {
					mock: true
				};
                sinon.stub(global, 'Date').returns(mockDate);
                mockResponse = {
                    body: JSON.stringify([
                        { 'datapoints' : 
                            [
                                [300, 1542293760]
                            ]
                        }
                    ])
				};
                request.resolves(mockResponse);
                instance.currentReading = '';
				instance.ok = false;
				instance.checkOutput = 'mock output';
				returnedPromise = instance.run();
			});

			afterEach(() => {
				Date.restore();
			});

			it('calls `request` with the expected options', () => {
				assert.calledOnce(request);
				assert.calledWith(request, {
					uri: 'mock-url',
					method: 'MOCK',
					resolveWithFullResponse: true,
                    timeout: instance.options.interval,
                    headers: { key: instance.options.graphiteKey }
				});
			});

			it('returns a promise', () => {
				assert.instanceOf(returnedPromise, Promise);
			});

			describe('.then()', () => {

                it('receives a response body', () => {
                    assert.isObject(mockResponse);
                });

                it('receives a response body containing the correct text', () => {
                    assert.deepEqual(mockResponse, {body: JSON.stringify([{'datapoints': [[300, 1542293760]]}])}, 'Response does not match set mock response');
                });
                
				it('sets the `checkOutput` property to an empty string', () => {
					assert.strictEqual(instance.checkOutput, '');
				});

				it('updates the `lastUpdated` property', () => {
					assert.strictEqual(instance.lastUpdated, mockDate);
				});

			});
            
            describe('for above - when the healthcheck passes `ok` is true', () => {

                beforeEach(() => {
					instance.ok = false;
					instance.direction = 'above';
                    instance.checkOutput = 'mock output';
                    instance.threshold = 301;
					returnedPromise = instance.run();
				});
				
				describe('.then()', () => {

					beforeEach(() => {
						return returnedPromise;
					});

					it('checks that current reading is below the threshold and will pass health check', () => {
						assert.ok(instance.currentReading < instance.threshold);
					});
					
					it('sets the `ok` property to `true`', () => {
						assert.isTrue(instance.ok);
					});
				});
            });

            describe('for above - when the healthcheck fails `ok` is false', () => {

                beforeEach(() => {
					instance.ok = true;
					instance.direction = 'above';
                    instance.checkOutput = 'mock output';
                    instance.threshold = 299;
					returnedPromise = instance.run();
                });

				describe('.then()', () => {

					beforeEach(() => {
						return returnedPromise;
					});

					it('checks that current reading is above the threshold and will fail health check', () => {
						assert.ok(instance.currentReading > instance.threshold);
					});
					
					it('sets the `ok` property to `false`', () => {
						assert.isFalse(instance.ok);
					});

				});

			});

			describe('for below - when the healthcheck passes `ok` is true', () => {

                beforeEach(() => {
					instance.ok = false;
					instance.checkOutput = 'mock output';
					instance.direction = 'below';
                    instance.threshold = 299;
					returnedPromise = instance.run();
				});
				
				describe('.then()', () => {

					beforeEach(() => {
						return returnedPromise;
					});

					it('checks that current reading is below the threshold and will pass health check', () => {
						assert.ok(instance.currentReading > instance.threshold);
					});
					
					it('sets the `ok` property to `true`', () => {
						assert.isTrue(instance.ok);
					});
				});
            });

            describe('for below - when the healthcheck fails `ok` is false', () => {

                beforeEach(() => {
					instance.ok = true;
					instance.checkOutput = 'mock output';
					instance.direction = 'below';
                    instance.threshold = 301;
					returnedPromise = instance.run();
                });

				describe('.then()', () => {

					beforeEach(() => {
						return returnedPromise;
					});

					it('checks that current reading is above the threshold and will fail health check', () => {
						assert.ok(instance.currentReading < instance.threshold);
					});
					
					it('sets the `ok` property to `false`', () => {
						assert.isFalse(instance.ok);
					});

				});

			});

			describe('for when the JSON response is malformed', () => {

                beforeEach(() => {
					instance.ok = true;
					mockResponse.body = JSON.stringify([]);
					returnedPromise = instance.run();
                });

				describe('.then()', () => {

					beforeEach(() => {
						return returnedPromise;
					});
					
					it('sets the `ok` property to `false`', () => {
						assert.isFalse(instance.ok);
					});

					it('sets the `checkOutput` property to the error message', () => {
						assert.strictEqual(instance.checkOutput, 'Please check that the URL is in the correct format, as it is not returning properly formatted JSON for this healthcheck.');
					});

				});

			});

			describe('when the request fails', () => {
				let requestError;

				beforeEach(() => {
					instance.ok = true;
					instance.checkOutput = '';
					requestError = new Error('request error');
					request.reset();
					request.rejects(requestError);
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
					request.reset();
					delete instance.options.method;
					returnedPromise = instance.run();
				});

				it('defaults to "GET"', () => {
					assert.calledOnce(request);
					assert.calledWith(request, {
						uri: 'mock-url',
						method: 'GET',
						resolveWithFullResponse: true,
                        timeout: instance.options.interval,
                        headers: { key: instance.options.graphiteKey }
					});
				});

			});

		});

		describe('.inspect()', () => {

			it('returns a string with the check name and status', () => {
				assert.match(instance.inspect(), /^GraphiteThresholdCheck /);
			});

		});

	});

	it('has a `validateOptions` static method', () => {
		assert.isFunction(GraphiteThresholdCheck.validateOptions);
	});

	describe('.validateOptions(options) with direction "below"', () => {
		let options;
		let returnValue;

		beforeEach(() => {
			options = {
				method: 'MOCK',
				url: 'mock-url',
				threshold: 300,
				direction: 'below',
				graphiteKey: '2589ngs9fnmockmocki34thynegids0fs'
			};
			returnValue = GraphiteThresholdCheck.validateOptions(options);
		});

		it('returns `true`', () => {
			assert.isTrue(returnValue);
		});

	});

	describe('.validateOptions(options) with direction "above"', () => {
		let options;
		let returnValue;

		beforeEach(() => {
			options = {
				method: 'MOCK',
				url: 'mock-url',
				threshold: 300,
				direction: 'above',
				graphiteKey: '2589ngs9fnmockmocki34thynegids0fs'
			};
			returnValue = GraphiteThresholdCheck.validateOptions(options);
		});

		it('returns `true`', () => {
			assert.isTrue(returnValue);
		});

		describe('when `options` is not an object', () => {

			it('returns a descriptive error', () => {
				const expectedErrorMessage = 'Options must be an object';
				returnValue = GraphiteThresholdCheck.validateOptions('');
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage);
				returnValue = GraphiteThresholdCheck.validateOptions([]);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage);
				returnValue = GraphiteThresholdCheck.validateOptions(null);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage);
			});

		});

		describe('when `options` has an invalid `url` property', () => {

			it('returns a descriptive error', () => {
				const expectedErrorMessage = 'Invalid option: url must be a non-empty string';
				options.url = '';
				returnValue = GraphiteThresholdCheck.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'empty string');
				options.url = 123;
				returnValue = GraphiteThresholdCheck.validateOptions(options);
				assert.instanceOf(returnValue, TypeError);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'non-string');
			});

		});

		describe('when `options` has an invalid `threshold` property', () => {

			it('returns a descriptive error', () => {
				const expectedErrorMessage = 'You must set a numerical threshold';
				options.threshold = null;
				returnValue = GraphiteThresholdCheck.validateOptions(options);
				assert.instanceOf(returnValue, Error);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'invalid threshold');
			});

		});

		describe('when `options` has an invalid `direction` property', () => {

			it('returns a descriptive error', () => {
				const expectedErrorMessage = 'You must set whether you want to check "above" or "below" a threshold.';
				options.direction = 'ab0ve';
				returnValue = GraphiteThresholdCheck.validateOptions(options);
				assert.instanceOf(returnValue, Error);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'invalid direction');
				options.direction = 'fgnsgkjsn';
				returnValue = GraphiteThresholdCheck.validateOptions(options);
				assert.instanceOf(returnValue, Error);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'invalid direction');
			});

		});

		describe('when `options` has no `graphiteKey` property', () => {

			it('returns a descriptive error', () => {
				const expectedErrorMessage = 'You must set up your Graphite key in your environment variables.';
				delete options.graphiteKey;
				returnValue = GraphiteThresholdCheck.validateOptions(options);
				assert.instanceOf(returnValue, Error);
				assert.strictEqual(returnValue.message, expectedErrorMessage, 'set a graphite key');
			});

		});

	});

	it('has an `assertOptionValidity` static method', () => {
		assert.isFunction(GraphiteThresholdCheck.assertOptionValidity);
	});

	describe('.assertOptionValidity(options)', () => {
		let options;

		beforeEach(() => {
			options = {
				mock: true
			};
			sinon.stub(GraphiteThresholdCheck, 'validateOptions').returns(true);
		});

		it('validates the options', () => {
			GraphiteThresholdCheck.assertOptionValidity(options);
			assert.calledOnce(GraphiteThresholdCheck.validateOptions);
			assert.calledWithExactly(GraphiteThresholdCheck.validateOptions, options);
		});

		it('does not throw', () => {
			assert.doesNotThrow(() => GraphiteThresholdCheck.assertOptionValidity(options));
		});

		describe('when the options are invalid', () => {
			let mockError;

			beforeEach(() => {
				mockError = new Error('mock error');
				GraphiteThresholdCheck.validateOptions.returns(mockError);
			});

			it('throws a validation error', () => {
				let caughtError;
				try {
					GraphiteThresholdCheck.assertOptionValidity(options);
				} catch (error) {
					caughtError = error;
				}
				assert.strictEqual(caughtError, mockError);
			});

		});

	});

});
