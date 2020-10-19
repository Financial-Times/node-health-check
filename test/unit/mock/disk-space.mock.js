'use strict';

const sinon = require('sinon');

const disk = module.exports = sinon.stub();

const mockUsage = module.exports.mockUsage = {
	available: 10000,
	free: 8000,
	total: 15000
};

disk.yieldsAsync(null, mockUsage);
