var recentFilesSource, groupDataSource;
var recentFilesListView;


var fileListHeaders = [{ key: "R", type: "Recent", firstItemIndex: 0 }, ];
//    files = [];

function initData() {

    recentFilesSource = new recentFilesDataSource();
    //groupDataSource = new fileGroupDataSource();
    
    recentFilesListView = new WinJS.UI.ListView(document.getElementById("filesListView"), {
        itemDataSource: recentFilesSource,//.dataSource,//recentFilesDataSource.dataSource,
        //groupDataSource: groupDataSource,//.groups.dataSource,//groupDataSource,//.groupDataSource,//DataSource.dataSource,//groupDataSource.groups.dataSource,
        itemTemplate: document.getElementById("imageTextListFileTemplate"),
        //groupHeaderTemplate: document.getElementById("groupHeaderTemplate"),
        layout: new WinJS.UI.GridLayout(),
        selectionMode: WinJS.UI.SelectionMode.single,
        oniteminvoked: recentFilesSelection,
        tapBehavior: WinJS.UI.TapBehavior.invokeOnly,
        swipeBehavior: 'none',
    });
    

}

function recentFilesSelection(event) {

    var recentFilesSelectionIndex = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.size - event.detail.itemIndex - 1,
        selectedFileToken = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.getAt(recentFilesSelectionIndex).token;
        //selectedFileName = sessionFileList[recentFilesSelectionIndex].title;

    console.log('Size: ' + Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.size + ' selected: ' + recentFilesSelectionIndex);

    WinJS.Navigation.navigate("/pages/editor/editorPage.html", { filetoken: selectedFileToken});

}

var recentFilesDataAdapter = WinJS.Class.define(
    function () { //groupData) {
        // Constructor
        //this._groupData = groupData;
    },
    {
        // This example only implements the itemsFromIndex, itemsFromKey and count methods

        // Called to get a count of the items, this can be async so return a promise for the count
        getCount: function () {
            //var that = this;

            return WinJS.Promise.wrap(Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.size);
            //that._groupData.length);

        },
        // Must return back an object containing fields:
        //   items: The array of groups of the form:
        //      [{ key: groupkey1, firstItemIndexHint: 0, data : { field1: value, field2: value, ... }}, { key: groupkey2, firstItemIndexHint: 27, data : {...}}, ...
        //   offset: The offset into the array for the requested group
        //   totalCount: (optional) an update of the count of items
        //var lastFetchIndex = Math.min(requestIndex + countAfter, that._groupData.length - 1);
        //var fetchIndex = Math.max(requestIndex - countBefore, 0);
        //var results = [];
        itemsFromIndex: function (requestIndex, countBefore, countAfter) {

            var that = this;

            var fetchIndex = Math.max(requestIndex - countBefore, 0);

            //console.log("Fetching: " + fetchIndex + " " + that.getCount());

            if (fetchIndex >= Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.size) {

                return WinJS.Promise.wrapError(new WinJS.ErrorFromName(WinJS.UI.FetchError.doesNotExist));

            }

            

            
            var token = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.getAt(fetchIndex).token;
            

            

            var currentObject;

            return Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.getFileAsync(token).then(function (currentFile) {

                currentObject = {
                    items: [
                        {
                            key: requestIndex.toString(),
                            //firstItemIndexHint: 0,
                            groupKey: 'R',
                            data: {
                                icon: "images/filelogo.png",
                                title: currentFile.name,
                                textType: currentFile.displayType,
                                size: "",
                                // sourceIcon: "",
                                kind: "R",
                                token: token,
                            }

                        }
                    ],
                    offset: requestIndex - fetchIndex,
                    
                }

                return currentFile.getThumbnailAsync(Windows.Storage.FileProperties.ThumbnailMode.documentsView);
                

                
            }).then(function(thumb) {

                currentObject.items[0].data.icon = URL.createObjectURL(thumb, { oneTimeOnly: false });
                currentObject.items[0].data.thumbReady = "visible";
                return WinJS.Promise.wrap(currentObject);

            });
            
        },
    });

// Create a DataSource by deriving and wrapping the data adapter with a VirtualizedDataSource
var recentFilesDataSource = WinJS.Class.derive(WinJS.UI.VirtualizedDataSource, function () {//data) {
    this._baseDataSourceConstructor(new recentFilesDataAdapter());//data));
});

var fileGroupDataAdapter = WinJS.Class.define(
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
            return WinJS.Promise.wrap(1);
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
            //var that = this;

            console.log("group request index: " + requestIndex);

            if (requestIndex > 1) {
                return Promise.wrapError(new WinJS.ErrorFromName(UI.FetchError.doesNotExist));
            }

            //var lastFetchIndex = Math.min(requestIndex + countAfter, that._groupData.length - 1);
            var fetchIndex = Math.max(requestIndex - countBefore, 0);
            
            return WinJS.Promise.wrap({
                items: [
                    {
                        key: "R",
                        firstItemIndexHint: 0,
                        data: {
                            key: "R",
                            groupTitle: "Recent",
                            groupDetails: Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.size + ' files',
                        }

                    }
                    
                ], // The array of items
                offset: requestIndex - fetchIndex, // The offset into the array for the requested item
                totalCount: 1//that._groupData.length // The total count
            });
        },

        itemsFromKey: function (requestKey, countBefore, countAfter) {
            var that = this;
            var requestIndex = 0;

            console.log("Groups request key: " + requestKey);

            //var lastFetchIndex = Math.min(requestIndex + countAfter, that._groupData.length - 1);
            var fetchIndex = Math.max(requestIndex - countBefore, 0);

            return WinJS.Promise.wrap({
                items: [
                    {
                        key: "R",
                        groupTitle: "Recent",
                        groupDetails: Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.size + ' files',
                        firstItemIndex: 0,
                        
                    }
                ], // The array of items
                offset: requestIndex - fetchIndex, // The offset into the array for the requested item
                absoluteIndex: requestIndex,
                totalCount: 1//that._groupData.length // The total count
            });
        },

    });

// Create a DataSource by deriving and wrapping the data adapter with a VirtualizedDataSource
var fileGroupDataSource = WinJS.Class.derive(WinJS.UI.VirtualizedDataSource, function () {
    this._baseDataSourceConstructor(new fileGroupDataAdapter());
});