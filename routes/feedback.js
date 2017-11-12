/**
 * Q&A Maintenance: ルーティング (Feedback Log 管理)
 *
 * | URL                      | Method | パラメータ             | 処理           　               |
 * | :----------------------- | :----- | :-------------------- |:------------------------------ |
 * | /                        | GET    |                       | フィードバックログを取得する。     |
 * | /:id/delete              | POST   |                       | フィードバックログレコードを削除する。|
 * *
 * @module routes/feedback
 * @author Ippei SUZUKI
 */

'use strict';

// モジュールを読込む。
const
    express = require('express'),
    context = require('../utils/context'),
    fbLog = require('../models/feedback-log');

// ルーターを作成する。
const router = express.Router();

// フィードバックログを表示する。
router.get('/', (req, res) => {
    fbLog.view('objects', 'list')
        .then((value) => {
            res.send(value.rows);
        })
        .catch((error) => {
            console.log('error:', error);
            res.sendStatus(500);
        });
});

// フィードバックログレコードを削除する。
router.post('/:id/delete', (req, res) => {
    fbLog.destroy(req.params.id, req.body.rev)
        .then((value) => {
            res.send(value);
        })
        .catch((error) => {
            console.log('error:', error);
            res.sendStatus(500);
        });
});

module.exports = router;