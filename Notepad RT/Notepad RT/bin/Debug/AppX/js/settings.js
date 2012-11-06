// This is called when the app is initalized

function initializeSettings() {
    // Initialize all settings flyouts and WinJS controls.
    WinJS.UI.processAll();

    // Populate settings pane and tie commands to settings flyouts.
    WinJS.Application.onsettings = function (e) {
        e.detail.applicationcommands = {
            "defaultsDiv": { href: "/html/DefaultsUI.html", title: "Editor" },
            "aboutDiv": { href: "/html/AboutUI.html", title: "About" }
        };
        WinJS.UI.SettingsFlyout.populateSettings(e);
    }
    WinJS.Application.start();
}