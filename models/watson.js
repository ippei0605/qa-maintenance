/**
 * Q&A Maintenance: モデル
 *
 * @module models/watson
 * @author Ippei SUZUKI
 */

'use strict';

// モジュールを読込む。
const
    Cloudant = require('cloudant'),
    watson = require('watson-developer-cloud'),
    context = require('../utils/context');

// Natural Language Classifier
const nlc = new watson.NaturalLanguageClassifierV1(context.nlcCreds);

// データベース
const cloudant = new Cloudant(context.cloudantCreds.url);
const db = cloudant.db.use(context.DB_NAME);

// こんにちはを変換する。
const replaceHello = (text, replaceText) => {
    return text.replace(/こんにちは/g, replaceText);
};

// 条件により回答を確定する。
const modifyAnswer = (value, now) => {
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

// 全コンテンツを取得する。
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
 * コンテンツ
 * @typedef content
 * @property {string} _id 文書ID
 * @property {string} message メッセージ
 * @property {string[]} questions 質問
 * @property {object} option オプション情報
 */

/**
 * アプリケーション設定
 * @typedef appSettings
 * @property {string} _id 文書ID (固定値 app_settings)
 * @property {string} name 名前
 */

/**
 * コールバックする。
 * @callback listAllCallback
 * @param {appSettings|content[]} list 全データ
 */

/**
 * 全データ (アプリケーション設定値およびコンテンツ) を取得する。
 * @param callback {listAllCallback} コールバック
 */
exports.listAll = (callback) => {
    listContent((list) => {
        db.get('app_settings', (error, doc) => {
            if (!error) {
                list.unshift({
                    "_id": doc._id,
                    "name": doc.name
                });
            }
            callback(list);
        });
    });
};

/**
 * コンテンツリストからCVS形式のトレーニングデータを作成する。
 * @param callback
 */
exports.exportCsv = (callback) => {
    listContent((list) => {
        let csv = '';
        list.forEach((doc) => {
            const questions = doc.questions ? doc.questions : [];
            questions.forEach((question) => {
                csv += `"${question}","${doc._id}"\n`;
            });
        });
        callback(csv);
    });
};

/**
 * コンテンツリストから Speech to Text 用のコーパスを作成する。
 * @param callback
 */
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


exports.deleteInsertAnswer = (data, callback) => {
    return new Promise((resolve, reject) => {
        db.view('answers', 'list', (error, body) => {
            if (error) {
                console.log('error:', error);
                reject(error);
            } else {
                const deleteList = body.rows.map((row) => {
                    return {
                        "_id": row.value._id,
                        "_rev": row.value._rev,
                        "_deleted": true
                    };
                });
                resolve(deleteList);
            }
        });
    }).then((deleteList) => {
        return new Promise((resolve, reject) => {
            db.get('app_settings', (error, doc) => {
                if (error) {
                    console.log('error:', error);
                } else {
                    deleteList.unshift({
                        "_id": doc._id,
                        "_rev": doc._rev,
                        "_deleted": true
                    });
                }
                resolve(deleteList);
            });
        });
    }).then((deleteList) => {
        if (deleteList) {
            return new Promise((resolve, reject) => {
                db.bulk({"docs": deleteList}, (error, body) => {
                    if (error) {
                        console.log('error:', error);
                    }
                    resolve(body);
                });
            });
        } else {
            return deleteList
        }
    }).then((value) => {
        return new Promise((resolve, reject) => {
            db.bulk(data, (error, body) => {
                if (error) {
                    console.log('error:', error);
                    reject(error);
                } else {
                    resolve(body);
                }
            });
        });
    }).then((value) => {
        callback(value);
    }).catch((error) => {
        callback(error);
    });
};

/** Natural Language Classifier の一覧を返す。 */
exports.listClassifier = (callback) => {
    nlc.list({}, (error, value) => {
        if (error) {
            console.log('error', error);
            callback({});
        } else {
            Promise.all(value.classifiers.map((classifier) => {
                return new Promise((resolve, reject) => {
                    nlc.status({classifier_id: classifier.classifier_id}, (error, status) => {
                        if (error) {
                            console.log('error:', error);
                            reject(error);
                        } else {
                            resolve(status);
                        }
                    });
                });
            })).then((classifiers) => {
                callback(classifiers);
            });
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
    nlc.create(params, callback);
};

/**
 * Natural Language Classifier を削除する。
 * @param id {string} Classifier ID
 * @param callback {function} コールバック
 */
exports.removeClassifier = (id, callback) => {
    nlc.remove({classifier_id: id}, (err, value) => {
        if (err) {
            console.log('error', err);
            callback(err);
        } else {
            callback(value);
        }
    });
};

/**
 * コールバックする。
 * @callback classifyCallback
 * @param {object} 結果
 * @property {object} raw 結果 JSON
 * @property {object} table 結果テーブル
 */

/**
 * Watson NLC Classify を実行し、結果とメッセージを付加したテーブルを JSON で返す。
 * @param id {string} NLC Classifier ID
 * @param text {string} テキスト
 * @param now {string} 現在時刻 (yyyy年M月d日 h時m分s秒)
 * @param callback {classifyCallback} コールバック
 */
exports.classify = (id, text, now, callback) => {
    nlc.classify({
        text: text,
        classifier_id: id
    }, (error, value) => {
        if (error) {
            console.log('error', error);
            callback({
                "raw": error,
                "table": [{
                    "class_name": "Error",
                    "message": "No Data",
                    "confidence": 0
                }]
            });
        } else {
            const classes = value.classes;
            const keys = classes.map((item) => {
                return item.class_name;
            });
            db.view('answers', 'list', {
                "keys": keys
            }, (error, body) => {
                if (error) {
                    callback({
                        "raw": value,
                        "table": [{
                            "class_name": "Error",
                            "message": "No Data",
                            "confidence": 0
                        }]
                    });
                } else {
                    let i = 0;
                    const tables = classes.map((item) => {
                        let message = 'Not Found';
                        if (item.class_name === body.rows[i].id) {
                            message = body.rows[i++].value.message;
                        }
                        return modifyAnswer({
                            "class_name": item.class_name,
                            "message": message,
                            "confidence": item.confidence
                        }, now);
                    });
                    callback({
                        "raw": value,
                        "table": tables
                    });
                }
            });
        }
    });
};
