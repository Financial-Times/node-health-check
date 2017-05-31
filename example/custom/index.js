'use strict';

// Load the module (you would replace this with the
// full module name: @financial-times/health-check)
const HealthCheck = require('../..');

// Function which returns a promise that resolves
// or rejects randomly
function randomPromise(failRate) {
	return new Promise((resolve, reject) => {
		if (Math.random() >= failRate) {
			resolve();
		} else {
			reject(new Error('Random failure'));
		}
	});
}

// Create a custom health check class that fails intermittently
// It's configurable with a `failRate` option, to demonstrate
// how you can make reusable health checks
class RandomFailingCheck extends HealthCheck.Check {

	constructor(options) {
		// Fail ~50% of the time by default
		options.failRate = options.failRate || 0.5;
		super(options);
	}

	// Must return a promise that does not reject
	// So it's important to add a catch handler
	run() {
		return randomPromise(this.options.failRate)
			.then(() => {
				// Setting the `ok` property is how you indicate
				// that the health check is passing or failing
				this.ok = true;
				this.checkOutput = '';
				// You must always set the `lastUpdated` property
				// to a new date
				this.lastUpdated = new Date();
			})
			.catch(error => {
				this.ok = false;
				this.checkOutput = error.message;
				this.lastUpdated = new Date();
			});
	}

}

// Create a health check object
const health = new HealthCheck({
	checks: [

		new RandomFailingCheck({
			interval: 1000,
			id: 'random',
			name: '50% random failure check',
			severity: 1,
			businessImpact: 'Things may not work',
			technicalSummary: 'Something went wrong!',
			panicGuide: 'Don\'t panic'
		}),

		new RandomFailingCheck({
			interval: 1000,
			failRate: 0.9,
			id: 'random-2',
			name: '90% random failure check',
			severity: 1,
			businessImpact: 'Things may not work',
			technicalSummary: 'Something went wrong!',
			panicGuide: 'Don\'t panic'
		}),

		new RandomFailingCheck({
			interval: 1000,
			failRate: 0.1,
			id: 'random-3',
			name: '10% random failure check',
			severity: 1,
			businessImpact: 'Things may not work',
			technicalSummary: 'Something went wrong!',
			panicGuide: 'Don\'t panic'
		})

	]
});

// Here we're just polling the health checker to
// see if there are any changes. We output the
// results every second just for this example
setInterval(() => {
	console.log(health);
}, 1000);
