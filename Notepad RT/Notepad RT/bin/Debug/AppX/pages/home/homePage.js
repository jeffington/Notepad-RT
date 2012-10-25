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

            });

            initRecentFiles();
            
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

                    editorCurrentFileToken = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.add(file, file.name);
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
                    console.log("File picker was cancelled.");

                }

            });
        }
    });

})();
function initRecentFiles() {
            
    var files = [];
    var mruCount = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.size,
        x;
    // icon, textName, textSize, textDate
            
    for (x = 0; x < mruCount; x++) {

        var currentFileEntry = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.getAt(x),
            currentFileData = currentFileEntry.metadata,
            currentFileToken = currentFileEntry.token;
                
        //currentFileDataOb = JSON.parse(currentFileData);
        //console.log(JSON.stringify(currentFileData.metadata));//.metadata.name);
                
        files[x] = {
            icon:"",
            textName: "",
            textType: "",
            //textPath: "",
        };
        Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.getFileAsync(currentFileToken).then(function (currentFile) {

            if (currentFile && files[x]) {
                // TODO: sometimes files[x] is undefined?!?!
                files[x].textName = currentFile.name;
                //files[x].textPath = currentFile.path;
                files[x].textType = currentFile.displayType;

                return currentFile.getThumbnailAsync(Windows.Storage.FileProperties.ThumbnailMode.documentsView);
            }
        }).then(function (thumb) {

            if (files[x] && thumb) {

                files[x].icon = URL.createObjectURL(thumb.cloneStream(), { oneTimeOnly: false });

            }

        });

    }

    var filesList = new WinJS.Binding.List(files);
    var recentFilesList = document.getElementById("imageTextListFile").winControl;
    //recentFilesList.layout = WinJS.UI.ListLayout;
    recentFilesList.selectionMode = WinJS.UI.SelectionMode.single;
    recentFilesList.itemDataSource = filesList.dataSource;
    //recentFilesList.itemTemplate = document.getElementById("imageTextListFileTemplate");
    recentFilesList.oniteminvoked = recentFilesSelection;
    recentFilesList.tapBehavior = WinJS.UI.TapBehavior.invokeOnly;
    recentFilesList.forceLayout();
            
            
}

function recentFilesSelection(event) {

    var recentFilesSelectionIndex = event.detail.itemIndex,
        mruSize = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.size,
        mruIndex = mruSize - recentFilesSelectionIndex - 1;
           

    editorCurrentFileToken = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.getAt(mruIndex).token;
    //Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.add(file);
    WinJS.Navigation.navigate("/pages/editor/editorPage.html", { filetoken: editorCurrentFileToken });

}