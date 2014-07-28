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
    
    var page = WinJS.UI.Pages.define( "/pages/home/homePage.html", {
        ready: function (element, options) {

            var openFileButton = document.getElementById('openFile');
            var newFileButton = document.getElementById('newFile');
            openFileButton.addEventListener('click', pickFile);
            newFileButton.addEventListener('click', launchEditor); // Pass them directory to editorPage.html with no arguments
            
            //WinJS.Promise.timeout(10, WinJS.Promise.as(initData));
            //setTimeout(initData, 100);
            initData();
            setupStandardOrSnappedView();
            window.addEventListener('resize', setupStandardOrSnappedView);
            

        },
        unload: function () {

            window.removeEventListener('resize', setupStandardOrSnappedView);

        }
    });

    function setupStandardOrSnappedView() {

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
function launchEditor() {

    WinJS.Navigation.navigate("/pages/editor/editorPage.html");

}

/*
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
            exts: ["go"],
            mode: "ace/mode/golang",
        },
        {
            exts: ["groovy"],
            mode: "ace/mode/groovy",

        },
        {
            exts: ["hx"],
            mode: "ace/mode/haxe",

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
            exts: ["xq", "xqy", "xquery"],
            mode: "ace/mode/xquery",
        },
        {
            exts: ["c", "cc", "cxx", "cpp", "h"],
            mode: "ace/mode/c_cpp",
        },
        {
            exts: ["clj"],
            mode: "ace/mode/clojure",
        },
        {
            exts: ["coffee"],
            mode: "ace/mode/coffee",
        },
        {
            exts: ["cs", "asp"],
            mode: "ace/mode/csharp",
        },
        {
            exts: ["cfc"],
            mode: "ace/mode/coldfusion",
        },
        {
            exts: ["ts"],
            mode: "ace/mode/typescript"
        },
        {
            exts: ["dart"],
            mode: "ace/mode/dart",
        },
        {
            exts: ["r"],
            mode: "ace/mode/r",
        },
        {
            exts: ["rdoc"],
            mode: "ace/mode/rdoc",
        },
        {
            exts: ["rhtml"],
            mode: "ace/mode/rhtml",
        },
        {
            exts: ["jade"],
            mode: "ace/mode/jade",
        },
        {
            exts: ["glslv", "glslf", "vert", "frag"],
            mode: "ace/mode/glsl",
        },
        {
            exts: ["jsx"],
            mode: "ace/mode/jsx",
        },
        {
            exts: ["latex", "tex"],
            mode: "ace/mode/latex",
        },
        {
            exts: ["liquid"],
            mode: "ace/mode/liquid",
        },
        {
            exts: ["less"],
            mode: "ace/mode/less",
        },
        {
            exts: ["lua"],
            mode: "ace/mode/lua",
        },
        {
            exts: ["lp"],
            mode: "ace/mode/luapage",
        },
        {
            exts: ["json"],
            mode: "ace/mode/json",
        },
        {
            exts: ["ocaml", "ml", "mli"],
            mode: "ace/mode/ocaml",
        },
        {
            exts: ["rb", "rbw"],
            mode: "ace/mode/ruby",
        },
        {
            exts: ["scala"],
            mode: "ace/mode/scala",
        },
        {
            exts: [".sass", ".scss"],
            mode: "ace/mode/scss",
        },
        {
            exts: ["sh"],
            mode: "ace/mode/sh",
        },
        {
            exts: ["sql"],
            mode: "ace/mode/sql",
        },
        {
            exts: ["scad"],
            mode: "ace/mode/scad",
        },
        {
            exts: ["svg"],
            mode: "ace/mode/svg",
        },
        {
            exts: ["psql"],
            mode: "ace/mode/pgsql",
        },
        {
            exts: ["tcl"],
            mode: "ace/mode/tcl",
        },
        {
            exts: ["textile"],
            mode: "ace/mode/textile",
        },
        {
            exts: ["yaml"],
            mode: "ace/mode/yaml",

        }
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
/*
    This was used to prevent the user from opening files that we didn't support or couldn't do anything about. (e.g. executables)
    It was a bad solution because it was based on file extension.  This is because the StorageFile class gives us so little information
    about the file.  This may be revisited later.
*/

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
    openPicker.fileTypeFilter.replaceAll( [ "*"]);

    // Open the picker for the user to pick a file
    openPicker.pickSingleFileAsync().then( function( file) {
        var fileToken,
            fileInfo,
            sessionFileList = WinJS.Application.sessionState.files;
        
        if ( file) {
            //console.log(file.contentType);
            
            //if (isValidFileType(file)) {
            //if (file.contentType.match('text/') || file.contentType.length === 0) {
                // Application now has read/write access to the picked file(s)

                fileToken = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.add( file, file.name);
                //Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.add(file);

                WinJS.Navigation.navigate( "/pages/editor/editorPage.html", { filetoken: fileToken });

            /*} else {

                badFileType(file.contentType);

            }*/

        } // Do nothing if a file wasn't picked

    });
}