function pickFile() {
    // Clean scenario output
    // Verify that we are currently not snapped, or that we can unsnap to open the picker
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
            
            Windows.Storage.FileIO.readTextAsync(file).then(function (contents) {
                //console.log(contents);
                //editorSession.removeEventListener("change");
                WinJS.Navigation.navigate("/pages/editor/editorPage.html").done(function () {
                    document.getElementById('filename').innerHTML = file.name;
                    //editorCurrentFileToken = file;
                    document.getElementById('ace_editor').innerHTML = contents;
                    
                });
                
                //document.getElementById('editor').innerHTML = contents;
                //editorSession.addEventListener("change", saveFileContents);
            });
            
            //console.log(outputString);

        } else {

            // The picker was dismissed with no selected file
            console.log("Operation cancelled.");

        }

    });
}