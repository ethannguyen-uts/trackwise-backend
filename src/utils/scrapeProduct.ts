import puppeteer from "puppeteer";
import path from "path";
import { v4 } from "uuid";
import fs from "fs";
import { ScrappedData } from "../types/ScrappedData";

export const scrapeProduct = async (url: string): Promise<ScrappedData> => {
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

  const data = await page.evaluate(() => {
    //get name
    const nameElement = document.querySelector(
      'div[class="shelfProductTile-information"] > h1'
    ) as any;
    if (!nameElement) throw new Error("Can not get product name!");
    const name: string = nameElement.innerText as string;

    //get price
    const priceDollarsElement = document.querySelector(
      'span[class="price-dollars"]'
    ) as HTMLElement;
    if (!priceDollarsElement) throw new Error("Can not get product price!");
    const priceDollars = parseFloat(priceDollarsElement.innerText);
    const priceCents = parseFloat(
      (document.querySelector('span[class="price-cents"]') as HTMLElement)
        .innerText
    );

    //get image url
    const imageUrlElement = document.querySelector(
      'div[class="main-image-container"] > shared-image-zoomer > img' as any
    );
    if (!imageUrlElement) throw new Error("Can not get product image!");
    const imageUrl = imageUrlElement.src as string;

    return {
      name,
      price: priceDollars + priceCents * 0.01,
      imageUrl,
    };
  });

  //remove the screen shot
  fs.unlink(screenShotPath, (err) => {
    if (err) throw new Error(err.message);
  });
  //close browser
  await browser.close();

  return { ...data, url };
};
