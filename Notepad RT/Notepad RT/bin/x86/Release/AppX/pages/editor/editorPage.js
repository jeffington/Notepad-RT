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

            //var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            //dataTransferManager.addEventListener("datarequested", dataRequested);

            if (options && options.filetoken) {

                loadFromToken(options.filetoken);

            } else if (options.files) {

                var file = options.files[0];
                editorCurrentFileToken = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.add(file, { name: file.name, dateCreated: file.dateCreated });
                loadFromToken(editorCurrentFileToken);

            } else if (options.shareData) {

                filenameTitle.innerHTML = options.shareData.properties.title;
                if (options.shareData.contains(Windows.ApplicationModel.DataTransfer.StandardDataFormats.text)) {

                    options.shareData.getTextAsync().done(function (text) {

                        editor.getSession().getDocument().setValue(text);

                    });
                    
                }
            }
            

            

        },
        unload: function () {
            saveFileContents(editorSession.getDocument().getValue());
            editor.destroy();
            
        }

    });
    
    /*function dataRequested(e) {
        var request = e.request;

        // Title is required
        var dataPackageTitle = document.getElementById("filename").innerHTML;
        if ((typeof dataPackageTitle === "string") && (dataPackageTitle !== "")) {
            //var dataPackageText = document.getElementById("textInputBox").value;
            if ((typeof dataPackageText === "string") && (dataPackageText !== "")) {
                request.data.properties.title = dataPackageTitle;

                // The description is optional.
                //var dataPackageDescription = document.getElementById("descriptionInputBox").value;
                //if ((typeof dataPackageDescription === "string") && (dataPackageDescription !== "")) {
                //    request.data.properties.description = dataPackageDescription;
                //}
                request.data.setText(editorSession.getDocument().getValue());
            } else {
                request.failWithDisplayText("Enter the text you would like to share and try again.");
            }
        } else {
            request.failWithDisplayText(SdkSample.missingTitleError);
        }
    }*/

    function loadFromToken(fileToken) {

        editorCurrentFileToken = fileToken;

        Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.getFileAsync(fileToken).done(function (retrievedFile) {

            Windows.Storage.FileIO.readTextAsync(retrievedFile).done(function (contents) {

                document.getElementById('filename').innerHTML = retrievedFile.name;
                //var doc = editor.getSession().getDocument();
                //.log(contents);
                setTimeout(function () {
                    editor.getSession().getDocument().setValue(contents);
                    editor.navigateTo(0, 0);
                }, 1200);
                //console.log("Should have loaded the file contents at this point.");
                //console.log(editor.getSession().getDocument().getValue());

            });

        },
        function (error) {
            // Handle errors 
        });

    }

    function saveFileContents(contents) {
        var fileToken = editorCurrentFileToken;

        if (fileToken) {

            //console.log("Saving file...");
            //editorSession.removeEventListener("change");

            Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.getFileAsync(fileToken).done(
                function (retrievedFile) {
                    // Process retrieved file

                    Windows.Storage.FileIO.writeTextAsync(retrievedFile, contents).then(function () {

                        console.log("Saved.");


                    });

                },
                function (error) {
                    // Handle errors 

                }
            );

        } else {
            // New file


        }
    }

    function createNewFile() {



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
