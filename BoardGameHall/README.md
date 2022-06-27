# ボードゲームの館

## Requirements
- Node 14
- yarn v1

## Set Up
### 開発環境の準備
```shell
git clone git@github.com:dododoSA/BoardGameHall.git
cd BoardGameHall
# yarn install じゃなくて lerna bootstrap かもしれない
yarn install
cp packages/server/.env.dist packages/server/.env
cp packages/client/.env.local.dist packages/client/.env.local

docker-compose build
yarn dev
```
必要に応じてエディタの eslint の設定などを入れておく
### 開発サーバーの立ち上げ
```shell
yarn dev
```

## 開発の流れ
1. `git branch` や `git status` などで現在のブランチがdevelopであるかを確認する。developでなければ `git checkout develop`。
2. `git pull origin develop` でdevelopブランチを最新の状態にする
3. `git checkout -b 作業内容` でブランチを作成
4. 作業をする
5. 必要に応じて `yarn format-all` を実行
6. `git add ファイル名` で保存したいファイルを選択
7. `git commit -m "コミットメッセージ"` でファイルの変更を保存
8. 全ての作業が完了し、コミットをしたら `git push origin 作業ブランチ名` で Git Hubにプッシュ
9. [ここから](https://github.com/dododoSA/BoardGameHall/compare) プルリクエストを作成。作業内容を書いてReviewerにdododoSAを指定

## Deploy
developにマージされるとステージング環境に、mainにマージされるとproduction環境にデプロイされる
