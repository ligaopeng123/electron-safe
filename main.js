// Modules to control application life and create native browser window
const {app, BrowserWindow, Menu} = require('electron')
const path = require('path')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 950,
        height: 750,
        show: false,
        fullscreen: true,
        backgroundColor: '#999',
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // and load the index.html of the app.
    mainWindow.loadFile('index.html');
    // 处理界面打开后短暂的白屏
    mainWindow.on('ready-to-show', function () {
        mainWindow.show();
    })

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    });
    // 调试界面
    // mainWindow.webContents.openDevTools()
}

if (true || app.isPackaged) Menu.setApplicationMenu(Menu.buildFromTemplate([{
    label: '设置',
    submenu: [
        { role: 'reload', label: '刷新' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut' , label: '缩小'},
        { role: 'resetZoom' , label: '重置'},
        { role: 'togglefullscreen',  label: '进入|退出全屏'}
    ]
}]));

const ipc = require('electron').ipcMain;
//接收
ipc.on('test', function (msg) {
    console.log(msg)
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
// 开机自启动
// const exeName = path.basename(process.execPath);
//
// app.setLoginItemSettings({
//     openAtLogin: true,
//     openAsHidden:false,
//     path: process.execPath,
//     args: [
//         '--processStart', `"${exeName}"`,
//     ]
// });