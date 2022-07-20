Run `npm install` then `npm run bench` to run the benchmark. It'll inject a large JS file, `cypress_runner.js`, 100 times in a new tab (similar to what Cypress does in run mode on CI).

On my local machine, it takes ~450ms. On GitHub CI, around ~600ms - [see here](https://github.com/lmiller1990/cypress-runner-inject-benchmarks/runs/7420290029?check_suite_focus=true#step:5:110).
