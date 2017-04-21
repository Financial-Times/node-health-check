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

		// This check monitors the process memory usage
		// It will fail if usage is above the threshold
		{
			// These properties are used to configure
			// the memory check
			type: 'memory',
			threshold: 50,
			interval: 15000,

			// These properties are output in the health
			// check JSON
			id: 'system-memory',
			name: 'System Memory Usage',
			severity: 2,
			businessImpact: 'Things may be slow',
			technicalSummary: 'Something went wrong!',
			panicGuide: 'Don\'t panic'
		},

		// This check monitors the system CPU usage
		// It will fail if usage is above the threshold
		{
			// These properties are used to configure
			// the CPU check
			type: 'cpu',
			threshold: 50,
			interval: 5000,

			// These properties are output in the health
			// check JSON
			id: 'system-cpu',
			name: 'System CPU Usage',
			severity: 2,
			businessImpact: 'Things may be slow',
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
