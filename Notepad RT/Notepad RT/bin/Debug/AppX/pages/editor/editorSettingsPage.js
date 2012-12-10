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
                showGutter = document.getElementById('show-gutter').winControl;
                //useHardTabsElem = document.getElementById('use-hard-tabs');

            fontSizeElem.value = settings['fontSize'];
            editorModeElem.value = settings['mode'];
            themeElem.value = settings['theme'];
            highlightActiveLineElem.checked = settings['highlightActiveLine'];
            showInvisibleCharactersElem.checked = settings['showInvisibleCharacters'];
            showGutter.checked = settings['showGutter'];
            showPrintMargin.checked = settings['showPrintMargin'];
            showInvisibleCharactersElem.checked = settings['showInvisibleCharacters'];


            //useHardTabsElem.checked = settings['useHardTabs'];
            highlightActiveLineElem.addEventListener('change', function (eventInfo) {

                settings['highlightActiveLine'] = highlightActiveLineElem.checked;
                Windows.Storage.ApplicationData.current.signalDataChanged();

            });
            showInvisibleCharactersElem.addEventListener('change', function (eventInfo) {

                settings['showInvisibleCharacters'] = showInvisibleCharactersElem.checked;
                Windows.Storage.ApplicationData.current.signalDataChanged();

            });

            showPrintMargin.addEventListener('change', function (eventInfo) {

                settings['showPrintMargin'] = showPrintMargin.checked;
                Windows.Storage.ApplicationData.current.signalDataChanged();

            });

            showGutter.addEventListener('change', function (eventInfo) {

                settings['showGutter'] = showGutter.checked;
                Windows.Storage.ApplicationData.current.signalDataChanged();

            });

        }

    });

})();
