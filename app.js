/**
 * @file Q&A Maintenance: アプリ
 * @author Ippei SUZUKI
 */

'use strict';

// モジュールを読込む。
const
    bodyParser = require('body-parser'),
    express = require('express'),
    logger = require('morgan'),
    path = require('path'),
    favicon = require('serve-favicon'),
    context = require('./utils/context');

// アプリケーションを作成する。
const app = express();

// ミドルウェアを設定する。
app.use('/', express.static(__dirname + '/public'));
app.use(logger('dev'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(favicon(__dirname + '/public/favicon.ico'));

// production モード でなければ、CORS * に設定する。
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });
}

// ルートを設定する。
app.use('/', require('./routes'));
app.use('/nlc', require('./routes/nlc'));
app.use('/stt', require('./routes/stt'));
app.use('/tts', require('./routes/tts'));

// リクエトを受付ける。
app.listen(context.appEnv.port, function () {
    console.log('server starting on ' + context.appEnv.url);
});