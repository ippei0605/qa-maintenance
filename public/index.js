/**
 * Watson Diet Trainer: Maintenance クライアント JavaScript
 *
 * @author Ippei SUZUKI
 */

'use strict';

$(function () {
    const downloadId = $('#downloadId');

    const filename = {
        "/export-answer": "answer.json",
        "/export-training-csv": "classifier.csv",
        "/export-corpus": "corpus.txt"
    };

    downloadId.on('click', function () {
        const url = $('#commandId').val();
        downloadId.prop('href', url);
        downloadId.prop('download', filename[url]);
    });

    $('#listId').on('click', function () {
        const url = $('#commandId').val();

        // Watson GIF アニメ ON
        $('body').append('<div id="loading-view" />');

        $.ajax({
            url: url
        }).done(function (value) {
            $('#resultId').html('<pre>' + value + '</pre>');
        }).fail(function () {
        }).always(function () {
            // Watson GIF アニメ OFF
            $('#loading-view').remove();
        });
    });
});