# GitHub Action 側でビルドコンテキストが設定できないのでこのファイルはルートに置く
# https://github.com/marketplace/actions/build-push-and-release-a-docker-container-to-heroku
FROM node:14-alpine

WORKDIR /app

RUN yarn global add lerna

COPY package.json .
COPY yarn.lock .

COPY packages/server ./packages/server
COPY packages/shared ./packages/shared

RUN yarn install

COPY lerna.json .
RUN yarn lerna bootstrap

WORKDIR /app/packages/shared
RUN yarn tsc -p . -d

WORKDIR /app/packages/server
RUN yarn build

EXPOSE $PORT

ENV NODE_ENV=production

CMD ["yarn", "start"]
