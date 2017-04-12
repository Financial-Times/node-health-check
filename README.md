
Node Health Check
=================

Build health check functions which comply with the [FT health check standard].


---

**:warning: Work In Progress :warning:**

This is a work-in-progress and is not ready for use in production applications. Please [contact Origami](#contact) if you'd like more information.

---


[![NPM version](https://img.shields.io/npm/v/@financial-times/health-check.svg)](https://www.npmjs.com/package/@financial-times/health-check)
[![Build status](https://img.shields.io/circleci/project/Financial-Times/node-health-check.svg)](https://circleci.com/gh/Financial-Times/node-health-check)
[![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)][license]


Table Of Contents
-----------------

  - [Usage](#usage)
    - [Requirements](#requirements)
    - [API Documentation](#api-documentation)
    - [Options](#options)
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
const healthCheck = require('@financial-times/health-check');
```

### `healthCheck( [options] )`

This function returns a new health check object. You can configure the health checks with [an options object](#options) if you need to override any defaults.

```js
const health = healthCheck({
    checks: [
        // ...
    ]
});
```

### Options

The Health Check module can be configured with a variety of options, passed in as an object to the `healthCheck` function. The available options are as follows:

  - `checks`: An array of healthcheck configuration objects. Defaults to an empty array
  - `log`: A console object used to output logs. Defaults to the global `console` object

### Examples

You can find example implementations of health checks in the `examples` folder of this repo:

  - **Basic:** create and run some simple health checks:

    ```sh
    node examples/basic
    ```


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
[ft health check standard]: https://docs.google.com/a/ft.com/document/d/18hefJjImF5IFp9WvPAm9Iq5_GmWzI9ahlKSzShpQl1s/edit?usp=sharing
[issues]: https://github.com/Financial-Times/node-health-check/issues
[license]: http://opensource.org/licenses/MIT
[node.js]: https://nodejs.org/
[npm]: https://www.npmjs.com/
[origami support]: mailto:origami-support@ft.com
[promises]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise
