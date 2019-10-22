'use strict';

const sinon = require('sinon');

const os = module.exports = {
	totalmem: sinon.stub()
};

const mockOs = module.exports.mockOs = (Math.pow(16, 8) / 2);

os.totalmem.returns(mockOs);
