var recentFilesDataSource, groupDataSource;
var recentFilesListView;


var fileListHeaders = [{ key: "R", type: "Recent", firstItemIndex: 0 }, ],
    files = [];



function initData() {

    var promiseArray = [];
    var fileInfo = [];

    var count = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.length;

    for (var x = 0; x < count; x++) {

        promiseArray.push(
            Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.getFileAsync(
                Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.getAt(x).token
                ).then(
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
                    //console.log('x: '+x);
                    //Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.remove(Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.getAt(x).token);
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
        //groupDataSource = new desertsDataSource(fileListHeaders);//recentFilesDataSource.createGrouped(getGroupKey, getGroupData, compareGroups);//new desertsDataSource(fileListHeaders);
        

        //console.log(document.getElementById("filesListView"));
        recentFilesListView = new WinJS.UI.ListView(document.getElementById("filesListView"), {
            itemDataSource: recentFilesDataSource.dataSource,//recentFilesDataSource.dataSource,
            //groupDataSource: groupDataSource,//groupDataSource.groups.dataSource,
            itemTemplate: document.getElementById("imageTextListFileTemplate"),
            //groupHeaderTemplate: document.getElementById("groupTemplate"),
            layout: new WinJS.UI.GridLayout(),
            selectionMode: WinJS.UI.SelectionMode.single,
            oniteminvoked: recentFilesSelection,
            tapBehavior: WinJS.UI.TapBehavior.invokeOnly,
            swipeBehavior: 'none',
        });
        //console.log("1");
        //recentFilesListView.forceLayout();
        //console.log("2");

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


function recentFilesSelection(event) {

    var recentFilesSelectionIndex = event.detail.itemIndex,
        mruSize = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.size,
        mruIndex = mruSize - recentFilesSelectionIndex - 1,
        selectedFileToken;


    selectedFileToken = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.getAt(mruIndex).token;
    //Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.add(file);
    WinJS.Navigation.navigate("/pages/editor/editorPage.html", { filetoken: selectedFileToken });

}

/*var filesDataAdapter = WinJS.Class.define(
    function () {
        // Constructor
        this.mruList = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList;
        this.entries = this.mruList.entries;
        this.size = this.entries.size;
        //this._itemData = data;
    },
    {
        getCount: function () {
            var that = this;
            return WinJS.Promise.wrap(that.size);
        },

        // Must return back an object containing fields:
        //   items: The array of items of the form:
        //      [{ key: key1, groupKey: group1, data : { field1: value, field2: value, ... }}, { key: key2, groupKey: group1, data : {...}}, ...]
        //   offset: The offset into the array for the requested item
        //   totalCount: (optional) Update the count for the collection
        itemsFromIndex: function (requestIndex, countBefore, countAfter) {

            var that = this;
            console.log("Requested index: " + requestIndex + " Before: " + countBefore + " After: " + countAfter);
            if (requestIndex >= that.size) {

                return WinJS.Promise.wrapError(new WinJS.ErrorFromName(WinJS.UI.FetchError.doesNotExist));

            }

            var promiseArray = [];
            var currentFileEntry = that.entries.getAt(requestIndex),
                currentFileToken = currentFileEntry.token;
            var currentFileInfo, currentFile;

            var lastFetchIndex = Math.min(requestIndex + countAfter, that.size - 1);
            var fetchIndex = Math.max(requestIndex - countBefore, 0);

            console.log("File info: " + JSON.stringify(files[requestIndex]));

            // return a promise for the results
            console.log("Returning data promise for index " + requestIndex);


            promiseArray.push(that.mruList.getFileAsync(currentFileToken).then(
                function (retrievedFile) {
                    currentFile = retrievedFile;
                    currentFileInfo = {
                        icon: "images/smallogo.png",
                        title: "",
                        textType: "",
                        kind: "R"
                    };

                    if (retrievedFile) {

                        currentFileInfo.title = retrievedFile.name;
                        currentFileInfo.textType = retrievedFile.displayType;

                        currentFile.getThumbnailAsync(Windows.Storage.FileProperties.ThumbnailMode.documentsView).then(function (thumb) {

                            currentFileInfo.icon = URL.createObjectURL(thumb, { oneTimeOnly: false });

                        });
                    }

                }, function (error) { // Deleted or possibly corrupted file, get it out of here and don't add it to the list

                    Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.remove(currentFileToken);
                    console.log(error + ' Error retrieving file, removed it from the mostRecentlyUsedList.');

                })
            );



            WinJS.Promise.join(promiseArray).then(function () {

                return WinJS.Promise.wrap({
                    items: [{
                        key: requestIndex, // the key for the item itself
                        groupKey: "R", // the key for the group for the item
                        data: currentFileInfo// the data fields for the item
                    }], // The array of items
                    offset: requestIndex - fetchIndex, // The offset into the array for the requested item
                });

            });

        }
    });

// Create a DataSource by deriving and wrapping the data adapter with a VirtualizedDataSource
var filesDataSource = WinJS.Class.derive(WinJS.UI.VirtualizedDataSource, function (data) {
    this._baseDataSourceConstructor(new filesDataAdapter(data));
});

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
*/