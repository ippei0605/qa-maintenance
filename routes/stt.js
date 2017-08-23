/**
 * Q&A Maintenance: ルーティング (Speech to Text 管理)
 *
 * | URL                      | Method | パラメータ             | 処理           　               |
 * | :----------------------- | :----- | :-------------------- |:------------------------------ |
 * | /                        | GET    |                       | カスタムモデル一覧を取得する。     |
 * | /                        | POST   |                       | カスタムモデルを作成する。        |
 * | /token                   | GET    |                       | 音声認識のためのトークンを取得する。|
 * | /:id                     | GET    |                       | カスタムモデル情報を取得する。     |
 * | /:id/train               | POST   |                       | カスタムモデルをトレーニングする。 |
 * | /:id/delete              | POST   |                       | カスタムモデルを削除する。        |
 * | /:id/corpus              | POST   | req.file (corpus-txt) | コーパスを追加する。             |
 * | /:id/corpus/:name/delete | POST   |                       | コーパスを削除する。             |
 * | /:id/word                | POST   | req.file (word-json)  | ワードを追加する。               |
 * | /:id/word/:word/delete   | POST   |                       | ワードを削除する。               |
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

// Watson Speech to Text
const
    stt = new watson.SpeechToTextV1(context.sttCreds),
    auth = new watson.AuthorizationV1(context.sttCreds);

// ルーターを作成する。
const router = express.Router();

// Watson Speech to Text のトークンを取得する。
// https://www.npmjs.com/package/watson-developer-cloud#authorization
router.get('/token', (req, res) => {
    auth.getToken((error, token) => {
        if (error) {
            console.log('error:', error);
            res.status(500).send('Error retrieving token');
        } else {
            res.json({
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

// カスタムモデル一覧を取得する。
// https://www.ibm.com/watson/developercloud/speech-to-text/api/v1/?node#list_models
router.get('/', (req, res) => {
    stt.getCustomizations({}, (error, value) => {
        if (error) {
            console.log('error:', error);
            res.status(500).json(error)
        } else {
            res.json(value);
        }
    });
});

// カスタムモデル情報を取得する。
// https://www.ibm.com/watson/developercloud/speech-to-text/api/v1/?node#list_model
// https://www.ibm.com/watson/developercloud/speech-to-text/api/v1/?node#list_corpora
// https://www.ibm.com/watson/developercloud/speech-to-text/api/v1/?node#list_words
router.get('/:id', (req, res) => {
    const modelPromise = new Promise((resolve, reject) => {
        stt.getCustomization({
            "customization_id": req.params.id
        }, (error, value) => {
            if (error) {
                console.log('error:', error);
                reject(error);
            } else {
                resolve(value);
            }
        });
    });
    const corporaPromise = new Promise((resolve, reject) => {
        stt.getCorpora({
            "customization_id": req.params.id
        }, (error, value) => {
            if (error) {
                console.log('error:', error);
                reject(error);
            } else {
                resolve(value.corpora);
            }
        });
    });
    const wordPromise = new Promise((resolve, reject) => {
        stt.getWords({
            "customization_id": req.params.id,
            "sort": "+alphabetical",
            "word_type": "all"
        }, (error, value) => {
            if (error) {
                console.log('error:', error);
            } else {
                resolve(value.words);
            }
        });
    });
    Promise.all([modelPromise, corporaPromise, wordPromise]).then((value) => {
        res.json({
            "model": value[0],
            "corpora": value[1],
            "word": value[2]
        });
    }).catch((error) => {
        res.status(500).json(error);
    });
});

// カスタムモデルをトレーニングする。
// https://www.ibm.com/watson/developercloud/speech-to-text/api/v1/?node#train_model
router.post('/:id/train', (req, res) => {
    stt.trainCustomization({
        customization_id: req.params.id
    }, (error, value) => {
        if (error) {
            console.log('error:', error);
            res.status(500).json(error);
        } else {
            res.json(value);
        }
    });
});

// カスタムモデルを作成する。
// https://www.ibm.com/watson/developercloud/speech-to-text/api/v1/?node#create_model
router.post('/', (req, res) => {
    stt.createCustomization({
        "name": req.body.name ? req.body.name : 'NoName',
        "base_model_name": 'ja-JP_BroadbandModel',
        "description": req.body.description
    }, (error, value) => {
        if (error) {
            console.log('error:', error);
            res.status(500).json(error);
        } else {
            res.json(value);
        }
    });
});

// カスタムモデルを削除する。
router.post('/:id/delete', (req, res) => {
    stt.deleteCustomization({
        "customization_id": req.params.id
    }, (error, value) => {
        if (error) {
            console.log('error:', error);
            res.status(500).json(error);
        } else {
            res.json(value);
        }
    });
});

/**
 * @typedef {Object} req.file
 * @property {string} fieldname
 * @property {string} originalname
 * @property {string} encoding
 * @property {string} mimetype
 * @property {string} destination
 * @property {string} filename
 * @property {string} path
 * @property {number} size
 */

// コーパスを追加する。
// https://www.ibm.com/watson/developercloud/speech-to-text/api/v1/?node#add_corpus
router.post('/:id/corpus', upload.single('corpus-txt'), (req, res) => {
    stt.addCorpus({
        "customization_id": req.params.id,
        "name": path.basename(req.file.originalname, '.txt'),
        "corpus": fs.createReadStream(req.file.path)
    }, (error, value) => {
        if (error) {
            console.log('error:', error);
            res.status(500).json(error);
        } else {
            res.json(value);
        }
    });
});

// コーパスを削除する。
// https://www.ibm.com/watson/developercloud/speech-to-text/api/v1/?node#delete_corpus
router.post('/:id/corpus/:name/delete', (req, res) => {
    stt.deleteCorpus({
        "customization_id": req.params.id,
        "name": req.params.name
    }, (error, value) => {
        if (error) {
            console.log('error:', error);
            res.status(500).json(error);
        } else {
            res.json(value);
        }
    });
});

// ワードを追加する。
// https://www.ibm.com/watson/developercloud/speech-to-text/api/v1/?node#add_words
router.post('/:id/word', upload.single('word-json'), (req, res) => {
    try {
        fs.readFile(req.file.path, 'utf8', (error, value) => {
            if (error) {
                console.log('error:', error);
                res.status(500).json(error);
            } else {
                const words = JSON.parse(value.toString());
                stt.addWords({
                    "customization_id": req.params.id,
                    "words": words
                }, (error, value) => {
                    if (error) {
                        console.log('error:', error);
                        res.status(500).json(error);
                    } else {
                        res.json(value);
                    }
                });
            }
        });
    } catch (e) {
        console.log("error", e);
        res.status(500).json(e);
    }
});

// ワードを削除する。
// https://www.ibm.com/watson/developercloud/speech-to-text/api/v1/?node#delete_word
router.post('/:id/word/:word/delete', (req, res) => {
    stt.deleteWord({
        "customization_id": req.params.id,
        "word": req.params.word
    }, (error, value) => {
        if (error) {
            console.log('error:', error);
            res.status(500).json(error);
        } else {
            res.json(value);
        }
    });
});

module.exports = router;