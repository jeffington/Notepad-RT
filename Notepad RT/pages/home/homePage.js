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
    
    var page = WinJS.UI.Pages.define("/pages/home/homePage.html", {
        ready: function (element, options) {

            var openFileButton = document.getElementById('openFile');
            var newFileButton = document.getElementById('newFile');
            openFileButton.addEventListener('click', pickFile);
            newFileButton.addEventListener('click', launchEditor); // Pass them directory to editorPage.html with no arguments
            
            //WinJS.Promise.timeout(10, WinJS.Promise.as(initData));
            //setTimeout(initData, 100);
            window.addEventListener('resize', resized);
            initData();

        },
        unload: function () {

            window.removeEventListener('resize', resized);

        }
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
        recentFilesListView.layout = new WinJS.UI.GridLayout();
    }

    function setupSnappedView() {

        document.querySelector('.titlearea').addEventListener('click', showHeaderMenu);
        document.querySelector('.titlecontainer').disabled = false;
        document.getElementById('openFileMenuItem').addEventListener('click', pickFile);
        document.getElementById('newFileMenuItem').addEventListener('click', launchEditor);
        recentFilesListView.layout = new WinJS.UI.ListLayout();

    }

    function showHeaderMenu() {
        var title = document.querySelector('.titlecontainer');
        var menu = document.getElementById('homeHeaderMenu').winControl;
        menu.anchor = title;
        menu.placement = 'bottom';

        menu.show();
    }

})();

function badFileType(type) {
    // Create the message dialog and set its content

    var msg = new Windows.UI.Popups.MessageDialog("Notepad RT only opens supported source code and plain text files.", "Unsupported File Type");

    // Add commands and set their CommandIds
    msg.commands.append(new Windows.UI.Popups.UICommand("Ok", function () {

        // Do Nothing

    }, 1));

    msg.defaultCommandIndex = 1;

    // Show the message dialog
    msg.showAsync();

}

function launchEditor() {

    WinJS.Navigation.navigate("/pages/editor/editorPage.html");

}

function isValidFileType(file) {

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

    var x, y,
        numTypes = fileTypes.length,
        numExtensions,
        fileName = file.name,
        fileExtension = fileName.substring(fileName.lastIndexOf('.') + 1),
        validFileType = false;

    for (x = 0; x < numTypes; x++) {

        var extensions = fileTypes[x].exts,
            numExtensions = extensions.length;

        for (y = 0; y < numExtensions; y++) {

            if (fileExtension == extensions[y]) {

                validFileType = true;
                break;

            }

        }

    }

    if (file.contentType.match('text/') || file.contentType.length === 0) {

        validFileType = true;

    }

    return validFileType;

}

function pickFile() {

    
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
        var fileToken,
            fileInfo,
            sessionFileList = WinJS.Application.sessionState.files;
        
        if (file) {
            //console.log(file.contentType);
            
            if (isValidFileType(file)) {
            //if (file.contentType.match('text/') || file.contentType.length === 0) {
                // Application now has read/write access to the picked file(s)

                fileToken = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.add(file, file.name);
                //Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.add(file);

                WinJS.Navigation.navigate("/pages/editor/editorPage.html", { filetoken: fileToken });

            } else {

                badFileType(file.contentType);

            }

        } // Do nothing if a file wasn't picked

    });
}