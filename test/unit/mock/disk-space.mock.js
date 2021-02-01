'use strict';

const sinon = require('sinon');

const disk = sinon.stub();
module.exports = disk;

const mockUsage = module.exports.mockUsage = {
	usedSize: 8000,
	totalSize: 16000
};

disk.yieldsAsync(null, mockUsage);
