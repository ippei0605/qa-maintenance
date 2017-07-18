/**
 * Q&A Maintenance: モデル
 *
 * @module models/watson
 * @author Ippei SUZUKI
 */

'use strict';

// モジュールを読込む。
const context = require('../utils/context');

// データベース
const db = context.cloudant.db.use(context.DB_NAME);

// エラーオブジェクトからメッセージを取得する。
const gerErrorMessage = (err) => {
    console.log('error:', err);
    return ({
        "class_name": "",
        "message": "エラーが発生しました。" + JSON.stringify(err, undefined, 2),
        "confidence": 0
    });
};

// こんにちはを変換する。
const replaceHello = (text, replaceText) => {
    return text.replace(/こんにちは/g, replaceText);
};

// 条件により回答を確定する。
const finalAnswer = (value, now) => {
    switch (value.class_name) {
        case 'general_hello':
            let regexp = /(\d+)年(\d+)月(\d+)日 (\d+)時(\d+)分(\d+)秒/;
            let hour = parseInt(regexp.exec(now)[4]);
            if (hour >= 17) {
                value.message = replaceHello(value.message, 'こんばんは');
            } else if (hour < 11 && hour >= 5) {
                value.message = replaceHello(value.message, 'おはようございます');
            } else if (hour < 5) {
                value.message = replaceHello(value.message, 'お疲れ様です');
            }
            break;

        default:
            break;
    }
    return value;
};

// 回答を取得する。
const getAnswer = (class_name, confidence, now, callback) => {
    db.get(class_name, (err, body) => {
        if (err) {
            callback(gerErrorMessage(err));
        } else {
            callback(finalAnswer({
                "class_name": body._id,
                "message": body.message,
                "confidence": confidence
            }, now));
        }
    });
};

/** 全コンテンツを取得する。 */
const listContent = (callback) => {
    db.view('answers', 'list', (err, body) => {
        let list = [];
        body.rows.forEach((row) => {
            delete row.value._rev;
            list.push(row.value);
        });
        callback(list);
    });
};

/**
 * Classifier の一覧 (src) にステータスを付加した一覧を表示する。
 * @param res レスポンス
 * @param src Watson NLC listClassifier の結果 (classifiers)
 * @param dst ステータスを付加した結果
 */
const listStatus = (src, dst, callback) => {
    const num = dst.length;
    if (!src || num === src.length) {
        callback(dst);
    } else {
        context.nlc.status({classifier_id: src[num].classifier_id}, (err, value) => {
            if (err) {
                console.log('error', err);
                callback({});
            } else {
                dst.push(value);
                listStatus(src, dst, callback);
            }
        });
    }
};

/** 全データ (アプリケーション設定値およびコンテンツ) を取得する。 */
exports.listAll = (callback) => {
    listContent((list) => {
        db.get('app_settings', (err, doc) => {
            list.unshift({
                "_id": doc._id,
                "name": doc.name
            });
            callback(list);
        });
    });
};

/** コンテンツリストからCVS形式のトレーニングデータを作成する。*/
exports.exportCsv = (callback) => {
    listContent((list) => {
        let csv = '';
        list.forEach((doc) => {
            const questions = doc.questions;
            if (questions) {
                questions.forEach((question) => {
                    csv += '"' + question + '","' + doc._id + '"\n';
                });
            }
        });
        callback(csv);
    });
};

/** コンテンツリストから Speech to Text 用のコーパスを作成する。*/
exports.exportCorpus = (callback) => {
    listContent((list) => {
        let text = '';
        list.forEach((doc) => {
            text += '質問\n';
            if (doc.questions) {
                doc.questions.forEach((question) => {
                    text += question + '\n';
                });
            }
            text += '回答\n' + doc.message + '\n';
        });
        callback(text);
    });
};

// Watson NLC Classify の結果と、メッセージを付加したテーブルを JSON で返す。
const listAnswer = (raw, table, now, callback) => {
    const src = raw.classes, num = table.length;
    if (num === src.length) {
        callback({
            "raw": raw,
            "table": table
        });
    } else {
        getAnswer(src[num].class_name, 1, now, (value) => {
            value.confidence = src[num].confidence;
            table.push(value);
            listAnswer(raw, table, now, callback);
        });
    }
};

/** Natural Language Classifier の一覧を返す。 */
exports.listClassifier = (callback) => {
    context.nlc.list({}, (err, value) => {
        if (err) {
            console.log('error', err);
            callback({});
        } else {
            listStatus(value.classifiers, [], callback)
        }
    });
};

/**
 * Natural Language Classifier を新規作成 (トレーニング) する。
 * @param params {object} パラメータ
 * @param callback {function} コールバック
 * @see {@link https://www.ibm.com/watson/developercloud/natural-language-classifier/api/v1/?node#create_classifier}
 */
exports.createClassifier = (params, callback) => {
    context.nlc.create(params, (err, value) => {
        if (err) {
            console.log('error', err);
            callback(err);
        } else {
            callback(value);
        }
    });
};

/**
 * Natural Language Classifier を削除する。
 * @param id {string} Classifier ID
 * @param callback {function} コールバック
 */
exports.removeClassifier = (id, callback) => {
    context.nlc.remove({classifier_id: id}, (err, value) => {
        if (err) {
            console.log('error', err);
            callback(err);
        } else {
            callback(value);
        }
    });
};

/**
 * Watson NLC Classify を実行し、結果とメッセージを付加したテーブルを JSON で返す。
 * @param id {string} NLC Classifier ID
 * @param text {string} テキスト
 * @param now {string} 現在時刻 (yyyy年M月d日 h時m分s秒)
 * @param callback {function} コールバック
 */
exports.classify = (id, text, now, callback) => {
    context.nlc.classify({
        text: text,
        classifier_id: id
    }, (err, raw) => {
        if (err) {
            console.log('error', err);
            callback({
                "raw": err,
                "table": [{
                    "class_name": "Error",
                    "message": "No Data",
                    "confidence": 0
                }]
            });
        } else {
            listAnswer(raw, [], now, callback);
        }
    });
};
