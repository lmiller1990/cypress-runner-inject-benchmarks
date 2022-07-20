Run `npm install` then `npm run bench` to run the benchmarks. It'll inject a large JS file, `cypress_runner.js`, 100 times, using various strategies discussed here: https://github.com/cypress-io/cypress/issues/22353.

Options:

- `--devtools` - open devtools (majorly slows things down; not very useful for meassuring, but very useful for debugging)
- `--headed` - run headed (seems to not impact performance)

