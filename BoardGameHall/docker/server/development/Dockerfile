FROM node:14-alpine

WORKDIR /app

RUN yarn global add lerna

COPY packages/server ./packages/server
COPY packages/shared ./packages/shared

COPY package.json .
COPY yarn.lock .

RUN yarn install

COPY lerna.json .
RUN yarn lerna bootstrap

WORKDIR /app/packages/server

CMD ["yarn", "dev"]
