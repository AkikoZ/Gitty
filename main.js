const path = require('path');
const url = require('url');
const electron = require('electron');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;

const assetsPath = path.join(__dirname, 'assets');

let mainWindow = null;
let tray = null;

if (makeSingleInstance()) return app.quit();

app.on('ready', () => {
    createWindow();
    createTray();
});

app.on('activate', () => {
    if (mainWindow === null) createWindow();
});

app.on('window-all-closed', () => {});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600
    });

    mainWindow.loadURL(url.format({
        protocol: 'file:',
        slashes: true,
        pathname: path.join(__dirname, 'index.html')
    }));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function createTray() {
    const iconName = process.platform === 'win32' ? 'windows-icon.png' : 'icon.png';
    const iconPath = path.join(assetsPath, 'tray', iconName);
    tray = new Tray(iconPath);
    tray.setToolTip('Gitty ready for service in the tray.');
}

function makeSingleInstance() {
    if (process.mas) return false;
    return app.makeSingleInstance(() => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}
