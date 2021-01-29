var electronInstaller = require('electron-winstaller');
var path = require("path");

resultPromise = electronInstaller.createWindowsInstaller({
    appDirectory: path.join('./out/safe-win32-x64'), // 编译的目录 看下package里面的配置
    outputDirectory: path.join('./out'), //输出路径
    authors: 'safe', // 软件著作信息
    exe: 'safe.exe', // 软件exe名称
    noMsi: true, // 是否生成msi文件
});

resultPromise.then(() => console.log("It worked!"), (e) => console.log(`No dice: ${e.message}`));