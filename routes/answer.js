/**
 * Watson Diet Trainer: ルーティング (DB参照)
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

/** コンテンツを表示する。 */
router.get('/', (req, res) => {
    res.render('answer');
});

module.exports = router;