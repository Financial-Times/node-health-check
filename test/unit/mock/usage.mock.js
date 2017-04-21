'use strict';

const sinon = require('sinon');

const usage = module.exports = {
	lookup: sinon.stub()
};

const mockUsage = module.exports.mockUsage = {
	memory: 500000000,
	memoryInfo: {
		vsize: 2000000000
	},
	cpu: 5
};

usage.lookup.yieldsAsync(null, mockUsage);
