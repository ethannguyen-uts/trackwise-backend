# Track Wise - Price Tracker App

## Introduction

This is the backend API for Track Wise App using TypeGraphql to serve API functions for the Track Wise web front-end.
The main purpose of the project is to practice TypeGraphql, Typescript and apply various technologies that I learned for supportting my full stack development journey.
The project utilizes TypeGraphql advantages like strongly types, no over-fetching and under-fetching problems (compared to REST API)

## Technologies

- TypeGraphql
- TypeScript
- Apollo Server
- Express
- Postgres
- TypeOrm
- Redis
- Cron
- Puppeteer
- Jest
- Docker

## Features

### Web Scrapping with puppeteer

The main feature of the project is web scrapping, it uses puppeteer library to control headless Chrome browser that crawl retailers' websites to get products information like name, price, image, and url.
Details implementation is in [scrapeProduct.ts](src/utils/scrapeProduct.ts) function:

```typescript
export const scrapeProduct = async (url: string): Promise<ScrappedData> => {
  puppeteer.use(StealthPlugin());

  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: true,
  });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });
  const screenShotName = v4();
  const screenShotPath = `assets/${screenShotName}.png`;
  await page.screenshot({
    path: path.resolve(screenShotPath),
  });
  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
  const data = await page.evaluate(async () => {
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
```

### Auto schedule for scrapping price

The project utilize node-cron module that allows express server to schedule task using full crontab syntax, specifically run [scrapeAllProduct.ts](src/utils/scrapeAllProduct.ts) function for scrapping all products that users want to track every 12 hours:

`cron.schedule('0 0 */12 * * *', function(){ scrapeAllProducts() });`

### Send Email Notification with SendGrid

The project use SendGrid library to send the notification email for users: [sendEmail.ts](src/modules/utils/sendEmail.ts.ts)
If a product has its' price dropped, a email will be send to user so that they can immediately purchase the product from the shop.

```typescript
export const sendPriceDroppedAnnounceEmail = async (
  userEmail: string,
  productName: string,
  productPrice: number,
  productUrl: string
): Promise<void> => {
  try {
    const subject = `Price dropped on product: ${productName}.`;
    const body = `
          <div>
          <h3>We have good news for you!</h3>
          <span>Price dropped on product: ${productName}. The current price is AUD ${productPrice}.</span>
          <p>Please follow the link to purchase your product: <a href=${productUrl}>${productUrl}</a></p></span>

          Cheers,<br>
          The Track Wise support team.
          </div>
        `;
    await sendEmail(userEmail, subject, body);
  } catch (error) {
    throw error;
  }
};
```

### Storage with redis

Session is set up to store in redis

```typescript
app.use(
  session({
    store: new RedisStore({
      client: redisClient,
    }),
    name: COOKIE_NAME,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    cookie: {
      httpOnly: true, //make sure javascript cant access it
      secure: process.env.NODE_ENV === "production", // secure cookie can only be transmitted over encrypted connection
      //domain: process.env.NODE_ENV === "production" ? ".yourdomain.com" : undefined,
      maxAge: 1000 * 60 * 60 * 24 * 1 * 365, //1 year
    },
  })
);
```

Whenever a user login, session middleware will take the login data and store in redis. After that, express-session will set up a cookie (encryped key) on browser . Whenever user make a request, the cookie will be sent along with the request and store in the request object. Express-session middleware will decrypt the cookie to get the key and then make a request to redis to get the login data. This data is used for authentication purposes.

## Deployment

The api was deployed to https://trackwise.blankspacex.com/
