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

    var editor, editorSession, editorCurrentFileToken = null;

    var page = WinJS.UI.Pages.define("/pages/home/homePage.html", {
        ready: function (element, options) {



            var openFileButton = document.getElementById('openfile');
            var newFileButton = document.getElementById('newfile');
            //var filenameTitle = document.getElementById('filename');
            openFileButton.addEventListener('click', this._pickFile);
            newFileButton.addEventListener('click', function () {

                WinJS.Navigation.navigate("/pages/editor/editorPage.html");
                /*WinJS.Navigation.navigate("/pages/editorPage.html").then(function () {
                    setImmediate(function () {
                        console.log("TRIED TO LOAD EDITOR");
                        //document.getElementById("filename").innerHTML = "NEW DOCUMENT";
                    });
                });*/
            });

            this._initRecentFiles();
            
        },
       _initRecentFiles: function() {
            
            var files = [];
            var mruCount = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.length,
                x;
            // icon, textName, textSize, textDate
            
            for (x = 0; x < mruCount; x++) {
                var currentFileData = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.getAt(x).metadata;
                console.log(currentFileData);
                files.push({
                    icon:"",
                    textName: currentFileData.name,
                    textSize:"",
                    textDate:currentFileData.dateCreated,
                });
                /*currentFile.getThumbnailAsync(Windows.Storage.FileProperties.ThumbnailMode.documentsView, 60).done(
                    function (thumbnail) {
                        if (thumbnail) {

                            files[x].icon = thumbnail;

                        } else {

                            
                        }
                    },
                    function (error) {
                        WinJS.log && WinJS.log(SdkSample.errors.fail, "sample", "status");
                    }
                );*/
            }
            var filesList = new WinJS.Binding.List(files);
            var recentFilesList = document.getElementById("imageTextListFile").winControl;

            recentFilesList.itemDataSource = filesList.dataSource;
            recentFilesList.itemTemplate = document.getElementById("imageTextListFileTemplate");
            
            recentFilesList.forceLayout();
            
        },
        _pickFile: function () {
            var currentState = Windows.UI.ViewManagement.ApplicationView.value;
            if (currentState === Windows.UI.ViewManagement.ApplicationViewState.snapped &&
                !Windows.UI.ViewManagement.ApplicationView.tryUnsnap()) {
                // Fail silently if we can't unsnap
                return;
            }

            // Create the picker object and set options
            var openPicker = new Windows.Storage.Pickers.FileOpenPicker();
            openPicker.viewMode = Windows.Storage.Pickers.PickerViewMode.list;
            openPicker.suggestedStartLocation = Windows.Storage.Pickers.PickerLocationId.documentsLibrary;
            openPicker.fileTypeFilter.replaceAll(["*"]);

            // Open the picker for the user to pick a file
            openPicker.pickSingleFileAsync().then(function (file) {

                if (file) {
                    // Application now has read/write access to the picked file(s)

                    editorCurrentFileToken = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.add(file, {name: file.name, dateCreated: file.dateCreated});
                    Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.add(file);
                    WinJS.Navigation.navigate("/pages/editor/editorPage.html", {filetoken: editorCurrentFileToken}).done(function () {
                        //document.getElementById('filename').innerHTML = file.name;
                        //editorCurrentFileToken = file;
                        //document.getElementById('editor').innerHTML = contents;
                        //editor.getDocument().setContents(contents);
                    });


                    //console.log(outputString);

                } else {

                    // The picker was dismissed with no selected file
                    console.log("Operation cancelled.");

                }

            });
        }
    });
})();
