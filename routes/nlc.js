/**
 * Q&A Maintenance: ルーティング (Natural Language Classifier 管理)
 *
 * @module routes/index
 * @author Ippei SUZUKI
 */

'use strict';

// モジュールを読込む。
const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const watson = require('../models/watson');

// ルーターを作成する。
const router = express.Router();

// ファイルアップロードを設定する。
const upload = multer({
    "dest": "upload/"
});

/**  Natural Language Classifier 管理画面を表示する。 */
router.get('/', (req, res) => {
    watson.listClassifier((value) => {
        res.render('nlc', {"list": value});
    });
});

/** Classifier を新規作成する。 */
router.post('/', upload.single('training-csv'), (req, res) => {
    watson.createClassifier({
        language: 'ja',
        name: path.basename(req.file.originalname, '.csv'),
        training_data: fs.createReadStream(req.file.path)
    }, (value) => {
        res.json(value);
    });
});

/** Classifier を削除する。 */
router.post('/:id/delete', (req, res) => {
    watson.removeClassifier(req.params.id, (value) => {
        res.json(value);
    });
});

/** Classify */
router.get('/:id/classify', (req, res) => {
    watson.classify(req.params.id, req.query.text, req.query.now, (value) => {
        res.json(value);
    });
});

module.exports = router;