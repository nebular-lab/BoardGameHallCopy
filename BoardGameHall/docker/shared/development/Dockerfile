FROM node:14-alpine

WORKDIR /app

RUN yarn global add lerna

COPY package.json .
COPY yarn.lock .

RUN yarn install

COPY packages/shared ./packages/shared

COPY lerna.json .
RUN yarn lerna bootstrap

WORKDIR /app/packages/shared

CMD ["yarn", "dev"]
