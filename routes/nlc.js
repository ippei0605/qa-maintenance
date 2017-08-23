/**
 * Q&A Maintenance: ルーティング (Natural Language Classifier 管理)
 *
 * | URL                      | Method | パラメータ                        | 処理           　               |
 * | :----------------------- | :----- | :------------------------------- |:------------------------------ |
 * | /                        | GET    |                                  | Classifier 一覧を取得する。      |
 * | /                        | POST   |                                  | Classifier を新規作成する。      |
 * | /:id/delete              | POST   |                                  | Classifier を削除する。         |
 * | /:id/classify            | GET    | text, now = yyyy年M月d日 h時m分s秒 | クラス分類する。                 |
 *
 * @module routes/nlc
 * @author Ippei SUZUKI
 */

// モジュールを読込む。
const
    express = require('express'),
    fs = require('fs'),
    multer = require('multer'),
    path = require('path'),
    watson = require('../models/watson');

// ルーターを作成する。
const router = express.Router();

// ファイルアップロードを設定する。
const upload = multer({
    "dest": "upload/"
});

// Classifier 一覧を取得する。
router.get('/', (req, res) => {
    watson.listClassifier((value) => {
        res.json(value);
    });
});

// Classifier を新規作成する。
router.post('/', upload.single('training-csv'), (req, res) => {
    watson.createClassifier({
        language: 'ja',
        name: path.basename(req.file.originalname, '.csv'),
        training_data: fs.createReadStream(req.file.path)
    }, (error, value) => {
        if (error) {
            console.log('error', error);
            res.status(error.code || 500).json(error);
        } else {
            res.json(value);
        }
    });
});

// Classifier を削除する。
router.post('/:id/delete', (req, res) => {
    watson.removeClassifier(req.params.id, (value) => {
        res.json(value);
    });
});

// クラス分類する。
router.get('/:id/classify', (req, res) => {
    watson.classify(req.params.id, req.query.text, req.query.now, (value) => {
        res.json(value);
    });
});

module.exports = router;