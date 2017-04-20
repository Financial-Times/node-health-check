'use strict';

// Load the module (you would replace this with the
// full module name: @financial-times/health-check)
const HealthCheck = require('../..');

// Create a health check object
const health = new HealthCheck({
	checks: [

		// This check pings the FT.com home page every
		// 30 seconds. It will fail if it receives a
		// non-200 response
		{
			// These properties are used to configure
			// the URL ping
			type: 'ping-url',
			url: 'https://www.ft.com/',
			interval: 30000,

			// These properties are output in the health
			// check JSON
			id: 'ft-home',
			name: 'FT.com Home Page',
			severity: 1,
			businessImpact: 'Users may not see the home page',
			technicalSummary: 'Something went wrong!',
			panicGuide: 'Don\'t panic'
		},

		// This check pings the GitHub home page every
		// 60 seconds. It will fail if it receives a
		// non-200 response
		{
			// These properties are used to configure
			// the URL ping
			type: 'ping-url',
			url: 'https://github.com/',
			interval: 60000,

			// These properties are output in the health
			// check JSON
			id: 'github-home',
			name: 'GitHub.com Home Page',
			severity: 2,
			businessImpact: 'We won\'t be able to load some bundles',
			technicalSummary: 'Something went wrong!',
			panicGuide: 'Don\'t panic'
		}

	]
});

// Here we're just polling the health checker to
// see if there are any changes. We output the
// results every second just for this example
setInterval(() => {
	console.log(health);
}, 1000);
