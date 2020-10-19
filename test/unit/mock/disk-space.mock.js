'use strict';

const sinon = require('sinon');

const disk = sinon.stub();
module.exports = sinon.stub().returns(disk);
module.exports.disk = disk;

const mockUsage = module.exports.mockUsage = {
	available: 10000,
	free: 8000,
	total: 15000
};

disk.yieldsAsync(null, mockUsage);
