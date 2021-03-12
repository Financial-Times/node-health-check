'use strict';

const log = require('./log.mock');
const sinon = require('sinon');

class Check {
	constructor(options) {
		// Mock properties
		this.businessImpact = 'mock-business-impact';
		this.checkOutput = 'mock-check-output';
		this.id = 'mock-id';
		this.interval = 'mock-interval';
		this.lastUpdated = new Date();
		this.log = log;
		this.name = 'mock-name';
		this.ok = true;
		this.options = options;
		this.panicGuide = 'mock-panic-guide';
		this.severity = 'mock-severity';
		this.technicalSummary = 'mock-technical-summary';

		// Methods
		this.inspect = sinon.stub();
		this.isRunning = sinon.stub().returns(true);
		this.run = sinon.stub();
		this.start = sinon.stub();
		this.stop = sinon.stub();
		this.toJSON = sinon.stub();
	};
}

module.exports = sinon.spy(Check);
