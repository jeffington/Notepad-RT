var recentFilesDataSource, groupDataSource;
var recentFilesListView;


var fileListHeaders = [{ key: "R", type: "Recent", firstItemIndex: 0 }, ];
//    files = [];

function populateSessionFileListFromMRU() {

    var promiseArray = [],
        fileInfo = [],
        count = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.length,
        //sessionFileList = WinJS.Application.sessionState.files,
        entries = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries,
        x;

    for (x = 0; x < count; x++) {

        fileInfo[x] = {
            icon: "images/filelogo.png",
            title: "",
            textType: "",
            size: "",
            // sourceIcon: "",
            kind: "R",
            token: Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.getAt(x).token,
        };

        console.log('Created file item at index '+x);

        promiseArray[x] = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.getFileAsync(fileInfo[x].token).then(function (currentFile) {

            console.log('x: ' + x + ' name: '+currentFile.name);
            fileInfo[x].title = currentFile.name;
            fileInfo[x].textType = currentFile.displayType;

            //return currentFile.getThumbnailAsync(Windows.Storage.FileProperties.ThumbnailMode.documentsView);
            console.log(JSON.stringify(fileInfo[x]) + ' x: '+ x);
            

        }, function (error) { // Deleted or possibly corrupted file, get it out of here and don't add it to the list

            //Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.remove(Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.getAt(x).token);
            console.log(error + ' Error retrieving file from the mostRecentlyUsedList at index ' + x + '.');
            //fileInfo.splice(x, 1);

        });

    }


    WinJS.Promise.join(promiseArray).then(function () {

        var sessionState = WinJS.Application.sessionState;

        sessionState.files = fileInfo;
        //console.log('WinJS.Application.sessionState.files 1: ' + sessionFileList);
        recentFilesDataSource = new WinJS.Binding.List(sessionState.files || []);
            //groupDataSource = recentFilesDataSource.createGrouped(getGroupKey, getGroupData, compareGroups);//new desertsDataSource(fileListHeaders);//new WinJS.Binding.List(fileListHeaders);//recentFilesDataSource.createGrouped(getGroupKey, getGroupData, compareGroups);//new desertsDataSource(fileListHeaders);//new desertsDataSource(fileListHeaders);
        //}

        recentFilesListView = new WinJS.UI.ListView(document.getElementById("filesListView"), {
            itemDataSource: recentFilesDataSource.dataSource,//recentFilesDataSource.dataSource,
            //groupDataSource: groupDataSource.groups.dataSource,//groupDataSource,//.groupDataSource,//DataSource.dataSource,//groupDataSource.groups.dataSource,
            itemTemplate: document.getElementById("imageTextListFileTemplate"),
            groupHeaderTemplate: document.getElementById("groupHeaderTemplate"),
            layout: new WinJS.UI.GridLayout(),
            selectionMode: WinJS.UI.SelectionMode.single,
            oniteminvoked: recentFilesSelection,
            tapBehavior: WinJS.UI.TapBehavior.invokeOnly,
            swipeBehavior: 'none',
        });


    }).done(function () {

        loadThumbnails();

    });

}

function loadThumbnails() {

    var sessionStateFiles = WinJS.Application.sessionState.files,
        count = sessionStateFiles.length,
        x;

    for (x = 0; x < count; x++) {

        Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.getFileAsync(sessionStateFiles[x].token).then(function (currentFile) {

            return currentFile.getThumbnailAsync(Windows.Storage.FileProperties.ThumbnailMode.documentsView);


        }).then(function (thumb) {

            if (thumb && sessionStateFiles[x]) {

                console.log("Index: " + x + " " + JSON.stringify(sessionStateFiles[x]));
                sessionStateFiles[x].icon = URL.createObjectURL(thumb, { oneTimeOnly: false });

            }

        });
    }

}

/*function initData() {

    //var sessionFileList = WinJS.Application.sessionState.files;
    // TODO: Need some logic here to determine whether or not the data changed

    if (sessionFileList && sessionFileList.length > 0) {

        // Set up the listView from the session data
        console.log("We have the file info.");

        recentFilesDataSource = new desertsDataAdapter();//new WinJS.Binding.List(sessionFileList);

        recentFilesListView = new WinJS.UI.ListView(document.getElementById("filesListView"), {
            itemDataSource: recentFilesDataSource.dataSource,//recentFilesDataSource.dataSource,
            //groupDataSource: groupDataSource.groups.dataSource,//groupDataSource,//.groupDataSource,//DataSource.dataSource,//groupDataSource.groups.dataSource,
            itemTemplate: document.getElementById("imageTextListFileTemplate"),
            groupHeaderTemplate: document.getElementById("groupHeaderTemplate"),
            layout: new WinJS.UI.GridLayout(),
            selectionMode: WinJS.UI.SelectionMode.single,
            oniteminvoked: recentFilesSelection,
            tapBehavior: WinJS.UI.TapBehavior.invokeOnly,
            swipeBehavior: 'none',
        });
        
        WinJS.Promise.timeout().then(function () {

            loadThumbnails();

        });

    } else {
        
        populateSessionFileListFromMRU();

    }

} /* This is the initData() method using the old and shitty List.Bind */

