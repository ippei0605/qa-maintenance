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

// ルーターを作成する。
const router = express.Router();

// Home 画面を表示する。
router.get('/', (req, res) => {
    res.render('index');
});

/** コンテンツを表示する。 */
router.get('/export-content', (req, res) => {
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