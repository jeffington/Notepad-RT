function saveFileContents() {
    var fileToken = editorCurrentFileToken,
        contents = editorSession.getDocument().getValue();

    if (fileToken) {

        console.log("Saving file...");
        editorSession.removeEventListener("change");

        Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.getFileAsync(fileToken).done(
            function (retrievedFile) {
                // Process retrieved file

                Windows.Storage.FileIO.writeTextAsync(file, contents).then(function () {

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