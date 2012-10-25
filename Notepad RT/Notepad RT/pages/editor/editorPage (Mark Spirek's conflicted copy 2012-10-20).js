//// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
//// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//// PARTICULAR PURPOSE.
////
//// Copyright (c) Microsoft Corporation. All rights reserved

/// <reference path="//Microsoft.WinJS.0.6/js/base.js" />
/// <reference path="//Microsoft.WinJS.0.6/js/ui.js" />

(function () {
    "use strict";
    
    var editor, editorSession, editorCurrentFileToken = null, filenameTitle;

    var page = WinJS.UI.Pages.define("/pages/editor/editorPage.html", {
        ready: function (element, options) {
            
            editor = ace.edit("editor");
            editorSession = editor.getSession();
            editorSession.setMode("/mode/javascript");
            editorSession.setUseWrapMode(true);
            configureEditorFromSettings();

            filenameTitle = document.getElementById('filename');
            filenameTitle.addEventListener('click', fileNameClick);

            if (options && options.filetoken) {

                loadFromToken(options.filetoken);

            }

        },
        processed: function (element, options) {



        },
        unload: function () {

            editor.destroy();
            
        }

    });
    
    function loadFromToken(fileToken) {

        editorCurrentFileToken = fileToken;

        Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.getFileAsync(fileToken).done(function (retrievedFile) {

            Windows.Storage.FileIO.readTextAsync(retrievedFile).done(function (contents) {

                
                //var doc = editor.getSession().getDocument();
                console.log(contents);
                setTimeout(function () {
                    editor.getSession().getDocument().setValue(contents);
                }, 1200);
                console.log("Should have loaded the file contents at this point.");
                console.log(editor.getSession().getDocument().getValue());
            });

        },
        function (error) {
            // Handle errors 
        });

    }

    function fileNameClick() {
        
        if (filenameTitle.firstChild.nodeType !== 1) {
            
            var name = filenameTitle.innerHTML;
            filenameTitle.innerHTML = '';
            var textInput = document.createElement('input');
            textInput.setAttribute('type', 'text');
            textInput.setAttribute('value', name);

            textInput.addEventListener('blur', function () {

                var titleVal = textInput.value;
                if (titleVal.length == 0) {

                    filenameTitle.innerHTML = name;

                } else if (titleVal.toLowerCase() !== name.toLowerCase()) {
                    if (editorCurrentFileToken) {



                    }
                    editorCurrentFile.renameAsync(titleVal).done(function () {

                        filenameTitle.innerHTML = titleVal;

                    });

                } else {

                    filenameTitle.innerHTML = name;

                }
                            
            });
                        
            filenameTitle.appendChild(textInput);
            textInput.focus();
        }
    }

    function configureEditorFromSettings() {

        var settings = Windows.Storage.ApplicationData.current.localSettings.values;

        editor.setTheme(settings['theme']);
        editor.setFontSize(settings['fontSize']);
        editor.setHighlightActiveLine(settings['highlightActiveLine']);
        editor.setShowInvisibles(settings['showInvisibleCharacters']);

    }

})();
