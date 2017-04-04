const electron   = require("electron");
const dialog     = electron.dialog;
const filesystem = require("fs");
const path       = require("path");
const Menu       = require("./modules/Menu");
const Storage    = require("./modules/Storage");

require("electron-debug")();
require("electron-dl")();

global.log = function(logContent) {
	console.log(logContent)
}

let isQuitting = false;

const isAlreadyRunning = electron.app.makeSingleInstance(() => {
	if (!global.mainWindow)
		return;

	if (global.mainWindow.isMinimized())
		global.mainWindow.restore();

	global.mainWindow.show();
});

if (isAlreadyRunning)
	electron.app.quit();

// Disable error dialogs by overriding
dialog.showErrorBox = function(title, content) {
    global.log(`${title}\n${content}`);
};

function createMainWindow() {
	const lastWindowState = Storage.get("lastWindowState") || {width: 900, height: 675};

	const browser = new electron.BrowserWindow({
		width: lastWindowState.width,
		height: lastWindowState.height,
		x: lastWindowState.x,
		y: lastWindowState.y,
		minWidth: 300,
		minHeight: 300,
		title: electron.app.getName(),
		show: false,
        transparent: true,
		autoHideMenuBar: true,
		titleBarStyle: "hidden-inset",
		webPreferences: {
			nodeIntegration: false,
			preload: path.join(__dirname, "inject/app.js"),
			webSecurity: false
		}
	});

	browser.on("page-title-updated", (event, title) => {
		if (!title.includes("New message"))
			return;

		browser.webContents.send("count-badges");
	});

	browser.on("close", event => {
		if (isQuitting)
			return;

		event.preventDefault();

		if (process.platform === "darwin")
			electron.app.hide();
		else
			electron.app.quit();
	});

	browser.loadURL("https://vocabulary.com", {userAgent: ""});

	setTimeout(function() { setInterval(function() {
		displayWidth = electron.screen.getPrimaryDisplay().size.width;
		browserWidth = browser.getSize()[0];
		browser.webContents.setZoomFactor(browserWidth/displayWidth)
	}, 250); }, 1000);

	browser.on('enter-full-screen', () => {
		console.log('[RENDER] Hover Mode Deactivated.')
		browser.setVisibleOnAllWorkspaces(false);
		browser.setAlwaysOnTop(false);
		browser.setFullScreenable(true);
	});

	browser.webContents.on("dom-ready", () => {
		browser.webContents.insertCSS(filesystem.readFileSync(path.join(__dirname, "inject/app.css"), "utf8"));
		browser.show();
	});

	browser.webContents.on("new-window", (event, url) => {
		event.preventDefault();
		electron.shell.openExternal(url);
	});

	if (Storage.get('hover') == true) {
		global.hover = true;
		global.log('[RENDER] Hover Mode Activated.')
		browser.setVisibleOnAllWorkspaces(true);
		browser.setAlwaysOnTop(true);
		browser.setFullScreenable(false);
		browser.setIgnoreMouseEvents(true);
		browser.setHasShadow(false);
		setTimeout(function(){browser.send('hoverOn')},1750);
	}

	return browser;
}

electron.app.on("ready", () => {
	if (process.platform == 'darwin') {electron.app.setUserActivity('Vocabulary.com', {}, 'https://vocabulary.com');}
	electron.Menu.setApplicationMenu(Menu);

	if (!global.mainWindow) {
		global.mainWindow = createMainWindow();
	}

	electron.globalShortcut.register('CmdOrCtrl+Alt+Shift+H', () => {
		if (global.hover) {
			global.hover = false;
			global.log('[RENDER] Hover Mode Deactivated.')
			global.mainWindow.setVisibleOnAllWorkspaces(false);
			global.mainWindow.setAlwaysOnTop(false);
			global.mainWindow.setFullScreenable(true);
			global.mainWindow.setIgnoreMouseEvents(false);
			global.mainWindow.setHasShadow(true);
			global.mainWindow.send('hoverOff');
			Storage.set('hover', false);
		} else {
			global.hover = true;
			if (!global.mainWindow.isFullScreen()) {
				global.log('[RENDER] Hover Mode Activated.')
				global.mainWindow.setVisibleOnAllWorkspaces(true);
				global.mainWindow.setAlwaysOnTop(true);
				global.mainWindow.setFullScreenable(false);
				global.mainWindow.setIgnoreMouseEvents(true);
				global.mainWindow.setHasShadow(false);
				global.mainWindow.send('hoverOn');
				Storage.set('hover', true);
			} else {
				console.log('[RENDER] Hover Mode Toggle Prevented Due to FullScreen.')
			}
		}

	})
});

electron.app.on("activate", () => {
	if (!global.mainWindow)
		global.mainWindow = createMainWindow();

	global.mainWindow.show();
});

electron.app.on("before-quit", () => {
	isQuitting = true;

	if (global.mainWindow && !global.mainWindow.isFullScreen())
		Storage.set("lastWindowState", global.mainWindow.getBounds());
});

setInterval(async function() {
	electron.app.relaunch();
	await new Promise(resolve => setTimeout(resolve, 1000));
	electron.app.quit();
}, 900000);

