// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509



(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var nav = WinJS.Navigation;

    app.onactivated = function (args) {

        if (args.detail.kind === activation.ActivationKind.launch) {
            
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {

                // TODO: This application has been newly launched. Initialize
                // your application here.
                initializeSettings();


            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }
            
            //WinJS.Application.addEventListener('onsettingschanged', );
            //args.setPromise(WinJS.UI.processAll());
            args.setPromise(WinJS.UI.processAll().then(function () {

                if (nav.location) {

                    nav.history.current.initialPlaceholder = true;
                    return nav.navigate(nav.location, nav.state);

                } else {

                    return nav.navigate(Application.navigator.home);

                }
            }));

        }/*else if (args.detail.kind === activation.ActivationKind.shareTarget) {
            
            var arg = {};
            var shareOperation = args.detail.shareOperation;
            
            arg.shareData = args.detail.shareOperation.data;

            args.setPromise(WinJS.UI.processAll().then(function () {

                return nav.navigate(Application.navigator.editor, arg);

            }));
            //if (shareOperation.data.contains(Windows.ApplicationModel.DataTransfer.StandardDataFormats.storageItems)) {
            //    shareOperation.data.getStorageItemsAsync().done(function (storageItems) {

            //        if (storageItems.size > 0) {
            //            args.files = storageItems;
            //        }
                    
            //    });
            //} else {
              
            //}
        }*/else if (args.detail.kind === activation.ActivationKind.file) {
            
            var arg = {};
            arg.files = args.detail.files;

            args.setPromise(WinJS.UI.processAll().then(function () {

                return nav.navigate(Application.navigator.editor, arg);

            }));

        }

    };

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // args.setPromise().


    };

    app.start();
})();
