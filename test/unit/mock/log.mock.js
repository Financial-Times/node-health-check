'use strict';

const sinon = require('sinon');

module.exports = {
	error: sinon.spy(),
	info: sinon.spy(),
	log: sinon.spy(),
	trace: sinon.spy(),
	warn: sinon.spy()
};
