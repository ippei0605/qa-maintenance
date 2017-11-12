/**
 * Q&A Maintenance: ルーティング
 *
 * | URL                      | Method | パラメータ             | 処理           　               |
 * | :----------------------- | :----- | :-------------------- |:------------------------------ |
 * | /login                   | POST   | username, password    | Bluemix にログインする。         |
 * | /export-answer           | GET    |                       | コンテンツを表示する。            |
 * | /export-training-csv     | GET    |                       | NLC トレーニングデータを表示する。 |
 * | /export-corpus           | GET    |                       | STT コーパスを表示する。          |
 *
 * @module routes/index
 * @author Ippei SUZUKI
 */

'use strict';

// モジュールを読込む。
const
    express = require('express'),
    fs = require('fs'),
    multer = require('multer'),
    request = require('request'),
    watson = require('../models/watson');


// ルーターを作成する。
const router = express.Router();

// ファイルアップロードを設定する。
const upload = multer({
    "dest": "upload/"
});

// Bluemix にログインする。
router.post('/login', (req, res) => {
    const login = {
        "url": 'https://login.eu-gb.bluemix.net/UAALoginServerWAR/oauth/token',
        "method": "POST",
        "form": {
            "grant_type": "password",
            "username": req.body.username,
            "password": req.body.password
        },
        "headers": {
            "Authorization": "Basic Y2Y6",
            "Accept": "application/json"
        }
    };
    request(login, (error, response, body) => {
        if (response.statusCode === 200) {
            res.send(body);
        } else {
            console.log('error', body);
            res.status(response.statusCode).send(body);

        }
    });
});

// 回答データを登録する。
router.post('/delete-insert-answer', upload.single('answer-json'), (req, res) => {
    fs.readFile(req.file.path, (error, value) => {
        if (error) {
            console.log('error:', error);
            res.status(500).json(value);
        } else {
            try {
                const data = JSON.parse(value.toString());
                watson.deleteInsertAnswer(data, (value) => {
                    res.json(value);
                });
            } catch (e) {
                console.log('error:', e);
                res.status(500).json(e);
            }
        }
    });
});

// コンテンツを表示する。
router.get('/export-answer', (req, res) => {
    watson.listAll((value) => {
        res.send(JSON.stringify({"docs": value}, undefined, 2));
    });
});

// NLC トレーニングデータを表示する。
router.get('/export-training-csv', (req, res) => {
    watson.exportCsv((csv) => {
        res.send(csv);
    });
});

// STT コーパスを表示する。
router.get('/export-corpus', (req, res) => {
    watson.exportCorpus((text) => {
        res.send(text);
    });
});

module.exports = router;