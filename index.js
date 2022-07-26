// @ts-check

import puppeteer from "puppeteer";
import handler from "serve-handler";
import http from "http";

const PORT = 8000;

const headed = process.argv.slice(2).some((x) => x.includes("--headed"));
const devtools = process.argv.slice(2).some((x) => x.includes("--devtools"));

const wait = () => {
  return new Promise((res) => setTimeout(res, 1000000));
};

/**
 * @param {import('puppeteer').Browser} browser
 * @param {String} runTitle
 * @param {import('puppeteer').Page} prevPage
 */
async function visitAndInject(browser, runTitle, prevPage) {
  const page = await browser.newPage();
  await page.goto(`http://localhost:${PORT}/index.html`);
  await page.evaluate(
    ({ runTitle }) => {
      document.title = runTitle;
    },
    { runTitle }
  );

  await page.waitForSelector("#bench");

  // not present on first run
  if (prevPage) {
    await prevPage.close();
  }

  const time = await page.$eval("#bench", (div) => {
    // @ts-ignore
    return div.innerText;
  });

  // await wait()

  return {
    prev: page,
    time: parseFloat(time),
  };
}

async function benchSetLocation() {
  const browser = await puppeteer.launch({
    devtools,
    headless: !headed,
    args: ["--shm-size=3gb"],
    timeout: 1000 * 60 * 2, // 2 min
  });
  const page = await browser.newPage();
  let runs = []
  for (let i = 0; i < 100; i++) {
    await page.goto(`http://localhost:${PORT}/document_location.html`);
    const ms = await page.$eval("#bench", (p) => p.innerText);
    runs.push(parseFloat(ms))
    console.log(`Run #${i}: ${ms}ms`)
    await page.evaluate(({ i, PORT }) => {
      document.location = `http://localhost:${PORT}/document_location.html?run=${i}`
    }, { i, PORT })
  }

  const average = runs.reduce((acc, curr) => acc + curr, 0) / runs.length;
  await browser.close();

  return {
    time: average.toFixed(0),
  };
}

async function benchLocationReload() {
  const browser = await puppeteer.launch({
    devtools,
    headless: !headed,
    args: ["--shm-size=3gb"],
    timeout: 1000 * 60 * 2, // 2 min
  });
  const page = await browser.newPage();
  let runs = []
  for (let i = 0; i < 100; i++) {
    await page.goto(`http://localhost:${PORT}/location_reload.html`);
    const ms = await page.$eval("#bench", (p) => p.innerText);
    runs.push(parseFloat(ms))
    console.log(`Run #${i}: ${ms}ms`)
    await page.evaluate(() => {
      location.reload()
    })
  }

  const average = runs.reduce((acc, curr) => acc + curr, 0) / runs.length;
  await browser.close();

  return {
    time: average.toFixed(0),
  };
}

async function benchSinglePage() {
  const browser = await puppeteer.launch({
    headless: !headed,
    devtools,
    args: ["--shm-size=3gb"],
    timeout: 1000 * 60 * 2, // 2 min
  });
  const page = await browser.newPage();
  await page.goto(`http://localhost:${PORT}/benchmark.html`);
  const total = await page.$eval("p", (p) => p.innerText);
  const runs = await page.$$eval("li", (li) => li.map((x) => x.innerText));

  await browser.close();

  return {
    runs,
    time: parseFloat(total),
  };
}

async function bench() {
  const browser = await puppeteer.launch({
    headless: !headed,
    devtools,
    args: ["--shm-size=3gb"],
  });

  const ms = [];

  let prevPage;

  for (let i = 0; i < 100; i++) {
    const runTitle = `Run #${i}`;
    let { time, prev } = await visitAndInject(browser, runTitle, prevPage);
    prevPage = prev;
    console.log(`${runTitle}: ${time}ms`);
    ms.push(time);
  }

  const average = ms.reduce((acc, curr) => acc + curr, 0) / ms.length;

  await browser.close();

  return {
    time: average.toFixed(0),
  };
}

const server = http.createServer((request, response) => {
  // You pass two more arguments for config and middleware
  // More details here: https://github.com/vercel/serve-handler#options
  return handler(request, response);
});

server.listen(PORT, async () => {
  let title = "Multi Tab Benchmark";
  console.log(`=== ${title} (new tab per reload) ===\n`);

  const multitab = await bench();

  console.log(`${title} average (100 runs): ${multitab.time}ms`);

  console.log(`\n--------------------------------------------------\n`);
  title = "Single Page Benchmark";
  console.log(`=== ${title} (one tab, no reload) ===\n`);

  const singlePageBench = await benchSinglePage();

  for (const i in singlePageBench.runs) {
    const run = singlePageBench.runs[i];
    console.log(`Run #${i}: ${run}`);
  }

  console.log(`${title} average (100 runs): ${singlePageBench.time}ms`);

  console.log(`\n--------------------------------------------------\n`);
  title = "location.reload() Benchmark";
  console.log(`=== ${title} (one tab, no reload) ===\n`);

  const locationReload = await benchLocationReload();
  console.log(`${title} average (100 runs): ${locationReload.time}ms`);

  // document.location = ...

  console.log(`\n--------------------------------------------------\n`);
  title = "document.location Benchmark";
  console.log(`=== ${title} (one tab, document.location = ...) ===\n`);

  const documentLocation = await benchSetLocation();
  console.log(`${title} average (100 runs): ${documentLocation.time}ms`);


  server.close();
});
