/**
 * Q&A Maintenance: ルーティング (Text to Speech)
 *
 * | URL                      | Method | パラメータ             | 処理           　               |
 * | :----------------------- | :----- | :-------------------- |:------------------------------ |
 * | /                        | GET    |                       | カスタムモデル一覧を取得する。     |
 * | /                        | POST   |                       | カスタムモデルを作成する。        |
 * | /token                   | GET    |                       | 音声認識のためのトークンを取得する。|
 * | /:id                     | GET    |                       | カスタムモデル情報を取得する。     |
 * | /:id                     | POST   |                       | カスタムモデルを更新する。        |
 * | /:id/delete              | POST   |                       | カスタムモデルを削除する。        |
 *
 * @module routes/stt
 * @author Ippei SUZUKI
 */

'use strict';

// モジュールを読込む。
const
    express = require('express'),
    fs = require('fs'),
    multer = require('multer'),
    path = require('path'),
    watson = require('watson-developer-cloud'),
    context = require('../utils/context');

// Watson Text to Speech
const
    tts = new watson.TextToSpeechV1(context.ttsCreds),
    auth = new watson.AuthorizationV1(context.ttsCreds);

// ルーターを作成する。
const router = express.Router();

// エラー
const sendError = (res, error) => {
    console.log('error:', error);
    res.status(500).send(error);
};

// Watson Text to Speech のトークンを取得する。
// https://www.npmjs.com/package/watson-developer-cloud#authorization
router.get('/token', (req, res) => {
    auth.getToken((error, token) => {
        if (error) {
            sendError(res, 'Error retrieving token');
        } else {
            res.json({
                "token": token,
                "voice": context.TTS_VOICE
            });
        }
    });
});

// カスタムモデル一覧を取得する。
// https://www.ibm.com/watson/developercloud/text-to-speech/api/v1/#list_voice_models
router.get('/', (req, res) => {
    tts.getCustomizations({}, (error, value) => {
        if (error) {
            sendError(res, error);
        } else {
            res.json(value);
        }
    });
});

// カスタムモデルを作成する。
// https://www.ibm.com/watson/developercloud/text-to-speech/api/v1/#create_voice_model
router.post('/', (req, res) => {
    tts.createCustomization({
        "name": req.body.name ? req.body.name : 'NoName',
        "language": req.body.language ? req.body.language : 'ja-JP',
        "description": req.body.description
    }, (error, value) => {
        if (error) {
            sendError(res, error);
        } else {
            res.json(value);
        }
    });
});

router.get('/:id', (req, res) => {
    tts.getCustomization({
        "customization_id": req.params.id
    }, (error, value) => {
        if (error) {
            sendError(res, error);
        } else {
            res.json(value);
        }
    });
});

// ファイルアップロードを設定する。
// ファイルアップロードを設定する。
const upload = multer({
    "dest": "upload/"
});

// カスタムモデルを更新する。
router.post('/:id/update', upload.single('word-json'), (req, res) => {
    fs.readFile(req.file.path, 'utf8', (error, text) => {
        if (error) {
            sendError(res, error);
        } else {
            try {
                const json = JSON.parse(text);
                const params = {
                    customization_id: req.params.id,
                    name: req.body.name,
                    description: req.body.description,
                    words: json
                };
                tts.updateCustomization(params, (error) => {
                    if (error) {
                        sendError(res, error);
                    } else {
                        res.json({});
                    }
                });
            } catch (e) {
                sendError(res, e);
            }
        }
    });
});

// カスタムモデルを削除する。
router.post('/:id/delete', (req, res) => {
    tts.deleteCustomization({
        "customization_id": req.params.id
    }, (error) => {
        if (error) {
            sendError(res, error);
        } else {
            res.json({});
        }
    });
});

module.exports = router;