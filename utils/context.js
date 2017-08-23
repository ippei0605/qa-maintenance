/**
 * Q&A Maintenance: コンテキスト
 *
 * @module utils/context
 * @author Ippei SUZUKI
 */

'use strict';

// モジュールを読込む。
const
    cfenv = require('cfenv'),
    vcapServices = require('vcap_services');

// データベース名を設定する。
const DB_NAME = 'answer';

// Watson Speech to Text モデル名を設定する。
const STT_MODEL = 'ja-JP_BroadbandModel';

// Watson Text to Speech ボイス名を設定する。
const TTS_VOICE = "ja-JP_EmiVoice";

// 環境変数を取得する。
const appEnv = cfenv.getAppEnv();

/**
 * コンテキスト
 * @property {object} appEnv 環境変数
 * @property {string} DB_NAME データベース名
 * @property {string} STT_MODEL Watson Speech to Text モデル名
 * @property {string} TTS_VOICE Watson Speech to Text ボイス名
 * @property {object} cloudantCreds Cloudant NoSQL DB サービス資格情報
 * @property {object} nlcCreds Watson Natural Language Classifier サービス資格情報
 * @property {object} sttCreds Watson Speech to Text サービス資格情報
 * @property {object} ttsCreds Watson Text to Speech サービス資格情報
 *
 * @type {{appEnv, DB_NAME: string, STT_MODEL: string, TTS_VOICE: string, cloudantCreds: Object, nlcCreds: Object, sttCreds: Object, ttsCreds: Object}}
 */
module.exports = {
    "appEnv": appEnv,
    "DB_NAME": DB_NAME,
    "STT_MODEL": STT_MODEL,
    "TTS_VOICE": TTS_VOICE,
    "cloudantCreds": vcapServices.getCredentials('cloudantNoSQLDB'),
    "nlcCreds": vcapServices.getCredentials('natural_language_classifier'),
    "sttCreds": vcapServices.getCredentials('speech_to_text'),
    "ttsCreds": vcapServices.getCredentials('text_to_speech')
};
