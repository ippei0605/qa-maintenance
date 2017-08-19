/**
 * Q&A Maintenance: ルーティング
 *
 * @module routes/index
 * @author Ippei SUZUKI
 */

'use strict';

// モジュールを読込む。
const express = require('express');
const watson = require('../models/watson');
const request = require('request');

// ルーターを作成する。
const router = express.Router();

// TODO
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

/** コンテンツを表示する。 */
router.get('/export-answer', (req, res) => {
    watson.listAll((value) => {
        res.send(JSON.stringify({"docs": value}, undefined, 2));
    });
});

/** トレーニングデータを表示する。 */
router.get('/export-training-csv', (req, res) => {
    watson.exportCsv((csv) => {
        res.send(csv);
    });
});

/** トレーニングデータを表示する。 */
router.get('/export-corpus', (req, res) => {
    watson.exportCorpus((text) => {
        res.send(text);
    });
});

module.exports = router;