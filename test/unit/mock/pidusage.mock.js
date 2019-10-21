'use strict';

const sinon = require('sinon');

const pidusage = module.exports = sinon.stub();

const mockPidusage = module.exports.mockPidusage = {
	memory: 500000000,
	cpu: 5
};

pidusage.yieldsAsync(null, mockPidusage);
