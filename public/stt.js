/**
 * Q&A Maintenance: Speech to Text クライアント JavaScript
 *
 * @author Ippei SUZUKI
 */

'use strict';

// DOM 読込み完了時の処理
$(function () {
    // ID セレクターを取得する。
    const
        homeBtnId = $('#homeBtnId'),
        okBtnId = $('#okBtnId'),
        resultModalMessageId = $('#resultModalMessageId'),
        sttStartId = $('#sttStartId'),
        sttStopId = $('#sttStopId'),
        trainBtnId = $('#trainBtnId'),
        deleteModelBtnId = $('#deleteModelBtnId'),
        resultId = $('#resultId'),
        corporaCloseBtnId = $('#corpusCloseBtnId'),
        corporaResultId = $('#corporaResultId'),
        wordCloseBtnId = $('#wordCloseBtnId'),
        wordResultId = $('#wordResultId');

    // グローバル変数を定義する。
    let
        isChange = false,       // モデルの変更状態: true=変更あり、false=変更なし (但し、モデル追加と削除はfalseとする。)
        stream = null;          // マイクのストリーム

    // 音声認識および停止ボタンの表示を制御する。
    // true = 認識ボタン: 非表示, 停止ボタン: 表示
    // false = 認識ボタン: 表示, 停止ボタン: 非表示
    function visibleRecoredingButton(flg) {
        sttStartId.prop('disabled', flg);
        sttStopId.prop('disabled', !flg);
    }

    // カスタムモデルのトレーニングおよび削除ボタンの表示を制御する。
    // 音声認識および停止ボタンの表示を制御する。
    // true = トレーニングボタン: 表示, 削除ボタン: 表示
    // false = トレーニングボタン: 非表示, 削除ボタン: 非表示
    function visibleOperateModelButton(flg) {
        trainBtnId.prop('disabled', !flg);
        deleteModelBtnId.prop('disabled', !flg);
    }

    // Watson Gif アニメ を制御する。 [isStart = true: 実行, false: 削除]
    function anime(isStart) {
        const loadingViewId = $('#loading-view');
        if (isStart) {
            if (!loadingViewId.length) {
                $('body').append('<div id="loading-view" />');
            }
        } else {
            if (loadingViewId.length) {
                loadingViewId.remove();
            }
        }
    }

    // 音声認識を開始する。
    sttStartId.on('click', function () {
        visibleRecoredingButton(true);

        // Watson Speech to text と Text to Speech を使用するための情報を取得する。
        $.ajax({
            type: "GET",
            url: "/stt/token"
        }).done(function (value) {
            let param = {
                "token": value.token,
                "model": value.model,
                "outputElement": "#outputId" // CSS selector or DOM Element
            };

            // カスタムモデルを指定する。
            const id = $('input[name=modelRadio]:checked').val();
            if (id !== 'default') {
                param.customization_id = id;
            }

            // Speech to Text を呼び出す。
            stream = WatsonSpeech.SpeechToText.recognizeMicrophone(param);

            stream.on('error', function (err) {
                console.log(err);
                $('#outputId').append('<p class="text-danger">' + err + '</p>');
            });
        }).fail(function (value) {
            console.log("error: ", value);
            resultId.html('<h3>Error</h3><pre>' + JSON.stringify(value, undefined, 2) + '</pre>');
        }).always(function (value) {
        });
    });

    // 音声認識を停止する。
    sttStopId.on('click', function () {
        visibleRecoredingButton(false);
        if (stream) {
            stream.stop();
        }
    });

    // モデル情報を表示する。
    function viewModel() {
        const id = $('[name=modelRadio]:checked').val();
        if (id === 'default') {
            visibleOperateModelButton(false);
            resultId.html('');
        } else {
            // モデル情報を取得する。
            anime(true);
            $.ajax({
                "type": "GET",
                "url": "/stt/" + id
            }).done(function (value) {
            }).fail(function (value) {
                console.log("error: ", value);
            }).always(function (value) {
                anime(false);
                // モデル情報のタグを作成する。
                const model = value.model;
                $('input[name=modelRadio]:checked').parents('tr').children('td:eq(4)').text(model.status);
                const modelTag = '<h3><span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span> Model <small>(Can not configure)</small></h3><pre>' + JSON.stringify(model, undefined, 2) + '</pre>';

                // コーパス情報のタグを作成する。
                const corpora = value.corpora;
                const corporaTag = '<a href="#" id="corporaBtnId"><h3><span class="glyphicon glyphicon-cog" aria-hidden="true"></span> Corpora</h3></a><pre>' + JSON.stringify(corpora, undefined, 2) + '</pre>';

                // ワード情報のタグを作成する。
                const word = value.word;
                const wordTag = '<a href="#" id="wordBtnId"><h3><span class="glyphicon glyphicon-cog" aria-hidden="true"></span> Word</h3></a><pre>' + JSON.stringify(word, undefined, 2) + '</pre>';

                // モデル、コーパス、ワード情報を表示する。
                resultId.html(
                    modelTag + '<div class="row"><div class="col-md-6">' +
                    corporaTag + '</div><div class="col-md-6">' + wordTag + '</div></div>'
                );
                visibleOperateModelButton(true);

                // コーパス削除用のドロップダウンを作成する。
                let deleteCorpusSelectTag = '';
                corpora.forEach(function (row) {
                    const name = row.name;
                    deleteCorpusSelectTag += '<option value="' + name + '">' + name + '</option>';
                });
                $('#deleteCorpusSelectId').html(deleteCorpusSelectTag);

                // ワード削除用のドロップダウンを作成する。
                let deleteWordSelectTag = '';
                word.forEach(function (row) {
                    const word = row.word;
                    deleteWordSelectTag += '<option value="' + word + '">' + word + '</option>';
                });
                $('#deleteWordSelectId').html(deleteWordSelectTag);
            });
        }
    }

    // カスタムモデルをチェックした時、モデル情報を表示する。
    $(document).on('click', 'input[name=modelRadio]', function () {
        viewModel();
    });

    // カスタムモデルをトレーニングする。
    trainBtnId.on('click', function () {
        const id = $('input[name=modelRadio]:checked').val();
        if (id !== 'default') {
            // Result モーダルを表示する。
            okBtnId.prop('disabled', true);
            resultModalMessageId.html('');
            $('#resultModalId').modal();
            anime(true);

            $.ajax({
                "type": "POST",
                "url": "/stt/" + id + "/train"
            }).done(function (value) {
            }).fail(function (value) {
                console.log("error: ", value);
            }).always(function (value) {
                anime(false);
                resultModalMessageId.html('<pre>' + JSON.stringify(value, undefined, 2) + '</pre>');
                okBtnId.prop('disabled', false);
                isChange = true;
            });
        }
    });

    // Word モーダルを表示する。
    $(document).on('click', '#wordBtnId', function () {
        let id = $('input[name=modelRadio]:checked').val();
        if (id !== 'default') {
            wordResultId.html('');
            $('#wordModalId').modal('show');
            isChange = false;
        }
    });

    // Add words
    $(document).on('click', '#uploadWordBtnId', function () {
        const filename = $('#wordfileId').val();
        if (filename !== '') {
            anime(true);
            wordCloseBtnId.prop('disabled', true);

            // 入力データを取得する。
            const id = $('input[name=modelRadio]:checked').val();
            const formdata = new FormData($('#uploadWordId').get(0));

            // コーパスを追加する。
            $.ajax({
                url: "/stt/" + id + "/word",
                type: "POST",
                data: formdata,
                cache: false,
                contentType: false,
                processData: false,
                dataType: "text"
            }).done(function (value) {
                const json = JSON.parse(value);
                wordResultId.html('<pre>' + JSON.stringify(json, undefined, 2) + '</pre>');
            }).fail(function () {
                wordResultId.html('通信エラーが発生しました。');
            }).always(function () {
                anime(false);
                wordCloseBtnId.prop('disabled', false);
                isChange = true;
            });
        }
    });

    // Delete word
    $(document).on('click', '#deleteWordBtnId', function () {
        const word = $('#deleteWordSelectId').val();
        if (word !== '') {
            anime(true);
            wordCloseBtnId.prop('disabled', true);

            // 入力データを取得する。
            const id = $('input[name=modelRadio]:checked').val();

            // コーパスを削除する。
            $.ajax({
                url: "/stt/" + id + "/word/" + word + '/delete',
                type: "POST",
                cache: false,
                contentType: false,
                processData: false,
                dataType: "text"
            }).done(function (value) {
                const json = JSON.parse(value);
                wordResultId.html('<pre>' + JSON.stringify(json, undefined, 2) + '</pre>');
            }).fail(function () {
                wordResultId.html('通信エラーが発生しました。');
            }).always(function () {
                anime(false);
                wordCloseBtnId.prop('disabled', false);
                isChange = true;
            });
        }
    });


    // 閉じるボタンをクリックした時、Word モーダルを閉じる。(変更時はモデル情報を再表示する。)
    $(document).on('click', '#wordCloseBtnId', function () {
        if (isChange) {
            isChange = false;
            viewModel();
        }
        $('#wordModalId').modal('hide');
    });

    // Corpora モーダルを表示する。
    $(document).on('click', '#corporaBtnId', function () {
        let id = $('input[name=modelRadio]:checked').val();
        if (id !== 'default') {
            corporaResultId.html('');
            $('#corporaModalId').modal('show');
            isChange = false;
        }
    });

    // Add corpus
    $(document).on('click', '#uploadCorpusBtnId', function () {
        const filename = $('#corpusfileId').val();
        if (filename !== '') {
            anime(true);
            corporaCloseBtnId.prop('disabled', true);

            // 入力データを取得する。
            const id = $('input[name=modelRadio]:checked').val();
            const formdata = new FormData($('#uploadCorpusId').get(0));

            // コーパスを追加する。
            $.ajax({
                url: "/stt/" + id + "/corpus",
                type: "POST",
                data: formdata,
                cache: false,
                contentType: false,
                processData: false,
                dataType: "text"
            }).done(function (value) {
                const json = JSON.parse(value);
                corporaResultId.html('<pre>' + JSON.stringify(json, undefined, 2) + '</pre>');
            }).fail(function () {
                corpusResultId.html('通信エラーが発生しました。');
            }).always(function () {
                anime(false);
                corporaCloseBtnId.prop('disabled', false);
                isChange = true;
            });
        }
    });

    // Delete corpus
    $(document).on('click', '#deleteCorpusBtnId', function () {
        const name = $('#deleteCorpusSelectId').val();
        if (name !== '') {
            anime(true);
            corporaCloseBtnId.prop('disabled', true);

            // 入力データを取得する。
            const id = $('input[name=modelRadio]:checked').val();

            // コーパスを削除する。
            $.ajax({
                url: "/stt/" + id + "/corpus/" + name + '/delete',
                type: "POST",
                cache: false,
                contentType: false,
                processData: false,
                dataType: "text"
            }).done(function (value) {
                const json = JSON.parse(value);
                corporaResultId.html('<pre>' + JSON.stringify(json, undefined, 2) + '</pre>');
            }).fail(function () {
                corpusResultId.html('通信エラーが発生しました。');
            }).always(function () {
                anime(false);
                corporaCloseBtnId.prop('disabled', false);
                isChange = true;
            });
        }
    });

    // 閉じるボタンをクリックした時、Corpora モーダルを閉じる。(変更時はモデル情報を再表示する。)
    $(document).on('click', '#corporaCloseBtnId', function () {
        if (isChange) {
            isChange = false;
            viewModel();
        }
        $('#corporaModalId').modal('hide');
    });

    // Create Model Confirm
    $('#createModelId').on('click', function () {
        $('#createModalId').modal('show');
    });

    // Create Model
    $('#createBtnId').on('click', function () {
        // 入力項目から値を取得する。
        const name = $('#createNameId').val();
        const description = $('#createDescriptionId').val();

        // 結果モーダルを表示する。
        okBtnId.prop('disabled', true);
        $('#resultModalId').modal();
        $('#createModalId').modal('hide');
        anime(true);

        $.ajax({
            "type": "POST",
            "url": "/stt",
            "data": {
                "name": name,
                "description": description
            }
        }).done(function (value) {
            resultModalMessageId.html('<pre>' + JSON.stringify(value, undefined, 2) + '</pre>');
        }).fail(function () {
            resultModalMessageId.html('通信エラーが発生しました。');
        }).always(function () {
            anime(false);
            okBtnId.prop('disabled', false);
        });
    });

    // Delete Model Confirm
    deleteModelBtnId.on('click', function () {
        const id = $('input[name=modelRadio]:checked').val();
        if (id !== 'default') {
            $('#deleteModalId').modal();
            $('#deleteId').text(id);
        }
    });

    // Delete Model
    $('#deleteBtnId').on('click', function () {
        // 結果モーダルを表示する。
        okBtnId.prop('disabled', true);
        $('#resultModalId').modal();
        $('#deleteModalId').modal('hide');
        anime(true);

        $.ajax({
            "type": "POST",
            "url": "/stt/" + $('#deleteId').text() + "/delete",
            "data": {}
        }).done(function (value) {
            resultModalMessageId.html('<pre>' + JSON.stringify(value, undefined, 2) + '</pre>');
        }).fail(function () {
            resultModalMessageId.html('通信エラーが発生しました。');
        }).always(function () {
            anime(false);
            okBtnId.prop('disabled', false);
        });
    });

    // Result Modal の OKボタンをクリックした時、ページを再読込みする。
    okBtnId.on('click', function () {
        if (isChange) {
            isChange = false;
            viewModel();
            $('#corporaModalId').modal('hide');
        } else {
            location.href = '/stt';
        }
    });

    // ホームボタンをクリックした時、ホーム画面に移動する。
    homeBtnId.on('click', function () {
        location.href = '/maintenance.html';
    });

    // 初期処理
    visibleRecoredingButton(false);
    visibleOperateModelButton(false);
});