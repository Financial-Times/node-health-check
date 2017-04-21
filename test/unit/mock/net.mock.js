'use strict';

const sinon = require('sinon');

const net = module.exports = {
	connect: sinon.stub()
};

const mockSocket = module.exports.mockSocket = {
	destroy: sinon.stub(),
	on: sinon.stub()
};

net.connect.returns(mockSocket);
