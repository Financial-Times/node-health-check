'use strict';

const log = require('./log.mock');
const sinon = require('sinon');

module.exports = sinon.spy(Check);

function Check(options) {
	return {
		// Mock properties
		businessImpact: 'mock-business-impact',
		checkOutput: 'mock-check-output',
		id: 'mock-id',
		interval: 'mock-interval',
		lastUpdated: new Date(),
		log,
		name: 'mock-name',
		ok: true,
		options,
		panicGuide: 'mock-panic-guide',
		severity: 'mock-severity',
		technicalSummary: 'mock-technical-summary',

		// Methods
		inspect: sinon.stub(),
		isRunning: sinon.stub().returns(true),
		run: sinon.stub(),
		start: sinon.stub(),
		stop: sinon.stub(),
		toJSON: sinon.stub()
	};
}
