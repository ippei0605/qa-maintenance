/**
 * Q&A メンテナンス: コンテキスト
 *
 * @module utils/context
 * @author Ippei SUZUKI
 */

'use strict';

// モジュールを読込む。
const cfenv = require('cfenv');
const cloudant = require('cloudant');
const vcapServices = require('vcap_services');
const watson = require('watson-developer-cloud');

// データベース名を設定する。
const DB_NAME = 'answer';

// Watson Speech to Text モデル名を設定する。
const STT_MODEL = 'ja-JP_BroadbandModel';

// 環境変数を取得する。
const appEnv = cfenv.getAppEnv();

// サービスを取得する。
const getService = (serviceName) => {
    // サービス接続情報を取得する。
    const creds = vcapServices.getCredentials(serviceName);
    switch (serviceName) {
        case 'cloudantNoSQLDB':
            // Cloudant NoSQL DB に接続する。
            // https://github.com/cloudant/nodejs-cloudant#api-reference
            return cloudant(creds.url);
        case 'natural_language_classifier':
            // Watson Natural Language Classifier に接続する。
            // https://github.com/watson-developer-cloud/node-sdk#natural-language-classifier
            return new watson.NaturalLanguageClassifierV1(creds);
        case 'speech_to_text':
            // Watson Speech to Text および認証サービスに接続する。
            // https://github.com/watson-developer-cloud/node-sdk#speech-to-text
            // https://github.com/watson-developer-cloud/node-sdk#authorization
            return {
                "obj": new watson.SpeechToTextV1(creds),
                "auth": new watson.AuthorizationV1(creds)
            };
        case 'text_to_speech':
            // Watson 認証サービスに接続する。
            // https://github.com/watson-developer-cloud/node-sdk#authorization
            return new watson.AuthorizationV1(creds);
        default:
            return;
    }
};

/**
 * コンテキスト
 * @property {object} appEnv 環境変数
 * @property {string} DB_NAME データベース名
 * @property {object} DEFAULT_APP_SETTINGS デフォルトのアプリケーション設定
 * @property {string} STT_MODEL Watson Speech to Text
 * @property {object} cloudant Cloudant NoSQL DB
 * @property {object} nlc Watson Natural Language Classifier
 * @property {object} stt.obj Watson Speech to Text
 * @property {object} stt.auth Watson Speech to Text 認証サービス
 *
 * @type {{appEnv, DB_NAME: string, STT_MODEL: string, cloudant, nlc, stt: {obj, auth}}}
 */
module.exports = {
    "appEnv": appEnv,
    "DB_NAME": DB_NAME,
    "STT_MODEL": STT_MODEL,
    "cloudant": getService('cloudantNoSQLDB'),
    "nlc": getService('natural_language_classifier'),
    "stt": getService('speech_to_text')
};