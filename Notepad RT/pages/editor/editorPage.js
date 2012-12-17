//// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
//// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
//// PARTICULAR PURPOSE.
////
//// Copyright (c) Microsoft Corporation. All rights reserved

/// <reference path="//Microsoft.WinJS.0.6/js/base.js" />
/// <reference path="//Microsoft.WinJS.0.6/js/ui.js" />

var editor,
     editorSession;
     //editorCurrentFileToken = null,
     //editorCurrentFileName = null,
     //hasEditorChanged = false;

(function () {
    "use strict";

    var fileTypes = [
        {
            exts: ["ps1"],
            mode: "ace/mode/powershell",
        },
        {
            exts: ["txt"],
            mode: "ace/mode/text",
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
    
    var editorPage = WinJS.UI.Pages.define("/pages/editor/editorPage.html", {

        ready: function (element, options) {
            
            var that = this;
            var sessionState = WinJS.Application.sessionState;

            
            editor = ace.edit("editor");
            editorSession = editor.getSession();
            this.configureEditorFromSettings();
            
            var filenameTitle = document.getElementById('filename');
            filenameTitle.addEventListener('click', fileNameClick);

            Windows.Storage.ApplicationData.current.addEventListener("datachanged", this.configureEditorFromSettings);

            var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            dataTransferManager.addEventListener("datarequested", this.dataRequestedForSharing);

            // Keyboard events
            this.addKeyboardShortcuts();

            if (options && options.filetoken) {
                // Load from recent opened files
                
                this.loadFromToken(options.filetoken);
                //sessionState.editorCurrentFileToken = options.filetoken;
                //sessionState.editorCurrentFileName = options.filename;


            } else if (options && options.files) {
                // Load from file from outside (like Explorer in Desktop)
                
                var file = options.files[0],
                    token = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.add(file, { name: file.name, dateCreated: file.dateCreated });
                //sessionState.editorCurrentFileName = file.name;
                this.loadFromToken(token);


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

                }

            } else if (sessionState && sessionState.editorCurrentFileToken && sessionState.editorCurrentFileName) {
                
                //setFileName(sessionState.editorCurrentFileName);

                this.loadFromToken(sessionState.editorCurrentFileToken);
 
            } else {
                // Loaded with no options, i.e. New File

                WinJS.Promise.timeout(1200).then(function () {

                    that.configureEditorFromSettings();
                    setSaved();

                });

            }
            
            
            sessionState.hasEditorChanged = false;
            window.addEventListener('resize', resized);
            this.setupAppBar();
            
        },
        // Cleans up the page
        unload: function () {

            var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
            dataTransferManager.removeEventListener("datarequested", this.dataRequestedForSharing);
            Windows.Storage.ApplicationData.current.removeEventListener("datachanged", this.configureEditorFromSettings);
            window.removeEventListener('resize', resized);
            this.removeKeyboardShortcuts();
            hideAppBar();
            hideSearch();
            

//            if (hasEditorChanged) {

//               this.unsavedFilePrompt();

//            }
            
            var sessionState = WinJS.Application.sessionState;

            sessionState.editorCurrentFileToken = null;
            sessionState.editorCurrentFileName = null;
            editor.destroy();
            editor = null;

        },
        //
        dataRequestedForSharing: function(e) {
            var request = e.request;
       
            try {

                var dataPackageTitle = getFileName();
                request.data.properties.title = dataPackageTitle;
                request.data.setText(editorSession.getDocument().getValue());
            
            } catch (e) {

                request.failWithDisplayText("There's no text to share in the document.");

            }
            
        },
        //
        // This is the start of all of the callbacks for buttons/appbar commands
        // 
        //
        //
        addKeyboardShortcuts: function () {

            WinJS.Application.addEventListener('Ctrl-N', cmdNewFile);
            WinJS.Application.addEventListener('Ctrl-F', openSearch);
            WinJS.Application.addEventListener('Ctrl-S', saveFile);
            WinJS.Application.addEventListener('Ctrl-Shift-S', saveFileToLocation);

        },
        //
        removeKeyboardShortcuts: function () {

            WinJS.Application.removeEventListener('Ctrl-N', cmdNewFile);
            WinJS.Application.removeEventListener('Ctrl-F', openSearch);
            WinJS.Application.removeEventListener('Ctrl-S', saveFile);
            WinJS.Application.removeEventListener('Ctrl-Shift-S', saveFileToLocation);

        },
        // 
        setupAppBar: function () {
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
                cmdPaste = document.getElementById('cmdPaste'),
                inputSearchTerms = document.getElementById('searchTerms'),
                inputReplaceTerms = document.getElementById('replaceTerms'),
                cmdOpenSettings = document.getElementById('cmdOpenSettings'),
                cmdMode = document.getElementById('cmdMode').winControl,
                selectMode = document.getElementById('editor-mode');


            cmdMode.flyout = document.getElementById("modeFlyout").winControl;

            selectMode.addEventListener('change', function (event) {

                var mode = event.target.value;
                
                editorSession.setMode(mode);
                editorSession.setMode('ace/mode/text');
                editorSession.setMode(mode);

                
            });

            //cmdNew.addEventListener('click', cmdNewFile);
            //cmdSave.addEventListener('click', saveFile);
            cmdSearch.addEventListener('click', openSearch);
            //cmdSaveAs.addEventListener('click', saveFileToLocation);
            cmdUndo.addEventListener('click', doUndo);
            cmdRedo.addEventListener('click', doRedo);
            cmdFindNext.addEventListener('click', findNext);
            cmdFindPrev.addEventListener('click', findPrev);
            cmdReplace.addEventListener('click', replace);
            cmdReplaceAll.addEventListener('click', replaceAll);
            cmdCopy.addEventListener('click', doCopy);
            cmdCut.addEventListener('click', doCut);
            cmdPaste.addEventListener('click', doPaste);

            cmdOpenSettings.addEventListener('click', doOpenSettings);

            searchTerms.addEventListener('keydown', this.inputSearchTermsKeydown);

            inputReplaceTerms.addEventListener('keydown', this.inputReplaceTermsKeydown);

        },
        // 
        inputReplaceTermsKeydown: function(e) {

            if (e.key === 'Enter') {

                replace();
                e.preventDefault();

            }

        },
        // 
        inputSearchTermsKeydown: function (e) {

            if (e.key === 'Enter') {

                findNext();
                e.preventDefault();
            }

        },
        //
        // This is the start of all the app bar set-up methods and callbacks
        // 
        // 
        loadFromToken: function (fileToken) {

            var sessionState = WinJS.Application.sessionState,
                that = this;

            sessionState.editorCurrentFileToken = fileToken;
        // this.editorCurrentFileToken = fileToken;
            // Configure and prepare the editor to receive the file's content
            this.configureEditorFromSettings();

            Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.getFileAsync(fileToken).then(function (retrievedFile) {

                sessionState.editorCurrentFileName = retrievedFile.name;
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

                that.configureEditorFromSettings();

                detectEditorModeFromExtension(getFileName());

                //editor.getSession().getDocument().setValue(contents);
                //that.editor.navigateTo(0, 0);
                //editor.navigateTo(0, 0);
                editor.navigateFileStart();

                editor.getSession().getUndoManager().reset();

                setSaved();

            });


        },
        //
        configureEditorFromSettings: function () {

            var editor = ace.edit("editor"),
                editorSession = editor.getSession(),
                settings = Windows.Storage.ApplicationData.current.localSettings.values;
        
            
            settings['fontSize'] = settings['fontSize'] || 12;
            settings['highlightActiveLine'] = (settings['highlightActiveLine'] === undefined ? false : settings['highlightActiveLine']);
            settings['showInvisibleCharacters'] = (settings['showInvisibleCharacters'] === undefined ? false : settings['showInvisibleCharacters']);
            settings['theme'] = settings['theme'] || 'ace/theme/tomorrow_night';
            settings['mode'] = settings['mode'] || 'ace/mode/text';
            settings['useHardTabs'] = (settings['useHardTabs'] === undefined ? true : settings['useHardTabs']);
            settings['showIndentGuides'] = (settings['showIndentGuides'] === undefined ? true : settings['showIndentGuides']);
            settings['showGutter'] = (settings['showGutter'] === undefined ? true : settings['showGutter']);
            settings['showPrintMargin'] = (settings['showPrintMargin'] === undefined ? false : settings['showPrintMargin']);

            
            //editorSession.setMode(settings['mode']);
            editor.setTheme(settings['theme']);
        
            var gutter = document.querySelector('.ace_gutter-layer');

            if (settings['showGutter']) {

                gutter.style.display = 'inherit';

            } else {

                gutter.style.display = 'none';

            }
            
            
            document.getElementById('editor').style.fontSize = settings['fontSize'] + 'px';
        
        
            editorSession.setUseWrapMode(true);
            editorSession.setTabSize(4);
            editorSession.setUseSoftTabs(settings['useHardTabs']);

            editor.setHighlightActiveLine(settings['highlightActiveLine']);
            editor.setShowInvisibles(settings['showInvisibleCharacters']);
            editor.setShowPrintMargin(settings['showPrintMargin']);
            editor.setTheme(settings['theme']);
            //editorSession.setMode('ace/mode/text');
            //editorSession.setMode(settings['mode']);
        

        },
        //
    });

    function resized() {

        var currentState = Windows.UI.ViewManagement.ApplicationView.value;
        if (currentState === Windows.UI.ViewManagement.ApplicationViewState.snapped) {

            setupSnappedView();

        } else {

            setupStandardView();

        }

    }

    function setupStandardView() {

        document.querySelector('.titlearea').removeEventListener('click', showHeaderMenu);
        document.querySelector('.titlecontainer').disabled = true;
        document.getElementById('filename').addEventListener('click', fileNameClick);

    }

    function setupSnappedView() {

        document.querySelector('.titlearea').addEventListener('click', showHeaderMenu);
        document.querySelector('.titlecontainer').disabled = false;
        document.getElementById('filename').removeEventListener('click', fileNameClick);

    }

    function showHeaderMenu() {
        var title = document.querySelector('.titlecontainer');
        var menu = document.getElementById('editorHeaderMenu').winControl;
        menu.anchor = title;
        menu.placement = 'bottom';

        menu.show();
    }

    // Callbacks need to be accessible to everybody within the (function{ ... })();
    // But functions that related to Ace/Editor can be either here or within the Page's scope

        //
        function findNext () {

            var searchTerms = document.getElementById('searchTerms').value,
                options = {};
        
            options.needle = searchTerms;
            options.backwards = false;

            if (searchTerms && searchTerms.length > 0) {

                editor.find(searchTerms, options, true);

            }

        }
        //
        function findPrev () {

            var searchTerms = document.getElementById('searchTerms').value,
                options = {};

            options.needle = searchTerms;
            options.backwards = true;
            if (searchTerms && searchTerms.length > 0) {

                editor.findPrevious(searchTerms, options, true);

            }

        }
        //
        function replace () {

            var searchTerms = document.getElementById('searchTerms').value,
                replaceTerms = document.getElementById('replaceTerms').value,
                options = {};
        
            options.needle = searchTerms;

            if (searchTerms && searchTerms.length > 0 && replaceTerms && replaceTerms.length > 0) {

                editor.replace(replaceTerms, options);

            }

        }
        // 
        function replaceAll () {

            var searchTerms = document.getElementById('searchTerms').value,
                replaceTerms = document.getElementById('replaceTerms').value,
                options = {};

            options.needle = searchTerms;
            if (searchTerms && searchTerms.length > 0 && replaceTerms && replaceTerms.length > 0) {

                editor.replaceAll(replaceTerms, options);

            }

        }



    // This method is used to both detect and set the mode (programming language) for Ace
    function detectEditorModeFromExtension (fileName) {

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
                    //console.log("Detected mode: " + fileTypes[x].mode);
                    // If the extension matches, set the editor's mode
                    // Set the found flag to true so we can stop looking for a match
                    editorSession.setMode(fileTypes[x].mode);
                    editorSession.setMode('ace/mode/text');
                    editorSession.setMode(fileTypes[x].mode);
                    document.getElementById('editor-mode').value = fileTypes[x].mode;
                    foundFlag = true;
                    break;

                }

            }

            if (foundFlag) {

                break;

            }

        }

        if (!foundFlag) {

            editorSession.setMode('ace/mode/text');
            document.getElementById('editor-mode').value = 'ace/mode/text';

        }

    }

    function setFileName (name) {
        var sessionState = WinJS.Application.sessionState;
        if (name != sessionState.editorCurrentFileName) {
            
            detectEditorModeFromExtension(name);

        }

        sessionState.editorCurrentFileName = name;
        document.getElementById('filename').innerHTML = name;

    }

    function getFileName () {

        var fileName = '',
            titleHead = document.getElementById('filename'),
            sessionState = WinJS.Application.sessionState;

        if (!sessionState.editorCurrentFileToken) {

            if (titleHead.firstChild.nodeType !== 1) {

                fileName = titleHead.innerHTML;

            } else {
                
                fileName = titleHead.firstChild.value;
                
            }
            //fileName = 'Untitled';

        } else {

            fileName = sessionState.editorCurrentFileName;

        }

        return fileName;

    }

    function setUnsaved () {

        var titleHeader = document.getElementById('filename'),
            backBtn = document.getElementById('backbutton'),
            sessionState = WinJS.Application.sessionState;
        titleHeader.style.fontStyle = 'italic';
        sessionState.hasEditorChanged = true;

        editorSession.removeEventListener('change', setUnsaved);
            
        backBtn.addEventListener('click', unsavedFilePrompt);

    }
    // 
    function setSaved () {

        var titleHeader = document.getElementById('filename'),
            backBtn = document.getElementById('backbutton'),
            sessionState = WinJS.Application.sessionState;
            
        titleHeader.style.fontStyle = 'normal';
        sessionState.hasEditorChanged = false;

        editorSession.addEventListener('change', setUnsaved);
            
        backBtn.removeEventListener('click', unsavedFilePrompt);

    }
    // 
    function saveFile () {
            
        saveFileContents(editor.getSession().getDocument().getValue());
        dismissAppBar();

    }

    function saveFileContents (contents) {

        var sessionState = WinJS.Application.sessionState,
            fileToken = sessionState.editorCurrentFileToken;

        if (fileToken) {

            Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.getFileAsync(fileToken).done(
                function (retrievedFile) {

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

    function cmdNewFile () {

        WinJS.Application.sessionState.editorCurrentFileToken = null;
        editor.getSession().getDocument().setValue('');
        setFileName('Untitled');

        editor.getSession().getUndoManager().reset();
        setUnsaved();
        
        //document.getElementById("filename").innerHTML = 'Untitled';
        dismissAppBar();
            
    }

    function openSearch () {

        var searchBar = document.getElementById('searchBar').winControl;
        searchBar.disabled = false;
        hideAppBar();
        searchBar.onafterhide = hideSearch;
        searchBar.show();

    }
    // Hides the search app bar
    function hideSearch () {

        var searchBar = document.getElementById('searchBar').winControl,
            appBar = document.getElementById('appBar').winControl;
        searchBar.disabled = true;
        appBar.disabled = false;
        
    }
    //
    function hideAppBar () {

        var appBar = document.getElementById("appBar").winControl;
        appBar.disabled = true;
    }
    //
    function dismissAppBar () {

        var appBar = document.getElementById("appBar").winControl;
        appBar.hide();

    }
    // 
    function showAppBar () {

        var appBar = document.getElementById("appBar").winControl;
        appBar.disabled = false;
        appBar.show();

    }
    //

    function doOpenSettings() {
                
        WinJS.UI.SettingsFlyout.showSettings("defaultsDiv", "/html/DefaultsUI.html");//, title: "Editor" },

    }

    function doUndo() {
        
        editor.undo();

    }

    function doRedo() {

        editor.redo();

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

        var dataPackage = new Windows.ApplicationModel.DataTransfer.DataPackage(),
            text = editor.getCopyText();
        
        if (text) {

            dataPackage.setText(text);
            Windows.ApplicationModel.DataTransfer.Clipboard.setContent(dataPackage);
            editor.insert('');

        }
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


    function hideFileNameInput() {

        var sessionState = WinJS.Application.sessionState,
            sessionFiles = sessionState.files;
        //console.log("Here!");
        var titleVal = document.getElementById('fileNameInput').value;
        //console.log(titleVal+' '+editorCurrentFileName+' '+editorCurrentFileToken);
        if (sessionState.editorCurrentFileToken && titleVal != sessionState.editorCurrentFileName) {

            Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.getFileAsync(sessionState.editorCurrentFileToken).then(function (retrievedFile) {

                retrievedFile.renameAsync(titleVal).done(function () {

                    // Need to refresh the file in the mruList
                    //Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.remove(sessionState.editorCurrentFileToken);
                    //sessionState.editorCurrentFileToken = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.add(retrievedFile, retrievedFile.name);

                    //

                    for (var x = 0; x < sessionFiles.length; x++) {

                        if (sessionFiles[x].token == sessionState.editorCurrentFileToken) {

                            sessionFiles[x].title = titleVal;
                            //sessionFiles.splice(x, 1);

                        }


                    }

                    /*sessionFiles.push({
                        icon: "images/filelogo.png",
                        title: retrievedFile.name,
                        textType: retrievedFile.displayType,
                        size: "",
                        // sourceIcon: "",
                        kind: "R",
                        token: sessionState.editorCurrentFileToken,
                    });*/

                    setFileName(titleVal);
                    //filenameTitle.innerHTML = titleVal;

                });

            });

        } else {
            
            //console.log("HERE");
            setFileName(titleVal);

        }

    }

    function fileNameClick() {

        var fileNameHead = document.getElementById('filename');
        if (fileNameHead.firstChild.nodeType !== 1) {

            var name = getFileName();
            fileNameHead.innerHTML = '';
            var textInput = document.createElement('input');
            textInput.setAttribute('id', 'fileNameInput');
            textInput.setAttribute('type', 'text');
            textInput.setAttribute('value', name);

            textInput.addEventListener('blur', hideFileNameInput);
            textInput.addEventListener('keydown', function (e) {

                if (e.key === 'Enter') {

                    //findNext();
                    e.preventDefault();
                }

            });
            fileNameHead.appendChild(textInput);
            textInput.focus();

        }
        
    }


    function saveFileToLocation() {

        var filenameInput = document.getElementById('filename'),
            contents = editor.getSession().getDocument().getValue(),
            sessionState = WinJS.Application.sessionState;


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
        savePicker.fileTypeChoices.insert(".css", [".css"]);
        savePicker.fileTypeChoices.insert(".cpp", [".cpp"]);
        savePicker.fileTypeChoices.insert(".h", [".h"]);
        savePicker.fileTypeChoices.insert(".html", [".html"]);
        savePicker.fileTypeChoices.insert(".java", [".java"]);
        savePicker.fileTypeChoices.insert(".js", [".js"]);
        savePicker.fileTypeChoices.insert(".json", [".json"]);
        savePicker.fileTypeChoices.insert(".jsp", [".jsp"]);
        savePicker.fileTypeChoices.insert(".md", [".md"]);
        savePicker.fileTypeChoices.insert(".sql", [".sql"]);
        savePicker.fileTypeChoices.insert(".php", [".php"]);
        savePicker.fileTypeChoices.insert(".pl", [".pl"]);
        savePicker.fileTypeChoices.insert(".ps1", [".ps1"]);
        savePicker.fileTypeChoices.insert(".psql", [".psql"]);
        savePicker.fileTypeChoices.insert(".py", [".py"]);
        savePicker.fileTypeChoices.insert(".rb", [".rb"]);
        savePicker.fileTypeChoices.insert(".xml", [".xml"]);

        savePicker.suggestedFileName = getFileName();

        savePicker.pickSaveFileAsync().then(function (file) {

            if (file) {
                // Prevent updates to the remote version of the file until we finish making changes and call CompleteUpdatesAsync.
                Windows.Storage.CachedFileManager.deferUpdates(file);
                Windows.Storage.FileIO.writeTextAsync(file, contents).then(function () {

                    Windows.Storage.CachedFileManager.completeUpdatesAsync(file).then( function (updateStatus) {
                      
                        if (updateStatus === Windows.Storage.Provider.FileUpdateStatus.complete) {
                            // Store the file in the MRU List
                            sessionState.editorCurrentFileToken = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.add(file, file.name);
                            //sessionState.editorCurrentFileName = file.name;
                            /*sessionState.files.push({
                                icon: "images/filelogo.png",
                                title: sessionState.editorCurrentFileName,
                                textType: file.displayType,
                                size: "",
                                // sourceIcon: "",
                                kind: "R",
                                token: sessionState.editorCurrentFileToken,
                            });*/

                            setFileName(file.name);
                            setSaved();

                        }
                        
                    });

                });
            }
        });

    }

    // 
    // Generate the dialog for attempting to navigate away from the page while the document is unsaved
    // 
    function unsavedFilePrompt () {
        // Create the message dialog and set its content
        var sessionState = WinJS.Application.sessionState,
            msg = new Windows.UI.Popups.MessageDialog("Do you want to save changes to " + sessionState.editorCurrentFileName + "?", "Unsaved Changes"),
            that = this;

        // Add commands and set their CommandIds
        msg.commands.append(new Windows.UI.Popups.UICommand("Save", function () {

            saveFileContents(editorSession.getDocument().getValue());

        }, 1));

        msg.commands.append(new Windows.UI.Popups.UICommand("Don't Save", function () {
                
            setSaved();
            // Set the saved flag, even though we don't save the file's content
            WinJS.Navigation.back();

        }, 2));

        msg.commands.append(new Windows.UI.Popups.UICommand("Cancel", function () {

            // Do nothing, just cancel

        }, 3));
            
        // Set the command that will be invoked by default (Cancel)
        msg.defaultCommandIndex = 3;

        // Show the message dialog
        msg.showAsync();

    }

})();