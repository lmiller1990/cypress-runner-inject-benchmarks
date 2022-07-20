// @ts-check

import puppeteer from "puppeteer";
import handler from "serve-handler";
import http from "http";

const PORT = 8000;

/**
 * @param {import('puppeteer').Browser} browser
 * @param {String} runTitle
 * @param {import('puppeteer').Page} prevPage
 */
async function visitAndInject(browser, runTitle, prevPage) {
  const page = await browser.newPage();
  await page.goto(`http://localhost:${PORT}/index.html`);
  await page.evaluate(({ runTitle }) => {
    document.title = runTitle;
  }, { runTitle });


  await page.waitForSelector("#bench");

  // not present on first run
  if (prevPage) {
    await prevPage.close();
  }

  const time = await page.$eval("#bench", (div) => {
    // @ts-ignore
    return div.innerText;
  });

  return {
    prev: page,
    time: parseFloat(time),
  };
}

async function bench() {
  const browser = await puppeteer.launch({
    // headless: false,
    args: ["--shm-size=3gb"],
  });

  const ms = [];

  let prevPage;

  for (let i = 0; i < 100; i++) {
    const runTitle = `Run #${i}`
    let { time, prev } = await visitAndInject(browser, runTitle, prevPage);
    prevPage = prev;
    console.log(`${runTitle}: ${time}ms`);
    ms.push(time);
  }

  const sum = ms.reduce((acc, curr) => acc + curr, 0);
  console.log(`=> Average time: ${sum / ms.length}`);

  await browser.close();
}

const server = http.createServer((request, response) => {
  // You pass two more arguments for config and middleware
  // More details here: https://github.com/vercel/serve-handler#options
  return handler(request, response);
});

server.listen(PORT, async () => {
  console.log(`Running at http://localhost:${PORT}`);
  await bench();
  server.close();
});
