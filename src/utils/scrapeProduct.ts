import puppeteer from "puppeteer";
import path from "path";
import { v4 } from "uuid";
import fs from "fs";

export const scrapeProduct = async (url: string) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  //remove blocking user agent
  await page.setUserAgent(
    `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36`
  );
  await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });
  const screenShotName = v4();
  const screenShotPath = `assets/${screenShotName}.png`;
  await page.screenshot({
    path: path.resolve(screenShotPath),
  });
  // Get the "viewport" of the page, as reported by the page.
  const data = await page.evaluate(() => {
    const name: string = (
      document.querySelector(
        'div[class="shelfProductTile-information"] > h1'
      ) as any
    ).innerText;

    const priceDollars = parseFloat(
      (document.querySelector('span[class="price-dollars"]') as HTMLElement)
        .innerText
    );
    const priceCents = parseFloat(
      (document.querySelector('span[class="price-cents"]') as HTMLElement)
        .innerText
    );
    const imageUrl = document.querySelector(
      'div[class="main-image-container"] > shared-image-zoomer > img' as any
    ).src;

    return {
      name,
      price: priceDollars + priceCents * 0.01,
      imageUrl,
    };
  });

  //remove the screen shot
  fs.unlink(screenShotPath, (err) => {
    if (err) throw err;
  });

  await browser.close();

  return data;
};
