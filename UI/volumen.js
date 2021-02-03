const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

let mainWindow;

function createWindow () {
    mainWindow = new BrowserWindow({width: 1200, height: 800, webSecurity: false, show: false, allowRunningInsecureContent: true, title: "Volumen"});

    mainWindow.once('ready-to-show', () => {
        //mainWindow.loadURL(`file://${__dirname}/bin/index.html`);
        //mainWindow.reload();
        mainWindow.show();
    });

    mainWindow.loadURL(`file://${__dirname}/bin/index.html`);

    //mainWindow.webContents.openDevTools()

    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    //mainWindow.webContents.openDevTools();
};

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});
