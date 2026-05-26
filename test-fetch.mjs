import { chromium } from 'playwright';

async function fetchUrl(url) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const text = await page.locator('body').innerText();
  await browser.close();
  console.log(text.slice(0, 500));
}
fetchUrl('https://jobs.ashbyhq.com/bland/804fbd27-027e-4de5-8a6f-77241a65e599');
