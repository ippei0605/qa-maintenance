/**
 * Q&A Maintenance: ルーティング (Text to Speech)
 *
 * | URL                      | Method | パラメータ             | 処理           　               |
 * | :----------------------- | :----- | :-------------------- |:------------------------------ |
 * | /token                   | GET    |                       | 音声認識のためのトークンを取得する。|
 *
 * @module routes/stt
 * @author Ippei SUZUKI
 */

'use strict';

// モジュールを読込む。
const
    express = require('express'),
    watson = require('watson-developer-cloud'),
    context = require('../utils/context');

// Watson Speech to Text
const auth = new watson.AuthorizationV1(context.ttsCreds);

// ルーターを作成する。
const router = express.Router();

// Watson Text to Speech のトークンを取得する。
// https://www.npmjs.com/package/watson-developer-cloud#authorization
router.get('/token', (req, res) => {
    auth.getToken((error, token) => {
        if (error) {
            console.log('error:', error);
            res.status(500).send('Error retrieving token');
        } else {
            res.json({
                "token": token,
                "voice": context.TTS_VOICE
            });
        }
    });
});

module.exports = router;