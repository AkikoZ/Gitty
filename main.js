const path = require('path');
const url = require('url');
const electron = require('electron');
const git = require('./lib/git');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;
const ipc = electron.ipcMain;
const dialog = electron.dialog;

const assetsPath = path.join(__dirname, 'assets');

let credential = null;

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

ipc.on('login', (event, data) => {
    credential = data;
});

ipc.on('add-local', event => {
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }, function (dir) {
        if (dir) event.sender.send('selected-local', {
            name: path.basename(dir[0]),
            path: dir[0]
        });
    });
});

ipc.on('commit', (event, data) => {
    console.log(data);
    git('commit', {
        path: data.path,
        message: data.message
    }, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            event.sender.send('commit-fail');
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
        event.sender.send('commit-success');
    });
});

ipc.on('clone', (event, data) => {
    console.log(data);
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }, function (dir) {
        git('clone', {
            path: dir[0],
            url: data.clone_url
        }, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                event.sender.send('clone-fail');
                return;
            }
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
            event.sender.send('clone-success');
            event.sender.send('selected-local', {
                name: data.name,
                path: path.join(dir[0], data.name)
            });
        });
    });
});

ipc.on('fetch', (event, data) => {
    console.log(data);
    git('fetch', {
        path: data.path,
        url: data.url
    }, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            event.sender.send('fetch-fail');
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
        event.sender.send('fetch-success');
    });
});

ipc.on('pull', (event, data) => {
    console.log(data);
    git('pull', {
        path: data.path,
        url: data.url
    }, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            event.sender.send('pull-fail');
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
        event.sender.send('pull-success');
    });
});

ipc.on('push', (event, data) => {
    console.log(data);
    git('push', {
        path: data.path,
        url: data.url,
        username: credential.username,
        password: credential.password
    }, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            event.sender.send('push-fail');
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
        event.sender.send('push-success');
    });
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600
    });

    mainWindow.loadURL(url.format({
        protocol: 'file:',
        slashes: true,
        pathname: path.join(__dirname, 'pages', credential === null ? 'login.html' : 'index.html')
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

    tray.on('click', () => {
        if (mainWindow === null) createWindow();
    });
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
