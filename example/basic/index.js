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
		},

		// This check pings GitHub.com on port 80 every
		// 30 seconds. It will fail if it cannot connect
		{
			// These properties are used to configure
			// the TCP/IP check
			type: 'tcp-ip',
			host: 'github.com',
			port: 80,
			interval: 30000,

			// These properties are output in the health
			// check JSON
			id: 'github-port-80',
			name: 'GitHub TCP/IP Port 80',
			severity: 2,
			businessImpact: 'Things won\'t install',
			technicalSummary: 'Something went wrong!',
			panicGuide: 'Don\'t panic'
		},

		// This check monitors the system disk space usage
		// It will fail if usage is above the threshold
		{
			// These properties are used to configure
			// the disk space check
			type: 'disk-space',
			threshold: 80,
			interval: 15000,

			// These properties are output in the health
			// check JSON
			id: 'system-disk-space',
			name: 'System Disk Space Usage',
			severity: 2,
			businessImpact: 'New files may not be saved',
			technicalSummary: 'Something went wrong!',
			panicGuide: 'Don\'t panic'
		},

		// This check monitors the number of events in the Envoy queue
		// It will fail if the averge number of events in the Envoy
		// queue falls below 50 in a 5-minute interval
		{
			// These properties are used to configure
			// the graphite-threshold check
			type: 'graphite-threshold',
			// This URL receives data about the average
			// number of events being processed by the
			// Envoy task queue over the previous 5 mins
			url: 'https://graphitev2-api.ft.com/render/?from=-5minutes&target=summarize(internalproducts.heroku.ip-envoy.worker_1.queue.task,%20%225minutes%22,%20%22avg%22,%20true)&format=json',
			threshold: 50,
			direction: 'below',
			interval: 300000,
			/* eslint-disable */
			graphiteKey: FT_GRAPHITE_KEY,
			/* eslint-disable */
			// These properties are output in the health
			// check JSON
			id: 'envoy-event-queue-check',
			name: 'Envoy event queue check 💯 👀',
			severity: 3,
			businessImpact: 'The number of events in the Envoy queue has dropped below the specified threshold.',
			technicalSummary: 'This might indicate an issue and should be monitored.',
			panicGuide: 'Inspect RabbitMQ to see if anything is amiss.'
		}

	]
});

// Here we're just polling the health checker to
// see if there are any changes. We output the
// results every second just for this example
setInterval(() => {
	console.log(health);
}, 1000);
