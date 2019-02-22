
Node Health Check [![NPM version](https://img.shields.io/npm/v/@financial-times/health-check.svg)](https://www.npmjs.com/package/@financial-times/health-check) [![Build status](https://img.shields.io/circleci/project/Financial-Times/node-health-check.svg)](https://circleci.com/gh/Financial-Times/node-health-check) [![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)](#license)
=================

Build health check functions which comply with the [FT health check standard].

Table Of Contents
-----------------

  - [Usage](#usage)
    - [Requirements](#requirements)
    - [API Documentation](#api-documentation)
    - [Options](#options)
    - [Health Check Configurations](#health-check-configurations)
    - [Examples](#examples)
  - [Contributing](#contributing)
  - [Publishing](#publishing)
  - [Contact](#contact)
  - [Licence](#licence)


Usage
-----

### Requirements

Running the Health Check module requires [Node.js] 6.x and [npm]. You can install with:

```sh
npm install @financial-times/health-check
```

### API Documentation

This library makes use of [promises] – familiarity is assumed in the rest of the API documentation. You'll also need to require the module with:

```js
const HealthCheck = require('@financial-times/health-check');
```

### `new HealthCheck( [options] )`

This function returns a new health check object. You can configure the health checks with [an options object](#options) if you need to override any defaults.

```js
const health = new HealthCheck({
    checks: [
        // ...
    ]
});
```

The [given checks](#health-check-configurations) start polling immediately at the intervals that you specify. The returned instance has several methods for reading this data.

#### `health.checks()`

This returns a health check function that's compatible with the [Express Web Service] module. The returned function returns a promise which resolves to a JSON-friendly copy of the health check data.

Assuming you've already included [Express] and [Express Web Service]:

```js
app.use(expressWebService({
    healthCheck: health.checks()
}));
```

#### `health.gtg()`

This returns a good-to-go function that's compatible with the [Express Web Service] module. The returned function returns a promise which resolves to either `true` or `false`.

`false` will be the resolved value if any of the health checks with severity `1` are failing.

Assuming you've already included [Express] and [Express Web Service]:

```js
app.use(expressWebService({
    goodToGoTest: health.gtg()
}));
```

#### `health.toJSON()`

Get the health check output as an array that's safe for converting to JSON. You can use this if you don't intend on using the [Express Web Service] module.

#### `health.stop()`

This stops all of the checks from running. This is useful if the health checks are keeping the Node.js process open and you need it to close. E.g. after integration tests.

```js
health.stop();
```

### `new HealthCheck.Check( [options] )`

This class is used to create custom health checks. You'll need to extend this class in order to use it, and can pass instances directly into `HealthCheck` when you instantiate it. E.g.

```js
class MyHealthCheck extends HealthCheck.Check {

    constructor(options) {
        super(options);
    }

    // Must return a promise
    run() {
        return new Promise(resolve => {
            // Must set these properties
            this.ok = true;
            this.checkOutput = '';
            this.lastUpdated = new Date();
            resolve();
        });
    }

}
```

[See examples](#examples) for more information, or look through [`lib/check`](lib/check) for more classes which already extend the base Check class.


### Options

The Health Check module can be configured with a variety of options, passed in as an object to the `HealthCheck` constructor. The available options are as follows:

  - `checks`: An array of [health check configuration objects](#health-check-configurations). Defaults to an empty array
  - `log`: A console object used to output logs. Defaults to the global `console` object

### Health Check Configurations

Each health check can be configured as an object. These follow the [FT health check standard], which has more information, and there are [examples](#examples) available to help you out. No matter what type of check you're adding, there are some common required properties:

  - `type`: The type of the check. One of `cpu`, `disk-space`, `memory`, `ping-url`, `tcp-ip`. Additional configurations required by these types are documented below
  - `businessImpact`: The business impact of the health check as a string
  - `id`: The unique ID of the health check as a string. Must use only lowercase alphanumeric characters and hyphens.
  - `name`: The name of the health check as a string.
  - `panicGuide`: The panic guide for the health check as a string.
  - `technicalSummary`: The technical summary for the health check as a string.

There are also some common optional properties:

  - `severity`: The severity level of the health check if it is failing. Must be one of `1` (high), `2` (medium), `3` (low)
  - `interval`: The number of milliseconds to wait between checks. Defaults to `30000` (30 seconds)

Different types of check may have additional config properties. These are documented below.

#### Check Type: CPU

The `cpu` type accepts some additional configuration:

  - `threshold`: The maximum CPU usage (as a percentage) that is allowed before the check will fail. Defaults to `50`

#### Check Type: Disk Space

The `disk-space` type accepts some additional configuration:

  - `threshold`: The maximum disk space usage (as a percentage) that is allowed before the check will fail. Defaults to `75`

#### Check Type: Memory

The `memory` type accepts some additional configuration:

  - `threshold`: The maximum memory usage (as a percentage) that is allowed before the check will fail. Defaults to `75`

#### Check Type: Ping URL

The `ping-url` type requires some additional configuration:

  - `url`: The URL that the check should ping. This accepts a string or a function that returns a string
  - `method`: The HTTP method to use when pinging the URL. Defaults to `"HEAD"`
  - `headers`: The HTTP headers to be sent with the request. This accepts an object with key value pair. Defaults to empty object

#### Check Type: TCP/IP

The `tcp-ip` type requires some additional configuration:

  - `host`: The hostname that the check should ping
  - `port`: The TCP port to use when pinging the hostname. Defaults to `80`

#### Check Type: Graphite Threshold

The `graphite-threshold` type requires some additional configuration:

  - `graphiteKey`: Ensure you have your API key for Graphite set in your environment variables as `FT_GRAPHITE_KEY`, then pass this in to the healthcheck options
  - `url`: the full Graphite URL you want to receive a response from. Regarding the URL, it is best to pass in a URL that uses Graphite's summarize() function to get the average of a set of datapoints across your specified interval and use this in the healthcheck. For example, in the following URL — https://graphitev2-api.ft.com/render/?from=-5minutes&target=summarize(internalproducts.heroku.ip-envoy.worker_1.queue.task,%20%225minutes%22,%20%22avg%22,%20true)&format=json — we ask Graphite that, `from` the last 5 minutes (`-5minutes`) of datapoints on `internalproducts.heroku.ip-envoy.worker_1.queue.task`, we want to `summarize` the average (`avg`) into a single datapoint in buckets of 5 minute intervals.
  - `threshold`: the number you want to set as your threshold to check against
  - `direction`: set `above` if you want to check if something exceeds your threshold, or `below` if something falls below it
  - `interval`: how often to check

See `examples` for sample usage.

### Examples

You can find example implementations of health checks in the `examples` folder of this repo:

  - **Basic:** create and run some simple health checks:

    ```sh
    node examples/basic
    ```
    [Source File][example-basic]

  - **Custom:** create and run some custom health checks:

    ```sh
    node examples/custom
    ```
    [Source File][example-custom]


Contributing
------------

This module has a full suite of unit tests, and is verified with ESLint. You can use the following commands to check your code before opening a pull request.

```sh
make verify  # verify JavaScript code with ESLint
make test    # run the unit tests and check coverage
```


Publishing
----------

New versions of the module are published automatically by CI when a new tag is created matching the pattern `/v.*/`.


Contact
-------

If you have any questions or comments about this module, or need help using it, please either [raise an issue][issues], visit [#ft-origami] or email [Origami Support].


Licence
-------

This software is published by the Financial Times under the [MIT licence][license].




[#ft-origami]: https://financialtimes.slack.com/messages/ft-origami/
[express]: https://expressjs.com/
[express web service]: https://github.com/Financial-Times/express-web-service
[ft health check standard]: https://docs.google.com/a/ft.com/document/d/18hefJjImF5IFp9WvPAm9Iq5_GmWzI9ahlKSzShpQl1s/edit?usp=sharing
[issues]: https://github.com/Financial-Times/node-health-check/issues
[license]: http://opensource.org/licenses/MIT
[node.js]: https://nodejs.org/
[npm]: https://www.npmjs.com/
[origami support]: mailto:origami-support@ft.com
[promises]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise
[example-basic]: https://github.com/Financial-Times/node-health-check/blob/master/example/basic/index.js
[example-custom]: https://github.com/Financial-Times/node-health-check/blob/master/example/custom/index.js
