/**
 * Watson Diet Trainer: Classifier クライアント JavaScript
 *
 * @author Ippei SUZUKI
 */

'use strict';

// DOM 読込み完了時の処理
$(function () {
    // タグを定義する。
    const
        corporaTag = '<a href="#" id="corporaBtnId"><h3><span class="glyphicon glyphicon-cog" aria-hidden="true"></span> Corpora</h3></a>';

    // ID セレクターを取得する。
    const okBtnId = $('#okBtnId');
    const resultModalMessageId = $('#resultModalMessageId');
    const sttStartId = $('#sttStartId');
    const sttStopId = $('#sttStopId');
    const resultId = $('#resultId');
    const corporaCloseBtnId = $('#corpusCloseBtnId');
    const corporaResultId = $('#corporaResultId');

    // 変更
    let isChange = false;

    // マイクのストリーム
    let stream = null;

    function setRecoredingButton(flg) {
        sttStartId.prop('disabled', flg);
        sttStopId.prop('disabled', !flg);
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
        setRecoredingButton(true);

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
            let radio = $('input[name=modelRadio]:checked').val();
            if (radio !== 'default') {
                param.customization_id = radio;
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
        setRecoredingButton(false);
        if (stream) {
            stream.stop();
        }
    });

    let corpusList = [];

    // モデル情報を表示する。
    function viewModel() {
        const radio = $('[name=modelRadio]:checked').val();
        if (radio === 'default') {
            resultId.html('');
        } else {
            // Watson GIF アニメ ON
            $('body').append('<div id="loading-view" />');

            // モデル情報を取得する。
            $.ajax({
                "type": "GET",
                "url": "/stt/" + radio
            }).done(function (value) {
            }).fail(function (value) {
                console.log("error: ", value);
            }).always(function (value) {
                // Watson GIF アニメ OFF
                $('#loading-view').remove();
                // モデル情報を表示する。
                resultId.html('<h3>Model</h3><pre>' + JSON.stringify(value.model, undefined, 2) + '</pre>');

                //TODO
                const corpora = value.corpora;
                resultId.append(corporaTag + '<pre>' + JSON.stringify(corpora, undefined, 2) + '</pre>');

                resultId.append('<h3>Words</h3><pre>' + JSON.stringify(value.word, undefined, 2) + '</pre>');

            });
        }
    }

    // モデルのラジオボタンをクリックした時に、モデル情報を表示する。
    $('[name=modelRadio]').click(function () {
        viewModel();
    });

    // カスタムモデルをトレーニングする。
    $(document).on('click', '#trainBtnId', function () {
        const id = $('input[name=modelRadio]:checked').val();
        //let radio = $('#corporaModalId').modal('hide');
        if (id !== 'default') {
            // Result モーダルを表示する。
            okBtnId.prop('disabled', true);
            resultModalMessageId.html('');
            $('#resultModalId').modal();

            // Watson GIF アニメ ON
            $('body').append('<div id="loading-view" />');

            $.ajax({
                "type": "POST",
                "url": "/stt/" + id + "/train"
            }).done(function (value) {
            }).fail(function (value) {
                console.log("error: ", value);
            }).always(function (value) {
                // Watson GIF アニメ OFF
                $('#loading-view').remove();
                resultModalMessageId.html('<pre>' + JSON.stringify(value, undefined, 2) + '</pre>');
                okBtnId.prop('disabled', false);
            });
        }
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
        const name = $('#deleteCorpusNameId').val();
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
        console.log(name, description);

        okBtnId.prop('disabled', true);
        $('#resultModalId').modal();
        $('#createModalId').modal('hide');

        // Watson GIF アニメ ON
        $('body').append('<div id="loading-view" />');

        $.ajax({
            "type": "POST",
            "url": "/stt",
            "data": {
                "name": name,
                "description": description
            }
        }).done(function (value) {
            resultModalMessageId.html('<pre>' + JSON.stringify(value, undefined, 2) + '</pre>');
        }).fail(function (value) {
            resultModalMessageId.html('通信エラーが発生しました。');
        }).always(function (value) {
            // Watson GIF アニメ OFF
            $('#loading-view').remove();

            okBtnId.prop('disabled', false);
        });
    });

    // Delete Model Confirm
    $(document).on('click', '#deleteModelBtnId', function () {
        const id = $('input[name=modelRadio]:checked').val();
        if (id !== 'default') {
            $('#deleteModalId').modal();
            $('#deleteId').text(id);
        }
    });

    // Delete Model
    $('#deleteBtnId').on('click', function () {
        okBtnId.prop('disabled', true);
        $('#resultModalId').modal();
        $('#deleteModalId').modal('hide');

        // Watson GIF アニメ ON
        $('body').append('<div id="loading-view" />');

        $.ajax({
            "type": "POST",
            "url": "/stt/" + $('#deleteId').text() + "/delete",
            "data": {}
        }).done(function (value) {
            resultModalMessageId.html('<pre>' + JSON.stringify(value, undefined, 2) + '</pre>');
        }).fail(function (value) {
            resultModalMessageId.html('通信エラーが発生しました。');
        }).always(function (value) {
            // Watson GIF アニメ OFF
            $('#loading-view').remove();

            okBtnId.prop('disabled', false);
        });
    });

    // Result Modal の OKボタンをクリックしたらページを再読み込みする。
    okBtnId.on('click', function () {
        location.href = '/stt';
    });

    setRecoredingButton(false);
});