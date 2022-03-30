FROM node:16


# Create app directory
WORKDIR /usr/src/app

RUN apt-get update \
    && apt-get install -y wget gnupg \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package.json ./
COPY yarn.lock ./

RUN yarn


# Bundle app source
COPY . .

#copy 
COPY .env.production .env 

RUN yarn build

RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /usr/src/app/home/pptruser/Downloads \
    && chown -R pptruser:pptruser /usr/src/app \
    && chown -R pptruser:pptruser /usr/src/app/home/pptruser \
    && chown -R pptruser:pptruser /usr/src/app/node_modules \
    && chown -R pptruser:pptruser /usr/src/app/package.json \
    && chown -R pptruser:pptruser /usr/src/app/yarn.lock

ENV NODE_ENV production


EXPOSE 8080
CMD [ "node", "dist/index.js" ]
USER pptruser