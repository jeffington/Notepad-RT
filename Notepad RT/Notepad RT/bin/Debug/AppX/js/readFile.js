function readFile(callbackWithContents) {
    Windows.Storage.FileIO.readTextAsync(sampleFile).then(callbackWithContents(contents));
}