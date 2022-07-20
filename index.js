import puppeteer from "puppeteer";

async function visitAndInject(page) {
  await page.goto("http://localhost:8000");
  await page.waitForSelector("#bench");
  const time = await page.$eval("#bench", (div) => {
    return div.innerText;
  });
  await page.close();
  return parseFloat(time);
}

(async () => {
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
})();
