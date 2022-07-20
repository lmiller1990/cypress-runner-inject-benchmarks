import puppeteer from "puppeteer";
import handler from "serve-handler";
import http from "http";

const PORT = 8000;

async function visitAndInject(page) {
  await page.goto(`http://localhost:${PORT}/index.html`);
  await page.waitForSelector("#bench");
  const time = await page.$eval("#bench", (div) => {
    return div.innerText;
  });
  await page.close();
  return parseFloat(time);
}

async function bench() {
  const browser = await puppeteer.launch({
    // headless: false,
    args: ["--shm-size=3gb"],
  });

  const ms = [];

  for (let i = 0; i < 100; i++) {
    const page = await browser.newPage();
    const time = await visitAndInject(page);
    console.log(`Run ${i}: ${time}ms`);
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
