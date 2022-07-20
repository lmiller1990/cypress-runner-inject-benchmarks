Run `npm install` then `npm run bench` to run the benchmark. It'll inject a large JS file, `cypress_runner.js`, 100 times in a new tab (similar to what Cypress does in run mode on CI).

On my machine, it takes ~450ms.
