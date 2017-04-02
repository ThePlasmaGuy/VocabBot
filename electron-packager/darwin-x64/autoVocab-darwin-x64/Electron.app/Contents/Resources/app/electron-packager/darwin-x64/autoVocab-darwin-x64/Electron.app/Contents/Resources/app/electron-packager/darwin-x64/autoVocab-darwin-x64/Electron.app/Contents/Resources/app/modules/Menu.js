const electron = require("electron");
const os       = require("os");
const Storage  = require("./Storage");

module.exports = electron.Menu.buildFromTemplate([
	{
		label: process.platform === "darwin" ? electron.app.getName() : "File",
		submenu: [
			{
				role: "about"
			},
			{
				type: "separator"
			},
			{
				type: "separator"
			},
			{
				role: "services",
				submenu: []
			},
			{
				type: "separator"
			},
			{
				role: "hide"
			},
			{
				role: "hideothers"
			},
			{
				role: "unhide"
			},
			{
				type: "separator"
			},
			{
				role: "quit"
			}
		]
	},
	{
		label: "Edit",
		submenu: [
			{
				role: "undo"
			},
			{
				role: "redo"
			},
			{
				type: "separator"
			},
			{
				role: "copy"
			},
			{
				role: "cut"
			},
			{
				role: "paste"
			},
			{
				role: "pasteandmatchstyle"
			},
			{
				role: "delete"
			},
			{
				role: "selectall"
			}
		]
	},
	{
		role: "window",
		submenu: [
			{
				role: "minimize"
			},
			{
				role: "zoom"
			},
			{
				role: "togglefullscreen"
			},
			{
				role: "close"
			},
			{
				label: 'Reload', 
				accelerator: 'CmdOrCtrl+R',
				click: function() {
					var mainWindow = global.mainWindow;
					mainWindow.webContents.reload();

					if (Storage.get('hover') == true) {
						mainWindow.send('hoverOn');
					}
				}
			},
			{
				label: 'Toggle Hover Mode',
				accelerator: 'CmdOrCtrl+H',
				click: function() {
					var mainWindow = global.mainWindow;
					
					if (global.hover) {
						global.hover = false;
						console.log('[RENDER] Hover Mode Deactivated.')
						mainWindow.setVisibleOnAllWorkspaces(false);
						mainWindow.setAlwaysOnTop(false);
						mainWindow.setFullScreenable(true);
						mainWindow.setIgnoreMouseEvents(false);
						mainWindow.send('hoverOff');
						Storage.set('hover', false);
					} else {
						global.hover = true;
						if (!mainWindow.isFullScreen()) {
							console.log('[RENDER] Hover Mode Activated.')
							mainWindow.setVisibleOnAllWorkspaces(true);
							mainWindow.setAlwaysOnTop(true);
							mainWindow.setFullScreenable(false);
							mainWindow.setIgnoreMouseEvents(true);
							mainWindow.send('hoverOn');
							Storage.set('hover', true);
						} else {
							console.log('[RENDER] Hover Mode Toggle Prevented Due to FullScreen.')
						}
					}
				}
			},
			{
				type: "separator"
			},
			{
				role: "front"
			}
		]
	}
]);
