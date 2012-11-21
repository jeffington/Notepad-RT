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
     editorCurrentFileName = null,
     hasEditorChanged = false;

(function () {
    "use strict";

    var fileTypes = [
        {
            exts: ["ps1"],
            mode: "ace/mode/powershell",
        },
        {
            exts: ["txt"],
            mode: "",
        },
        {
            exts: ["css"],
            mode: "ace/mode/css",
        
        },
        {
            exts: ["java"],
            mode: "ace/mode/java",
        },
        {
            exts: ["html", "htm"],
            mode: "ace/mode/html",
        },
        {
            exts: ["jsp"],
            mode: "ace/mode/jsp",
        },
        {
            exts: ["markdown", "md"],
            mode: "ace/mode/markdown",
        },
        {
            exts: ["pl"],
            mode: "ace/mode/perl",
        },
        {
            exts: ["py"],
            mode: "ace/mode/python",
        },
        {
            exts: ["js"],
            mode: "ace/mode/javascript",
        },
        {
            exts: ["php"],
            mode: "ace/mode/php",
        },
        {
            exts: ["xml", "rss"],
            mode: "ace/mode/xml",
        },
        {
            exts: ["c", "cpp", "h"],
            mode: "ace/mode/c_cpp",
        },
        {
            exts: ["cs"],
            mode: "ace/mode/csharp",
        },
        {
            exts: ["json"],
            mode: "ace/mode/json",
        },
        {
            exts: ["rb", "rbw"],
            mode: "ace/mode/ruby",
        },
        {
            exts: ["sql"],
            mode: "ace/mode/sql",
        },
        {
            exts: ["psql"],
            mode: "ace/mode/pgsql",
        },
    ];
    
    var page = WinJS.UI.Pages.define("/pages/editor/editorPage.html", {
        ready: function (element, options) {
            
            editor = ace.edit("editor");
            editorSession = editor.getSession();
            configureEditorFromSettings();
            
            var filenameTitle = document.getElementById('filename');
            filenameTitle.addEventListener('click', fileNameClick);

            Windows.Storage.ApplicationData.current.addEventListener("datachanged", configureEditorFromSettings);

            var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            dataTransferManager.addEventListener("datarequested", dataRequested);

            /*var backBtn = document.getElementById('backbutton');
            backBtn.addEventListener('click', function (e) {
                console.log("UGH");
                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();
                return false;
            }, true);*/

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

                //filenameTitle.innerHTML = options.shareData.properties.title;
                setFileName(options.shareData.properties.title);
                //document.getElementById('saveButton').style.visibility = 'visible';

                if (options.shareData.contains(Windows.ApplicationModel.DataTransfer.StandardDataFormats.text)) {

                    options.shareData.getTextAsync().then(function (text) {
                        
                        return WinJS.Promise.timeout(1200);
                        

                    }).done(function () {
                            //configureEditorFromSettings();
                            editor.getSession().getDocument().setValue(text);
                            editor.navigateTo(0, 0);
                    });

                } else {
                    //editor.getSession().getDocument().setValue("STUFF");
                }

            } else {
                // Loaded with no options, i.e. New File

                console.log("New document");
                WinJS.Promise.timeout(1200, function () {
                    configureEditorFromSettings();
                });
            }
            
            
            setupAppBar();
            
        },
        unload: function () {

            var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            dataTransferManager.removeEventListener("datarequested", dataRequested);
            Windows.Storage.ApplicationData.current.removeEventListener("datachanged", configureEditorFromSettings);

            if (hasEditorChanged) {

                unsavedFilePrompt();

            }
            
            editorCurrentFileToken = null;
            editorCurrentFileName = null;
            editor.destroy();
            
        }

    });

    function unsavedFilePrompt() {
        // Create the message dialog and set its content
        var msg = new Windows.UI.Popups.MessageDialog("Do you want to save changes to " + "fileName.txt" + "?", "Unsaved Changes");

        // Add commands and set their CommandIds
        msg.commands.append(new Windows.UI.Popups.UICommand("Save",
            function () {

                saveFileContents(editorSession.getDocument().getValue());
            
            }, 1));
        msg.commands.append(new Windows.UI.Popups.UICommand("Cancel", null, 2));
        console.log(editor);
        // Set the command that will be invoked by default
        msg.defaultCommandIndex = 2;

        // Show the message dialog
        msg.showAsync().done(function (command) {
            if (command) {
                //WinJS.log && WinJS.log("The '" + command.label + "' (" + command.id + ") command has been selected.", "sample", "status");
            }
        });
        


    }

    function detectEditorModeFromExtension(fileName) {

        var x, y,
            numTypes = fileTypes.length,
            numExtensions,
            fileExtension = fileName.substring(fileName.lastIndexOf('.') + 1),
            foundFlag = false;

        for (x = 0; x < numTypes; x++) {

            var extensions = fileTypes[x].exts,
                numExtensions = extensions.length;

            for (y = 0; y < numExtensions; y++) {

                if (fileExtension == extensions[y]) {
                    console.log("Detected mode: " + fileTypes[x].mode);
                    // If the extension matches, set the editor's mode
                    // Set the found flag to true so we can stop looking for a match
                    editorSession.setMode(fileTypes[x].mode);
                    editorSession.setMode('ace/mode/text');
                    editorSession.setMode(fileTypes[x].mode);
                    foundFlag = true;
                    break;

                }
                
            }

            if (foundFlag) {

                break;

            }

        }


    }

    function setEditorContents(text) {

        editor.getSession().getDocument().setValue(text);

    }

    function hideAppBar() {

        var appBar = document.getElementById("appBar").winControl;
        appBar.disabled = true;
    }

    function dismissAppBar() {

        var appBar = document.getElementById("appBar").winControl;
        appBar.hide();

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
            cmdSearch = document.getElementById('cmdSearch'),
            cmdPin = document.getElementById('cmdPinFile'),
            cmdFindNext = document.getElementById('cmdFindNext'),
            cmdFindPrev = document.getElementById('cmdFindPrev'),
            cmdReplace = document.getElementById('cmdReplace'),
            cmdReplaceAll = document.getElementById('cmdReplaceAll'),
            cmdCut = document.getElementById('cmdCut'),
            cmdCopy = document.getElementById('cmdCopy'),
            cmdPaste = document.getElementById('cmdPaste');



        cmdNew.addEventListener('click', cmdNewFile);
        cmdSave.addEventListener('click', saveFile);
        cmdSearch.addEventListener('click', openSearch);
        cmdSaveAs.addEventListener('click', saveFileToLocation);
        cmdUndo.addEventListener('click', doUndo);
        cmdRedo.addEventListener('click', doRedo);
        cmdFindNext.addEventListener('click', findNext);
        cmdFindPrev.addEventListener('click', findPrev);
        cmdReplace.addEventListener('click', replace);
        cmdReplaceAll.addEventListener('click', replaceAll);
        cmdCopy.addEventListener('click', doCopy);
        cmdCut.addEventListener('click', doCut);
        cmdPaste.addEventListener('click', doPaste);
        
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

    function findNext() {

        var searchTerms = document.getElementById('searchTerms').value,
            options = {};
        
        options.needle = searchTerms;
        options.backwards = false;

        if (searchTerms && searchTerms.length > 0) {

            editor.find(searchTerms, options, true);

        }

    }

    function findPrev() {

        var searchTerms = document.getElementById('searchTerms').value,
            options = {};

        options.needle = searchTerms;
        options.backwards = true;
        if (searchTerms && searchTerms.length > 0) {

            editor.findPrevious(searchTerms, options, true);

        }

    }

    function replace() {

        var searchTerms = document.getElementById('searchTerms').value,
            replaceTerms = document.getElementById('replaceTerms').value,
            options = {};
        
        options.needle = searchTerms;

        if (searchTerms && searchTerms.length > 0 && replaceTerms && replaceTerms.length > 0) {

            editor.replace(replaceTerms, options);

        }

    }

    function replaceAll() {

        var searchTerms = document.getElementById('searchTerms').value,
            replaceTerms = document.getElementById('replaceTerms').value,
            options = {};

        options.needle = searchTerms;
        if (searchTerms && searchTerms.length > 0 && replaceTerms && replaceTerms.length > 0) {

            editor.replaceAll(replaceTerms, options);

        }

    }

    function hideSearch() {

        var searchBar = document.getElementById('searchBar').winControl,
            appBar = document.getElementById('appBar').winControl;
        searchBar.disabled = true;
        appBar.disabled = false;

    }

    function cmdNewFile() {

        // TODO: Unsaved changes

        editorCurrentFileToken = null;
        editor.getSession().getDocument().setValue('');
        setFileName('Untitled');
        //document.getElementById("filename").innerHTML = 'Untitled';
        dismissAppBar();

    }

    function doUndo() {
        
        editor.undo();

    }

    function doRedo() {

        editor.redo();

    }

    function saveFile() {

        saveFileContents(editor.getSession().getDocument().getValue());
        dismissAppBar();

    }

    function doCopy() {

        var dataPackage = new Windows.ApplicationModel.DataTransfer.DataPackage(),
                    selectionString = editor.getCopyText();

        if (selectionString && selectionString.length > 0) {

            dataPackage.setText(selectionString);
            Windows.ApplicationModel.DataTransfer.Clipboard.setContent(dataPackage);

        }

    }

    function doCut() {

        var dataPackage = new Windows.ApplicationModel.DataTransfer.DataPackage();

        dataPackage.setText(editor.getCopyText());
        Windows.ApplicationModel.DataTransfer.Clipboard.setContent(dataPackage);
        editor.insert('');

    }

    function doPaste() {

        Windows.ApplicationModel.DataTransfer.Clipboard.getContent().getTextAsync().done(function(text){
            editor.onPaste(text);
        });

    }

    //
    //
    // File Management Functions
    //
    //

    /*
        filenameTitle = document.getElementById('filename');
        filenameTitle.addEventListener('click', fileNameClick);
    */
    function getFileName() {

        var fileName = '',
            titleHead = document.getElementById('filename');

        if (!editorCurrentFileToken) {

            fileName = 'Untitled';

        } else {

            fileName = editorCurrentFileName;

        }

        return fileName;

    }

    function setFileName(name) {

        if (name != editorCurrentFileName) {
            console.log("Current name: " + editorCurrentFileName + " new name: " + name);
            //detectEditorModeFromExtension(name);

            editorCurrentFileName = name;
            document.getElementById('filename').innerHTML = name;
        }
        
    }


    function hideFileNameInput() {
        var titleVal = getFileName();
        if (editorCurrentFileToken && titleVal != editorCurrentFileName) {

            Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.getFileAsync(editorCurrentFileToken).then(function (retrievedFile) {

                return retrievedFile.renameAsync(titleVal);

            }).done(function () {

                // Need to refresh the file in the mruList
                Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.remove(editorCurrentFileToken);
                editorCurrentFileToken = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.add(retrievedFile, retrievedFile.name);

                setFileName(titleVal);
                //filenameTitle.innerHTML = titleVal;

            });

        } else {
            // Don't worry about it, just change the name and we'll use it later with the save dialog
            //filenameTitle.innerHTML = titleVal;
            setFileName(titleVal);

        }

    }

    function fileNameClick() {
        var fileNameHead = document.getElementById('filename');
        if (fileNameHead.firstChild.nodeType !== 1) {

            var name = getFileName();
            fileNameHead.innerHTML = '';
            var textInput = document.createElement('input');
            textInput.setAttribute('type', 'text');
            textInput.setAttribute('value', name);

            textInput.addEventListener('blur', hideFileNameInput);
            fileNameHead.appendChild(textInput);
            textInput.focus();

        }
        
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
        savePicker.fileTypeChoices.insert(".txt", [".txt"]);
        savePicker.fileTypeChoices.insert(".c", [".c"]);
        savePicker.fileTypeChoices.insert(".cs", [".cs"]);
        savePicker.fileTypeChoices.insert(".h", [".h"]);
        savePicker.fileTypeChoices.insert(".cpp", [".cpp"]);
        savePicker.fileTypeChoices.insert(".html", [".html"]);
        savePicker.fileTypeChoices.insert(".css", [".css"]);
        savePicker.fileTypeChoices.insert(".js", [".js"]);
        savePicker.fileTypeChoices.insert(".md", [".md"]);
        savePicker.fileTypeChoices.insert(".java", [".java"]);
        savePicker.fileTypeChoices.insert(".js", [".js"]);
        savePicker.fileTypeChoices.insert(".jsp", [".jsp"]);
        savePicker.fileTypeChoices.insert(".json", [".json"]);
        savePicker.fileTypeChoices.insert(".sql", [".sql"]);
        savePicker.fileTypeChoices.insert(".psql", [".psql"]);
        savePicker.fileTypeChoices.insert(".php", [".php"]);
        savePicker.fileTypeChoices.insert(".pl", [".pl"]);
        savePicker.fileTypeChoices.insert(".py", [".py"]);
        savePicker.fileTypeChoices.insert(".rb", [".rb"]);

        savePicker.fileTypeChoices.insert(".xml", [".xml"]);
        
        savePicker.suggestedFileName = getFileName();

        savePicker.pickSaveFileAsync().then(function (file) {

            if (file) {
                // Prevent updates to the remote version of the file until we finish making changes and call CompleteUpdatesAsync.
                Windows.Storage.CachedFileManager.deferUpdates(file);
                return Windows.Storage.FileIO.writeTextAsync(file, contents).then(function () {

                    return Windows.Storage.CachedFileManager.completeUpdatesAsync(file);

                });
            }
        }).then(function (updateStatus) {

            if (updateStatus === Windows.Storage.Provider.FileUpdateStatus.complete) {
                // Store the file in the MRU List
                editorCurrentFileToken = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.add(file, file.name);
                setFileName(file.name);

            }

        });
                    
    }

    /*function documentChanged() {

        setUnsaved();

        editorSession.removeEventListener('change', documentChanged);


    }*/

    function setSaved() {

        var titleHeader = document.getElementById('filename');
        titleHeader.style.fontStyle = 'normal';
        hasEditorChanged = false;

        editorSession.addEventListener('change', setUnsaved);
    }

    function setUnsaved() {

        var titleHeader = document.getElementById('filename');
        titleHeader.style.fontStyle = 'italic';
        hasEditorChanged = true;
        editorSession.removeEventListener('change', setUnsaved);

    }

    function dataRequested(e) {
        var request = e.request;
       
        try {

            var dataPackageTitle = getFileName();
            request.data.properties.title = dataPackageTitle;
            request.data.setText(editorSession.getDocument().getValue());

        } catch (e) {

            request.failWithDisplayText("There's no text to share in the document.");

        }
        
    }

    function loadFromToken(fileToken) {

        editorCurrentFileToken = fileToken;
        
        // Configure and prepare the editor to receive the file's content
        configureEditorFromSettings();

        Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.getFileAsync(fileToken).then(function (retrievedFile) {

            setFileName(retrievedFile.name);
            
            //return retrievedFile.openAsync(Windows.Storage.FileAccessMode.read);
            return Windows.Storage.FileIO.readBufferAsync(retrievedFile);

        }).then(function (buffer) {

            var dataReader = Windows.Storage.Streams.DataReader.fromBuffer(buffer),
                array = new Array(buffer.length),
                output = dataReader.readBytes(array),
                x;

            dataReader.close();

            for (x = 0; x < array.length; x++) {

                array[x] = String.fromCharCode(array[x]);

            }

            // Cut off the characters: ï»¿
            if (array[0] == "ï" || array[1] == "»" || array[2] == "¿") {

                array.splice(0, 3);

            }

            editor.getSession().getDocument().setValue(array.join(''));
            
            return WinJS.Promise.timeout(1200);

        }).then(function (complete) {

            configureEditorFromSettings();

            detectEditorModeFromExtension(getFileName());

            //editor.getSession().getDocument().setValue(contents);
            editor.navigateTo(0, 0);
            setSaved();

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
                    setSaved();

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
        settings['showPrintMargin'] = (settings['showPrintMargin'] === undefined ? true : settings['showPrintMargin']);


        editorSession.setMode(settings['mode']);
        editor.setTheme(settings['theme']);
        
        var gutter = document.querySelector('.ace_gutter-layer');

        if (settings['showGutter']) {

            gutter.style.display = 'inherit';

        } else {

            gutter.style.display = 'none';

        }
        
        

        //setTimeout(function () {
            
        //}, 2000);
        
        //console.log('Settings mode: ' + settings['mode'] + ' Theme: ' + settings['theme']);
        document.getElementById('editor').style.fontSize = settings['fontSize'] + 'px';
        
        
        editorSession.setUseWrapMode(true);
        editorSession.setTabSize(4);
        editorSession.setUseSoftTabs(settings['useHardTabs']);

        editor.setHighlightActiveLine(settings['highlightActiveLine']);
        editor.setShowInvisibles(settings['showInvisibleCharacters']);
        editor.setShowPrintMargin(settings['showPrintMargin']);
        editor.setTheme(settings['theme']);
        editorSession.setMode('ace/mode/text');
        editorSession.setMode(settings['mode']);
        

    }

})();
