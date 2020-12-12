'use strict'

import {app, protocol, BrowserWindow, ipcMain} from 'electron'
import {createProtocol} from 'vue-cli-plugin-electron-builder/lib'
import installExtension, {VUEJS_DEVTOOLS} from 'electron-devtools-installer'
import path from 'path'
import * as Splashscreen from "@trodi/electron-splashscreen";


const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let quitAllowed = false;

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
    {scheme: 'app', privileges: {secure: true, standard: true}},
    {scheme: 'http', privileges: {secure: true, standard: true}},
])

function registerLocalResourceProtocol() {
    protocol.registerFileProtocol('local-resource', (request, callback) => {
        const url = request.url.replace(/^local-resource:\/\//, '')
        // Decode URL to prevent errors when loading filenames with UTF-8 chars or chars like "#"
        const decodedUrl = decodeURI(url) // Needed in case URL contains spaces
        try {
            return callback(decodedUrl)
        } catch (error) {
            console.error('ERROR: registerLocalResourceProtocol: Could not get file path:', error)
        }
    })
}

function createWindow() {
    // Create the browser window.
    let icon = path.join(__static, process.env.WEBPACK_DEV_SERVER_URL ? 'img/icon-dev.png' : 'img/favicon.png');
    let splash = path.join(__static, 'splash.html');
    let windowConfig = {
        minWidth: 640,
        minHeight: 470,
        width: 1400,
        height: 900,
        frame: false,
        backgroundColor: '#ed4b83',
        autoHideMenuBar: true,
        icon,
        webPreferences: {
            webSecurity: false,
            // Use pluginOptions.nodeIntegration, leave this alone
            // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info.
            nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION
        }
    };
    // win = new BrowserWindow(windowConfig)
    const splashConfig = Splashscreen.Config = {
        windowOpts: windowConfig,
        templateUrl: splash,
        minVisible: 0,
        delay: 0,
        splashScreenOpts: {
            fullscreenable: false,
            maximizable: false,
            width: 500,
            height: 320,
            icon,
            transparent: true,
        },
    };
    win = Splashscreen.initSplashScreen(splashConfig);

    let openFiles;
    if (process.env.WEBPACK_DEV_SERVER_URL) {
        openFiles = process.argv.slice(2);
        // Load the url of the dev server if in development mode
        // win.loadURL(`file://${__dirname}/dist/index.html`);
        win.loadURL(process.env.WEBPACK_DEV_SERVER_URL + `?file=${openFiles.length > 0}`);
        if (!process.env.IS_TEST) win.webContents.openDevTools()
    } else {
        openFiles = process.argv.slice(1);

        win.webContents.openDevTools()

        createProtocol('app')
        // Load the index.html when not in development
        let url = 'app://./index.html';
        win.loadURL(url + `?file=${openFiles.length > 0}`)
        // win.webContents.openDevTools()
    }

    let receivedFile = false;
    ipcMain.on('received-file', () => receivedFile = true);
    let sendInterval = setInterval(() => {
        if (receivedFile)
            clearInterval(sendInterval);
        else
            win.webContents.send('open-file', openFiles);
    });

    win.on('closed', () => {
        win = null
    })

    win.on('close', event => {
        if (!quitAllowed) {
            event.preventDefault();
            //Clean temp directory
            try {
                win.webContents.send('before-close');
            } catch (e) {
                //sad
            }
        }
    });
}

ipcMain.on('quit', (event, arg) => {
    quitAllowed = true;
    app.quit();
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit();
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
})

app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling,MediaSessionService');
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
    app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

    registerLocalResourceProtocol()
    if (isDevelopment && !process.env.IS_TEST) {
        // Install Vue Devtools
        try {
            await installExtension(VUEJS_DEVTOOLS)
        } catch (e) {
            console.error('Vue Devtools failed to install:', e.toString())
        }
    }
    createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === 'win32') {
        process.on('message', (data) => {
            if (data === 'graceful-exit') {
                app.quit()
            }
        })
    } else {
        process.on('SIGTERM', () => {
            app.quit()
        })
    }
}
