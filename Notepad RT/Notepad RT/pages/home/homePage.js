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

    var recentFilesDataSource, groupDataSource;
    var recentFilesListView;


    var fileListHeaders = [{ key: "R", type: "Recent", firstItemIndex: 0 }, ],
        files = [];

    var page = WinJS.UI.Pages.define("/pages/home/homePage.html", {
        ready: function (element, options) {

            var openFileButton = document.getElementById('openfile');
            var newFileButton = document.getElementById('newfile');
            openFileButton.addEventListener('click', this._pickFile);
            newFileButton.addEventListener('click', function () {

                WinJS.Navigation.navigate("/pages/editor/editorPage.html");

            }); // Pass them directory to editorPage.html with no arguments
            console.log("Page shown");
            initData();
            
            
            //setTimeout(function () { recentFilesListView.forceLayout(); }, 4000);
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
                var token;
                if (file) {
                    // Application now has read/write access to the picked file(s)

                    token = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.add(file, file.name);
                    Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.add(file);
                    WinJS.Navigation.navigate("/pages/editor/editorPage.html", {filetoken: token});

                } // Do nothing if a file wasn't picked

            });
        }
    });

    var flavorsDataAdapter = WinJS.Class.define(
        function (data) {
            // Constructor
            this._itemData = data;
        },
        {
            getCount: function () {
                var that = this;
                return WinJS.Promise.wrap(that._itemData.length);
            },

            // Must return back an object containing fields:
            //   items: The array of items of the form:
            //      [{ key: key1, groupKey: group1, data : { field1: value, field2: value, ... }}, { key: key2, groupKey: group1, data : {...}}, ...]
            //   offset: The offset into the array for the requested item
            //   totalCount: (optional) Update the count for the collection
            itemsFromIndex: function (requestIndex, countBefore, countAfter) {
                var mruList = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList,
                    entries = mruList.entries;
                 //   count = mruList.entries.length,
                var that = this;
                //console.log("Requested: " + requestIndex);
                if (requestIndex >= that._itemData.length) {// || count == 0) {//that._itemData.length) {
                    return WinJS.Promise.wrapError(new WinJS.ErrorFromName(WinJS.UI.FetchError.doesNotExist));
                }


                var currentFileEntry = entries.getAt(requestIndex),
                    currentFileToken = currentFileEntry.token;
                
                var lastFetchIndex = Math.min(requestIndex + countAfter, that._itemData.length - 1);
                var fetchIndex = Math.max(requestIndex - countBefore, 0);
                
                console.log("File info: " + JSON.stringify(files[requestIndex]));
                
                // return a promise for the results
                console.log("Returning data promise for index " + requestIndex);
                return WinJS.Promise.wrap({
                    items: [{
                        key: requestIndex, // the key for the item itself
                        groupKey: "R", // the key for the group for the item
                        data: files[requestIndex]// the data fields for the item
                    }], // The array of items
                    offset: requestIndex - fetchIndex, // The offset into the array for the requested item
                                
                });
                
            }
        });

    // Create a DataSource by deriving and wrapping the data adapter with a VirtualizedDataSource
    var flavorsDataSource = WinJS.Class.derive(WinJS.UI.VirtualizedDataSource, function (data) {
        this._baseDataSourceConstructor(new flavorsDataAdapter(data));
    });


    //
    // Groups Data Adapter
    //
    // Data adapter for the groups. Follows the same pattern as the items data adapter, but each item is a group.
    // The main concerns when creating a data adapter for groups are:
    // *  Groups can be enumerated by key or index, so the adapter needs to implement both itemsFromKey and itemsFromIndex
    // *  Each group should supply a firstItemIndexHint which is the index of the first item in the group. This enables listview
    //    to figure out the position of an item in the group so it can get the columns correct.
    //
    var desertsDataAdapter = WinJS.Class.define(
        function (groupData) {
            // Constructor
            this._groupData = groupData;
        },

        // Data Adapter interface methods
        // These define the contract between the virtualized datasource and the data adapter.
        // These methods will be called by virtualized datasource to fetch items, count etc.
        {
            // This example only implements the itemsFromIndex, itemsFromKey and count methods

            // Called to get a count of the items, this can be async so return a promise for the count
            getCount: function () {
                var that = this;
                return WinJS.Promise.wrap(that._groupData.length);
            },

            // Called by the virtualized datasource to fetch a list of the groups based on group index
            // It will request a specific group and hints for a number of groups either side of it
            // The implementation should return the specific group, and can choose how many either side
            // to also send back. It can be more or less than those requested.
            //
            // Must return back an object containing fields:
            //   items: The array of groups of the form:
            //      [{ key: groupkey1, firstItemIndexHint: 0, data : { field1: value, field2: value, ... }}, { key: groupkey2, firstItemIndexHint: 27, data : {...}}, ...
            //   offset: The offset into the array for the requested group
            //   totalCount: (optional) an update of the count of items
            itemsFromIndex: function (requestIndex, countBefore, countAfter) {
                var that = this;

                if (requestIndex >= that._groupData.length) {
                    return Promise.wrapError(new WinJS.ErrorFromName(UI.FetchError.doesNotExist));
                }

                var lastFetchIndex = Math.min(requestIndex + countAfter, that._groupData.length - 1);
                var fetchIndex = Math.max(requestIndex - countBefore, 0);
                var results = [];

                // form the array of groups
                for (var i = fetchIndex; i <= lastFetchIndex; i++) {
                    var group = that._groupData[i];
                    results.push({
                        key: group.key,
                        firstItemIndexHint: group.firstItemIndex,
                        data: group
                    });
                }
                return WinJS.Promise.wrap({
                    items: results, // The array of items
                    offset: requestIndex - fetchIndex, // The offset into the array for the requested item
                    totalCount: that._groupData.length // The total count
                });
            },

            // Called by the virtualized datasource to fetch groups based on the group's key
            // It will request a specific group and hints for a number of groups either side of it
            // The implementation should return the specific group, and can choose how many either side
            // to also send back. It can be more or less than those requested.
            //
            // Must return back an object containing fields:
            //   [{ key: groupkey1, firstItemIndexHint: 0, data : { field1: value, field2: value, ... }}, { key: groupkey2, firstItemIndexHint: 27, data : {...}}, ...
            //   offset: The offset into the array for the requested group
            //   absoluteIndex: the index into the list of groups of the requested group
            //   totalCount: (optional) an update of the count of items
            itemsFromKey: function (requestKey, countBefore, countAfter) {
                var that = this;
                var requestIndex = null;

                // Find the group in the collection
                for (var i = 0, len = that._groupData.length; i < len; i++) {
                    if (that._groupData[i].key === requestKey) {
                        requestIndex = i;
                        break;
                    }
                }
                if (requestIndex === null) {
                    return WinJS.Promise.wrapError(new WinJS.ErrorFromName(WinJS.UI.FetchError.doesNotExist));
                }

                var lastFetchIndex = Math.min(requestIndex + countAfter, that._groupData.length - 1);
                var fetchIndex = Math.max(requestIndex - countBefore, 0);
                var results = [];

                //iterate and form the collection of the results
                for (var j = fetchIndex; j <= lastFetchIndex; j++) {
                    var group = that._groupData[j];
                    results.push({
                        key: group.key, // The key for the group
                        firstItemIndexHint: group.firstItemIndex, // The index into the items for the first item in the group
                        data: group // The data for the specific group
                    });
                }

                // Results can be async so the result is supplied as a promise
                
                return WinJS.Promise.wrap({
                    items: results, // The array of items
                    offset: requestIndex - fetchIndex, // The offset into the array for the requested item
                    absoluteIndex: requestIndex, // The index into the collection of the item referenced by key
                    totalCount: that._groupData.length // The total length of the collection
                });
            },

        });

    // Create a DataSource by deriving and wrapping the data adapter with a VirtualizedDataSource
    var desertsDataSource = WinJS.Class.derive(WinJS.UI.VirtualizedDataSource, function (data) {
        this._baseDataSourceConstructor(new desertsDataAdapter(data));
    });

    function initData() {

        var promiseArray = [];
        var fileInfo = [];

        var mruList = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList,
            entries = mruList.entries,
            count = mruList.entries.length;
            //that = this;
        
        
        /*var library = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries;
        var query = library.createFileQuery(Windows.Storage.Search.CommonFileQuery.orderByDate);
        var delayLoad = true; // Depends on if/when/how fast you want your thumbnails
        var access = new Windows.Storage.BulkAccess.FileInformationFactory(
            query, Windows.Storage.FileProperties.ThumbnailMode.picturesView,
            Math.max(app.settings.itemHeight, app.settings.itemWidth),
            Windows.Storage.FileProperties.ThumbnailOptions.returnOnlyIfCached,
            delayLoad);

        access.getFilesAsync(start, page).then(function (files) {

            var count = files.length;
            for (var i = 0; i < count; i++) {

                console.log(files[i].name + " - " + files[i].imageProperties.dateTaken);
                // The more 'extra' properties you're accessing, the better the perf gains
                fileInfo[x] = {
                    icon: files[i].imageProperties,
                    title: files[i].name,
                    textType: files[i].displayType,
                    kind: "R"
                };
                console.log(files[i].imageProperties);
            }
            files = fileInfo;

            recentFilesListView = new WinJS.UI.ListView(document.getElementById("filesListView"), {
                itemDataSource: recentFilesDataSource.dataSource,
                //groupDataSource: groupDataSource.groups.dataSource,
                itemTemplate: document.getElementById("imageTextListFileTemplate"),
                groupHeaderTemplate: document.getElementById("groupTemplate"),
                layout: new WinJS.UI.GridLayout(),
                selectionMode: WinJS.UI.SelectionMode.single,
                oniteminvoked: recentFilesSelection,
                tapBehavior: WinJS.UI.TapBehavior.invokeOnly,
                swipeBehavior: 'none',
            });
        });*/

        for (var x = 0; x < count; x++) {

            var currentFileEntry = entries.getAt(x),
                currentFileData = currentFileEntry.metadata,
                currentFileToken = currentFileEntry.token;

            promiseArray.push(Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.getFileAsync(currentFileToken).then(
                    function (currentFile) {

                        fileInfo[x] = {
                            icon: "images/smallogo.png",
                            title: "",
                            textType: "",
                            kind: "R"
                        };

                        if (currentFile) {

                            fileInfo[x].title = currentFile.name;
                            fileInfo[x].textType = currentFile.displayType;

                            return currentFile.getThumbnailAsync(Windows.Storage.FileProperties.ThumbnailMode.documentsView);
                        }

                    }, function (error) { // Deleted or possibly corrupted file, get it out of here and don't add it to the list
                        
                        Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.remove(currentFileToken);
                        console.log(error + ' Error retrieving file, removed it from the mostRecentlyUsedList.');
                        
                    }).then(function (thumb) {
                        
                        if (thumb && fileInfo[x]) {
                            console.log("Index: " + x + " " + (fileInfo ? JSON.stringify(fileInfo[x]) : "fileInfo is undefined"));
                            fileInfo[x].icon = URL.createObjectURL(thumb, { oneTimeOnly: false });

                        }
                        
                        

                        
                    })
            );
        }


        WinJS.Promise.join(promiseArray).done(function () {

            files = fileInfo;
            recentFilesDataSource = new WinJS.Binding.List(files); //new flavorsDataSource(files);
            groupDataSource = recentFilesDataSource.createGrouped(getGroupKey, getGroupData, compareGroups);//new desertsDataSource(fileListHeaders);

            

            recentFilesListView = new WinJS.UI.ListView(document.getElementById("filesListView"), {
                itemDataSource: recentFilesDataSource.dataSource,
                //groupDataSource: groupDataSource.groups.dataSource,
                itemTemplate: document.getElementById("imageTextListFileTemplate"),
                groupHeaderTemplate: document.getElementById("groupTemplate"),
                layout: new WinJS.UI.GridLayout(),
                selectionMode: WinJS.UI.SelectionMode.single,
                oniteminvoked: recentFilesSelection,
                tapBehavior: WinJS.UI.TapBehavior.invokeOnly,
                swipeBehavior: 'none',
            });

            recentFilesListView.forceLayout();


        });
    }

    function compareGroups(left, right) {
        return 0;//left.toUpperCase().charCodeAt(0) - right.toUpperCase().charCodeAt(0);
    }

    // Function which returns the group key that an item belongs to
    function getGroupKey(dataItem) {
        //console.log(JSON.stringify(dataItem));
        return 'R';
    }

    // Function which returns the data for a group
    function getGroupData(dataItem) {
        /*return {
            // the key for the item itself
            groupKey: "R", // the key for the group for the item
            item: dataItem,// the data fields for the item
            title: 'Recent',
            //groupDescription: 'Recent Group'//dataItem.title.toUpperCase().charAt(0)
        };*/
        return { groupKey: "R", groupTitle: "Recent", firstItemIndex: 0 }
    }

})();


function recentFilesSelection(event) {

    var recentFilesSelectionIndex = event.detail.itemIndex,
        mruSize = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.size,
        mruIndex = mruSize - recentFilesSelectionIndex - 1,
        selectedFileToken;
           

    selectedFileToken = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.getAt(mruIndex).token;
    //Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.add(file);
    WinJS.Navigation.navigate("/pages/editor/editorPage.html", { filetoken: selectedFileToken });

}