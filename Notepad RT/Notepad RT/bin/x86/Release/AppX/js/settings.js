// This is called when the app is initalized

function initializeSettings() {
    // Initialize all settings flyouts and WinJS controls.
    WinJS.UI.processAll();

    // Populate settings pane and tie commands to settings flyouts.
    WinJS.Application.onsettings = function (e) {
        e.detail.applicationcommands = {
            "defaultsDiv": { href: "/html/DefaultsUI.html", title: "Defaults" },
            "aboutDiv": { href: "/html/AboutUI.html", title: "About" }
        };
        WinJS.UI.SettingsFlyout.populateSettings(e);
    }
    WinJS.Application.start();
}

function settingsChanged() {

    var settings = Windows.Storage.ApplicationData.current.localSettings.values;

    editor.setTheme(settings['theme']);
    editor.setFontSize(settings['fontSize']);
    editor.setHighlightActiveLine(settings['highlightActiveLine']);
    editor.setShowInvisibles(settings['showInvisibleCharacters']);

}