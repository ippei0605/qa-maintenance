# Q&A Maintenance

## はじめに
このアプリは次の目的で開発しました。
* Q&A Chatbot (https://github.com/ippei0605/qa-chatbot) のメンテナンス
* Vue.js 2.0 の勉強

## 使い方
次のページにアクセスしてください。ログインには Bluemix のアカウントを使用してください。
* https://qa-maintenance.eu-gb.mybluemix.net/

## リポジトリ構成
Vue.js と Express を混在させて開発を進めると複雑になるので、次のように分けて開発します。
* サーバーアプリ
    - https://github.com/ippei0605/qa-maintenance
* クライアントアプリ
    - https://github.com/ippei0605/qa-maintenance-vue

    > クライアントアプリを変更した場合、ビルド (npm run build) 後、dist ディレクトリー配下のファイルをサーバーアプリの public ディレクトリー配下にコピーしてください。
    
## セットアップ
本アプリをご自身の Bluemix 環境にセットアップする手順を簡単に示します。

1. Q&A Chatbot をセットアップしてください。
1. 別途、Cloud Foundry アプリ「SDK for Node.js™」を作成し、Q&A Chatbot と同様にサービス接続してください。
1. 本アプリをプッシュしてください。

## アプリ構成

### 実行環境の切替え
開発中はサーバーとクライアントアプリのサイトが異なり CORS 問題が生じます。次の方法で対処しています。
* 切替え方法
    - 開発モード: node app でアプリを起動する。
    - 本番モード: npm start でアプリを起動する。
* 仕組み
    - https://github.com/ippei0605/qa-maintenance/blob/master/package.json#L8
    - https://github.com/ippei0605/qa-maintenance/blob/master/app.js#L26-L33

### ルーティング
* /

    | URL                      | Method | パラメータ             | 処理           　               |
    | :----------------------- | :----- | :-------------------- |:------------------------------ |
    | /login                   | POST   | username, password    | Bluemix にログインする。         |
    | /export-answer           | GET    |                       | コンテンツを表示する。            |
    | /export-training-csv     | GET    |                       | NLC トレーニングデータを表示する。 |
    | /export-corpus           | GET    |                       | STT コーパスを表示する。          |

* /nlc

    | URL                      | Method | パラメータ                        | 処理           　               |
    | :----------------------- | :----- | :------------------------------- |:------------------------------ |
    | /                        | GET    |                                  | Classifier 一覧を取得する。      |
    | /                        | POST   |                                  | Classifier を新規作成する。      |
    | /:id/delete              | POST   |                                  | Classifier を削除する。         |
    | /:id/classify            | GET    | text, now = yyyy年M月d日 h時m分s秒 | クラス分類する。                 |

* /stt

    | URL                      | Method | パラメータ             | 処理           　               |
    | :----------------------- | :----- | :-------------------- |:------------------------------ |
    | /                        | GET    |                       | カスタムモデル一覧を取得する。     |
    | /                        | POST   |                       | カスタムモデルを作成する。        |
    | /token                   | GET    |                       | 音声認識のためのトークンを取得する。|
    | /:id                     | GET    |                       | カスタムモデル情報を取得する。     |
    | /:id/train               | POST   |                       | カスタムモデルをトレーニングする。 |
    | /:id/delete              | POST   |                       | カスタムモデルを削除する。        |
    | /:id/corpus              | POST   | req.file (corpus-txt) | コーパスを追加する。             |
    | /:id/corpus/:name/delete | POST   |                       | コーパスを削除する。             |
    | /:id/word                | POST   | req.file (word-json)  | ワードを追加する。               |
    | /:id/word/:word/delete   | POST   |                       | ワードを削除する。               |

* /tts

    | URL                      | Method | パラメータ             | 処理           　               |
    | :----------------------- | :----- | :-------------------- |:------------------------------ |
    | /token                   | GET    |                       | 音声認識のためのトークンを取得する。|

### ファイル構成
```
qa-maintenance
├── .cfignore
├── .gitignore
├── README.md                       本書
├── app.js                          アプリ
├── models
│   └── watson.js                   モデル
├── package.json
├── public
│   ├── static                      qa-maintenance-vue でビルドしたファイル
│   ├── favicon.ico
│   └── index.html                  qa-maintenance-vue でビルドしたファイル
├── routes
│   ├── index.js                    ルーティング 
│   ├── nlc.js                      NLC のルーティング
│   ├── stt.js                      STT のルーティング
│   └── tts.js                      TTS のルーティング
├── utils
│   └── context.js                  コンテキスト
└── views
    └── index.ejs                   画面
```

## 今後の開発に向けた検討事項 (音声対話基盤)

### Swagger って必要？
* クライアント・サーバー分離して開発していますが、API 公開するわけではないので、Swagger は必要ないと思ってます。
* REST API の リクエスト、レスポンス、コードなどを README.md に記述するレベルで良いかと思ってます。

### コールバックについて
* exports する関数は、面倒ですが @callback を JSDoc にきちんと書かないと混乱すると思います。
    - https://github.com/ippei0605/qa-maintenance/blob/master/models/watson.js#L60-L98

### Promise について
* 非同期関数を Promise 化するか、コールバックのまま処理するかということを考えます。次は Promise 化した方が確実にレスポンスが速いです。
    - https://github.com/ippei0605/qa-maintenance/blob/master/routes/stt.js#L82-L133
* こちらは Promise 化せず、コールバックで処理してます。ケースバイケースだと思います。
    - https://github.com/ippei0605/qa-maintenance/blob/master/models/watson.js#L252-L335

## おわりに
* とりあえず Cloudant、NLC、STT をメンテナンスできるレベルです。(練れてません。)
* TTS はトークンを発行する仕組みは作りましたが、クライアントアプリは対応してません。NLC に結果を読み上げるか検討中です。
