/**
 * Watson Diet Trainer: ルーティング (Speech to Text 管理)
 *
 * @module routes/stt
 * @author Ippei SUZUKI
 */

'use strict';

// モジュールを読込む。
const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const context = require('../utils/context');

// ルーターを作成する。
const router = express.Router();

/**
 * Watson Speech to Text と Text to Speech のトークンを取得して、JSON を返す。
 * @param req {object} リクエスト
 * @param res {object} レスポンス
 */
router.get('/token', (req, res) => {
    context.stt.auth.getToken((err, token) => {
        if (err) {
            console.log('error: ', err);
            res.status(500).send('Error retrieving token');
        } else {
            res.send({
                "token": token,
                "model": context.STT_MODEL
            });
        }
    });
});


// ファイルアップロードを設定する。
const upload = multer({
    "storage": multer.diskStorage({
        "destination": (req, file, cb) => {
            cb(null, 'upload/');
        },
        "filename": (req, file, cb) => {
            // 拡張子 txt が無いと SpeechToText#addCorpus でエラーになる。
            cb(null, Date.now() + '-' + file.originalname);
        }
    })
});

/** Speech to Text 管理画面を表示する。 */
router.get('/', (req, res) => {
    context.stt.obj.getCustomizations(null, (error, value) => {
        let list = {};
        if (error) {
            console.log('Error:', error);
        } else {
            list = value.customizations;
        }
        res.render('stt', {"list": list});
    });
});

/** カスタムモデルをトレーニングする。 */
router.post('/:id/train', (req, res) => {
    const params = {
        "customization_id": req.params.id
    };
    context.stt.obj.trainCustomization(params, (error, value) => {
        if (error) {
            console.log('Error:', error);
            res.json(error);
        } else {
            res.json(value);
        }
    });
});

/** カスタムモデルを作成する。 */
router.post('/', (req, res) => {
    // リクエストパラメータを取得する。
    const name = req.body.name === '' ? 'NoName' : req.body.name;
    const description = req.body.description;

    //  STT API のパラメータをセットする。
    const params = {
        "name": name,
        "base_model_name": "ja-JP_BroadbandModel",
        "description": description
    };

    // STT API を実行する。
    context.stt.obj.createCustomization(params, (error, value) => {
        if (error) {
            console.log('Error:', error);
            res.json(error);
        } else {
            res.json(value);
        }
    });
});

/** カスタムモデルを削除する。 */
router.post('/:id/delete', (req, res) => {
    const params = {
        "customization_id": req.params.id
    };

    context.stt.obj.deleteCustomization(params, (error, value) => {
        if (error) {
            console.log('Error:', error);
            res.json(error);
        } else {
            res.json(value);
        }
    });
});

/** カスタムモデルを表示する。 */
router.get('/:id', (req, res) => {
    const params = {
        "customization_id": req.params.id
    };

    context.stt.obj.getCustomization(params, (error, model) => {
        if (error) {
            console.log('Error:', error);
            res.json(error);
        } else {
            context.stt.obj.getCorpora(params, (error, corpora) => {
                if (error) {
                    console.log('Error:', error);
                    res.json(error);
                } else {
                    context.stt.obj.getWords(params, function (error, word) {
                        if (error) {
                            console.log('Error:', error);
                            res.json(error);
                        } else {
                            res.json({
                                "model": model,
                                "corpora": corpora,
                                "word": word
                            });
                        }
                    });
                }
            });
        }
    });
});

/** コーパスを追加する。 */
router.post('/:id/corpus', upload.single('corpus-txt'), (req, res) => {
    const params = {
        "customization_id": req.params.id,
        "name": path.basename(req.file.originalname, '.txt'),
        "corpus": fs.createReadStream(req.file.path)
    };

    context.stt.obj.addCorpus(params, (error, value) => {
        if (error) {
            console.log('Error:', error);
            res.json(error);
        } else {
            res.json(value);
        }
    });
});

/** コーパスを削除する。 */
router.post('/:id/corpus/:name/delete', (req, res) => {
    const params = {
        "customization_id": req.params.id,
        "name": req.params.name
    };

    context.stt.obj.deleteCorpus(params, (error, value) => {
        if (error) {
            console.log('Error:', error);
            res.json(error);
        } else {
            res.json(value);
        }
    });
});

module.exports = router;