//// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
//// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//// PARTICULAR PURPOSE.
////
//// Copyright (c) Microsoft Corporation. All rights reserved

/// <reference path="//Microsoft.WinJS.0.6/js/base.js" />
/// <reference path="//Microsoft.WinJS.0.6/js/ui.js" />

var editor,
     editorSession,
     editorCurrentFileToken = null,
     filenameTitle;

(function () {
    "use strict";

    
    var page = WinJS.UI.Pages.define("/pages/editor/editorPage.html", {
        ready: function (element, options) {
            
            editor = ace.edit("editor");
            editorSession = editor.getSession();
            configureEditorFromSettings();
            
            filenameTitle = document.getElementById('filename');
            filenameTitle.addEventListener('click', fileNameClick);

            Windows.Storage.ApplicationData.current.addEventListener("datachanged", configureEditorFromSettings);

            var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            dataTransferManager.addEventListener("datarequested", dataRequested);


            if (options && options.filetoken) {
// Load from recent opened files

                loadFromToken(options.filetoken);

            } else if (options && options.files) {
// Load from file from outside (like Explorer in Desktop)

                var file = options.files[0];
                editorCurrentFileToken = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.add(file, { name: file.name, dateCreated: file.dateCreated });
                loadFromToken(editorCurrentFileToken);

            } else if (options && options.shareData) {
// Load content being shared to this app
// We current only accept text, but are looking to accept files soon

                filenameTitle.innerHTML = options.shareData.properties.title;
                
                document.getElementById('saveButton').style.visibility = 'visible';

                if (options.shareData.contains(Windows.ApplicationModel.DataTransfer.StandardDataFormats.text)) {

                    options.shareData.getTextAsync().done(function (text) {
                        
                        setTimeout(function () {
                            //configureEditorFromSettings();
                            editor.getSession().getDocument().setValue(text);
                            editor.navigateTo(0, 0);
                        }, 1200);

                    });

                } else {
                    //editor.getSession().getDocument().setValue("STUFF");
                }

            } else {
// Loaded with no options, i.e. New File

                console.log("New document");
                
                
            }
            
            
            setupAppBar();
            
        },
        unload: function () {

            var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();

            saveFileContents(editorSession.getDocument().getValue());
            editorCurrentFileToken = null;
            dataTransferManager.removeEventListener("datarequested", dataRequested);
            Windows.Storage.ApplicationData.current.removeEventListener("datachanged", configureEditorFromSettings);
            editor.destroy();
            
        }

    });

    function setEditorContents(text) {

        editor.getSession().getDocument().setValue(text);

    }

    function hideAppBar() {

        var appBar = document.getElementById("appBar").winControl;
        appBar.disabled = true;
    }

    function showAppBar() {

        var appBar = document.getElementById("appBar").winControl;
        appBar.disabled = false;
        appBar.show();

    }

    function setupAppBar() {
        var cmdNew = document.getElementById('cmdNew'),
            cmdUndo = document.getElementById('cmdUndo'),
            cmdRedo = document.getElementById('cmdRedo'),
            cmdSave = document.getElementById('cmdSave'),
            cmdSaveAs = document.getElementById('cmdSaveAs'),
            //cmdSearch = document.getElementById('cmdSearch'),
            cmdPin = document.getElementById('cmdPinFile');



        cmdNew.addEventListener('click', cmdNewFile);
        cmdSave.addEventListener('click', saveFile);
        //cmdSearch.addEventListener('click', openSearch);
        cmdSaveAs.addEventListener('click', saveFileToLocation);
        cmdUndo.addEventListener('click', doUndo);
        cmdRedo.addEventListener('click', doRedo);
        //cmdSearch.addEventListener('click', openSearch);
    }
    
    function openSearch() {

        var searchBar = document.getElementById('searchBar').winControl;
        searchBar.disabled = false;
        hideAppBar();
        searchBar.onafterhide = function () {
            hideSearch();
        };
        searchBar.show();


    }

    function hideSearch() {

        var searchBar = document.getElementById('searchBar').winControl,
            appBar = document.getElementById('appBar').winControl;
        searchBar.disabled = true;
        appBar.disabled = false;

    }

    function cmdNewFile() {

        editorCurrentFileToken = null;
        editor.getSession().getDocument().setValue('');
        document.getElementById("filename").innerHTML = 'Untitled';
        hideAppBar();

    }

    function doUndo() {
        
        editor.undo();

    }

    function doRedo() {

        editor.redo();

    }

    function saveFile() {
        saveFileContents(editor.getSession().getDocument().getValue());
        hideAppBar();
    }

    function saveFileAs() {



    }

    function saveFileToLocation() {
        var filenameInput = document.getElementById('filename'),
            contents = editor.getSession().getDocument().getValue();
        

        // Verify that we are currently not snapped, or that we can unsnap to open the picker
        var currentState = Windows.UI.ViewManagement.ApplicationView.value;
        if (currentState === Windows.UI.ViewManagement.ApplicationViewState.snapped &&
            !Windows.UI.ViewManagement.ApplicationView.tryUnsnap()) {
            // Fail silently if we can't unsnap
            return;
        }

        // Create the picker object and set options
        var savePicker = new Windows.Storage.Pickers.FileSavePicker();
        savePicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.documentsLibrary;
        // Dropdown of file types the user can save the file as
        savePicker.fileTypeChoices.insert("Plain Text", [".txt"]);
        savePicker.fileTypeChoices.insert("C/C++", [".c", ".h", ".cpp"]);
        savePicker.fileTypeChoices.insert("HTML", [".html"]);
        savePicker.fileTypeChoices.insert("CSS", [".css"]);
        savePicker.fileTypeChoices.insert("JavaScript", [".js"]);
        //savePicker.defaultFileExtension = "";
        // Default file name if the user does not type one in or select a file to replace
        savePicker.suggestedFileName = filenameInput.innerHTML;

        savePicker.pickSaveFileAsync().then(function (file) {

            if (file) {
                // Prevent updates to the remote version of the file until we finish making changes and call CompleteUpdatesAsync.
                Windows.Storage.CachedFileManager.deferUpdates(file);
                // write to file
                Windows.Storage.FileIO.writeTextAsync(file, contents).done(function () {
                    // Let Windows know that we're finished changing the file so the other app can update the remote version of the file.
                    // Completing updates may require Windows to ask for user input.
                    Windows.Storage.CachedFileManager.completeUpdatesAsync(file).done(function (updateStatus) {

                        if (updateStatus === Windows.Storage.Provider.FileUpdateStatus.complete) {
                            // Store the file in the MRU List
                            editorCurrentFileToken = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.add(file, file.name);

                            filenameInput.innerHTML = file.name;
                            
                            setImmediate(function () {

                                var mruList = document.getElementById("imageTextListFile");
                                if (mruList) {

                                    initRecentFiles();


                                }

                            });

                        } else {

                            

                        }

                    });

                    
                });
            } else {

                

            }
        });
    }

    function dataRequested(e) {
        var request = e.request;
       
        // Title is required
        var dataPackageTitle = document.getElementById("filename").innerHTML;
        request.data.properties.title = dataPackageTitle;
        request.data.setText(editorSession.getDocument().getValue());

        /*if (editorCurrentFileToken) {

            var mruList = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries,
                mruListSize = mruList.size,
                file = mruList.getAt(mruListSize - 1);

            //request.data.setStorageItems([file]);

        }*/
        
    }

    function loadFromToken(fileToken) {

        editorCurrentFileToken = fileToken;

        Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.getFileAsync(fileToken).done(function (retrievedFile) {

            Windows.Storage.FileIO.readTextAsync(retrievedFile).done(function (contents) {

                document.getElementById('filename').innerHTML = retrievedFile.name;
                //var doc = editor.getSession().getDocument();
                //.log(contents);
                setTimeout(function () {
                    configureEditorFromSettings();
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

            Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.getFileAsync(fileToken).done(function (retrievedFile) {
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

            saveFileToLocation();


        }
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

                        Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.getFileAsync(editorCurrentFileToken).done(function (retrievedFile) {

                            retrievedFile.renameAsync(titleVal).done(function () {

                                // Need to refresh the file in the mruList
                                Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.remove(editorCurrentFileToken);
                                editorCurrentFileToken = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.add(retrievedFile, retrievedFile.name);

                                filenameTitle.innerHTML = titleVal;

                            });

                        });

                    } else {
                        // Don't worry about it, just change the name and we'll use it later with the save dialog
                        filenameTitle.innerHTML = titleVal;

                    }
                     

                } else {

                    filenameTitle.innerHTML = name;

                }
                            
            });
                        
            filenameTitle.appendChild(textInput);
            textInput.focus();
            
        }
    }

    function configureEditorFromSettings() {
        var editor = ace.edit("editor"),
            editorSession = editor.getSession(),
            settings = Windows.Storage.ApplicationData.current.localSettings.values;
        
        //console.log(editor);
        settings['fontSize'] = settings['fontSize'] || 12;
        settings['highlightActiveLine'] = (settings['highlightActiveLine'] === undefined ? false : settings['highlightActiveLine']);
        settings['showInvisibleCharacters'] = (settings['showInvisibleCharacters'] === undefined ? false : settings['showInvisibleCharacters']);
        settings['theme'] = settings['theme'] || 'ace/theme/textmate';
        settings['mode'] = settings['mode'] || 'ace/mode/text';
        settings['useHardTabs'] = (settings['useHardTabs'] === undefined ? true : settings['useHardTabs']);
        settings['showIndentGuides'] = (settings['showIndentGuides'] === undefined ? true : settings['showIndentGuides']);
        settings['showGutter'] = (settings['showGutter'] === undefined ? true : settings['showGutter']);

        editorSession.setMode(settings['mode']);
        editor.setTheme(settings['theme']);
        
        
        
        //setTimeout(function () {
            
        //}, 2000);
        
        //console.log('Settings mode: ' + settings['mode'] + ' Theme: ' + settings['theme']);
        document.getElementById('editor').style.fontSize = settings['fontSize'] + 'px';
        
        
        editorSession.setUseWrapMode(true);
        editorSession.setTabSize(4);
        editorSession.setUseSoftTabs(settings['useHardTabs']);
        editor.setHighlightActiveLine(settings['highlightActiveLine']);
        editor.setShowInvisibles(settings['showInvisibleCharacters']);
        editor.setTheme(settings['theme']);
        editorSession.setMode('ace/mode/text');
        editorSession.setMode(settings['mode']);
        //asdf

    }

})();
