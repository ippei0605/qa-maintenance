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

/**
 * Classifier の一覧 (src) にステータスを付加した一覧を表示する。
 * @param res レスポンス
 * @param src Watson NLC listClassifier の結果 (classifiers)
 * @param dst ステータスを付加した結果
 */
const listStatus = (res, src, dst) => {
    const num = dst.length;
    if (num === src.length) {
        res.render('classifier', {list: dst});
    } else {
        watson.statusClassifier(src[num].classifier_id, (value) => {
            dst.push(value);
            listStatus(res, src, dst);
        });
    }
};

/**
 * Watson NLC Classify の結果と、メッセージを付加したテーブルを JSON で返す。
 * @param res レスポンス
 * @param raw Watson NLC Classify の結果
 * @param table メッセージを付加したテーブル
 * @param now 現在時刻
 */
const listAnswer = (res, raw, table, now) => {
    const src = raw.classes, num = table.length;
    console.log('length', src.length);
    if (num === src.length) {
        res.json({
            "raw": raw,
            "table": table
        });
    } else {
        watson.askClassName(src[num].class_name, now, (value) => {
            value.confidence = src[num].confidence;
            table.push(value);
            listAnswer(res, raw, table, now);
        });
    }
};

/** Classifier を表示する。 */
router.get('/', (req, res) => {
    watson.listClassifier((value) => {
        listStatus(res, value.classifiers, []);
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