(function () {
    "use strict";
    

    var page = WinJS.UI.Pages.define("/html/DefaultsUI.html", {
        ready: function (element, options) {

            
            var settings = Windows.Storage.ApplicationData.current.localSettings.values,
                fontSizeElem = document.getElementById('font-size'),
                editorModeElem = document.getElementById('editor-mode'),
                themeElem = document.getElementById('setting-theme'),
                highlightActiveLineElem = document.getElementById('highlight-active-line'),
                showInvisibleCharactersElem = document.getElementById('show-invisible-characters');
                //useHardTabsElem = document.getElementById('use-hard-tabs');

            fontSizeElem.value = settings['fontSize'];
            editorModeElem.value = settings['mode'];
            themeElem.value = settings['theme'];
            highlightActiveLineElem.checked = settings['highlightActiveLine'];
            showInvisibleCharactersElem.checked = settings['showInvisibleCharacters'];
            //useHardTabsElem.checked = settings['useHardTabs'];

        }

    });

})();