function initData() {

    recentFilesDataSource = new desertsDataSource();

    /*
    recentFilesListView = new WinJS.UI.ListView(document.getElementById("filesListView"), {
        itemDataSource: recentFilesDataSource,//.dataSource,//recentFilesDataSource.dataSource,
        //groupDataSource: groupDataSource.groups.dataSource,//groupDataSource,//.groupDataSource,//DataSource.dataSource,//groupDataSource.groups.dataSource,
        itemTemplate: document.getElementById("imageTextListFileTemplate"),
        groupHeaderTemplate: document.getElementById("groupHeaderTemplate"),
        layout: new WinJS.UI.GridLayout(),
        selectionMode: WinJS.UI.SelectionMode.single,
        oniteminvoked: recentFilesSelection,
        tapBehavior: WinJS.UI.TapBehavior.invokeOnly,
        swipeBehavior: 'none',
    });
    /*  */

    recentFilesListView = new WinJS.UI.ListView(document.getElementById("filesListView"), {
        itemDataSource: recentFilesDataSource,
        //groupDataSource: groupDataSource,
        itemTemplate: document.getElementById("imageTextListFileTemplate"),
        //groupHeaderTemplate: document.getElementById("groupHeaderTemplate"),
        layout: new WinJS.UI.GridLayout()
    });

}

function recentFilesSelection(event) {

    var recentFilesSelectionIndex = event.detail.itemIndex,
        sessionFileList = WinJS.Application.sessionState.files,
        selectedFileToken = sessionFileList[recentFilesSelectionIndex].token,
        selectedFileName = sessionFileList[recentFilesSelectionIndex].title;

    console.log('Index: ' + recentFilesSelectionIndex + ' Name: ' + selectedFileName + ' Token: ' + selectedFileToken);

    //selectedFileToken = Windows.Storage.AccessCache.StorageApplicationPermissions.mostRecentlyUsedList.entries.getAt(mruIndex).token;
    //Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList.add(file);

    WinJS.Navigation.navigate("/pages/editor/editorPage.html", { filetoken: selectedFileToken, filename: selectedFileName });

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

            console.log("Fetching: " + fetchIndex + " " + that.getCount());

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
                            //groupKey: 'R',
                            data: {
                                icon: "images/filelogo.png",
                                title: currentFile.name,
                                textType: currentFile.displayType,
                                size: "",
                                // sourceIcon: "",
                                //kind: "R",
                                token: token,
                            }

                        }
                    ],
                    offset: requestIndex - fetchIndex,
                    
                }

                return currentFile.getThumbnailAsync(Windows.Storage.FileProperties.ThumbnailMode.documentsView);
                

                
            }).then(function(thumb) {

                currentObject.items[0].data.icon = URL.createObjectURL(thumb, { oneTimeOnly: false });

                return WinJS.Promise.wrap(currentObject);

            });
            //currentFile.getThumbnailAsync(Windows.Storage.FileProperties.ThumbnailMode.documentsView).then(function (thumb) {
            //});
            /* */
            /*return WinJS.Promise.wrap({
                items: {
                    key: 'R', // The key for the group
                    firstItemIndexHint: 0, // The index into the items for the first item in the group
                    data: {
                        icon: "images/filelogo.png",
                        title: "TEST",
                        textType: "TEST TYPE",
                        size: "",
                        // sourceIcon: "",
                        kind: "R",
                        //token: token,
                    } // The data for the specific group
                }, // The array of items
                offset: requestIndex, // The offset into the array for the requested item
                absoluteIndex: requestIndex, // The index into the collection of the item referenced by key
                totalCount: that.getCount() // The total length of the collection
            });*/
        },
    });

// Create a DataSource by deriving and wrapping the data adapter with a VirtualizedDataSource
var desertsDataSource = WinJS.Class.derive(WinJS.UI.VirtualizedDataSource, function () {//data) {
    this._baseDataSourceConstructor(new recentFilesDataAdapter());//data));
});
/* This is left over. */