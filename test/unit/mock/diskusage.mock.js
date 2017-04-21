'use strict';

const sinon = require('sinon');

const disk = module.exports = {
	check: sinon.stub()
};

const mockUsage = module.exports.mockUsage = {
	available: 10000,
	free: 8000,
	total: 15000
};

disk.check.yieldsAsync(null, mockUsage);
