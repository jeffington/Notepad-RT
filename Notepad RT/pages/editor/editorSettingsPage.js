(function () {
    "use strict";
    

    var page = WinJS.UI.Pages.define("/html/DefaultsUI.html", {
        ready: function (element, options) {

            
            var settings = Windows.Storage.ApplicationData.current.localSettings.values,
                fontSizeElem = document.getElementById('font-size'),
                editorModeElem = document.getElementById('editor-mode'),
                themeElem = document.getElementById('setting-theme'),
                highlightActiveLineElem = document.getElementById('highlight-active-line').winControl,
                showInvisibleCharactersElem = document.getElementById('show-invisible-characters').winControl,
                showPrintMargin = document.getElementById('show-print-margin').winControl,
                showGutter = document.getElementById('show-gutter').winControl,
                keyBinding = document.getElementById('setting-keybinding');
                //useHardTabsElem = document.getElementById('use-hard-tabs');
            
            showPrintMargin.checked = settings['showPrintMargin'];
            showPrintMargin.addEventListener('change', function (eventInfo) {

                settings['showPrintMargin'] = showPrintMargin.checked;
                Windows.Storage.ApplicationData.current.signalDataChanged();

            });


            fontSizeElem.value = settings['fontSize'];
            fontSizeElem.addEventListener('change', function (eventInfo) {

                settings['fontSize'] = fontSizeElem.value;
                Windows.Storage.ApplicationData.current.signalDataChanged();

            });

            editorModeElem.value = settings['mode'];
            editorModeElem.addEventListener('change', function (eventInfo) {

                settings['mode'] = editorModeElem.value;
                Windows.Storage.ApplicationData.current.signalDataChanged();

            });

            keyBinding.value = settings['keybinding'];
            keyBinding.addEventListener('change', function (eventInfo) {

                settings['keybinding'] = keyBinding.value;
                Windows.Storage.ApplicationData.current.signalDataChanged();

            });

            themeElem.value = settings['theme'];
            themeElem.addEventListener('change', function (eventInfo) {

                settings['theme'] = themeElem.value;
                Windows.Storage.ApplicationData.current.signalDataChanged();
                
            });

            highlightActiveLineElem.checked = settings['highlightActiveLine'];
            highlightActiveLineElem.addEventListener('change', function (eventInfo) {

                settings['highlightActiveLine'] = highlightActiveLineElem.checked;
                Windows.Storage.ApplicationData.current.signalDataChanged();

            });

            showInvisibleCharactersElem.checked = settings['showInvisibleCharacters'];
            showInvisibleCharactersElem.addEventListener('change', function (eventInfo) {

                settings['showInvisibleCharacters'] = showInvisibleCharactersElem.checked;
                Windows.Storage.ApplicationData.current.signalDataChanged();

            });

            highlightActiveLineElem.checked = settings['highlightActiveLine'];
            showPrintMargin.addEventListener('change', function (eventInfo) {

                settings['showPrintMargin'] = showPrintMargin.checked;
                Windows.Storage.ApplicationData.current.signalDataChanged();

            });

            showGutter.checked = settings['showGutter'];
            showGutter.addEventListener('change', function (eventInfo) {

                settings['showGutter'] = showGutter.checked;
                Windows.Storage.ApplicationData.current.signalDataChanged();

            });

        }

    });

})();
