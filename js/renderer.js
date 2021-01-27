// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

const ipc = require('electron').ipcRenderer;
var path = require("path");
var fs = require("fs");
var child_process = require('child_process');

/**
 * 获取value值
 * @param id
 * @returns {*}
 */
var getValue = function (id) {
    if (isServerConfig(id)) {
        return getServerConfig()
    }
    var dom = document.getElementById(id);
    if (dom) {
        return isCheckbox(id) ? $('#' + id).prop("checked") : dom.value;
    }
};


/**
 * 校验value值
 * @param id
 * @returns {*}
 */
var checkValue = function (id) {
    var value = getValue(id);
    if (jQuery.isEmpty(value)) {
        setInfo('不能为空');
        return;
    }
    return value;
};

/**
 * 动态添加ServerGroup
 * @param label
 */
var addServerGroup = function (label) {
    var obj = $("#" + label).clone();
    obj.css("display", "")
    $(label).append(obj)
};

/**
 * 删除ServerGroup
 * @param event
 */
var delServerGroup = function (event) {
    var e = event || window.event;
    $(e).parent('div').remove();
};

/**
 * form 表单id
 * @returns {[string,string,string,string,string]}
 */
var getFromId = function () {
    return ['code_url', 'version', 'forced_pull', 'compile', 'server-group'];
};

/**
 * 代码更新部分
 */
var forced_pull = function () {
    var git = require('gulp-git');
    var _cmd = 'start git pull';
    if (getValue('forced_pull')) {
        _cmd = "start git fetch --all &&  git reset --hard origin/sangfor && git pull origin sangfor";
    }
    var path = getValue('code_url').replace(/\\/g, '\/');
    var workerProcess = child_process.exec(_cmd , {
        cwd: path
    });

    workerProcess.on('message', function (data) {
        console.log('stderr: ');
    });

    workerProcess.on('close', function (data) {
        if (data === 0) {
            setInfo("更新完成，开始执行编译！");
            compile();
        } else {
            setInfo("更新失败，请手动执行更新！");
        }
    });

    workerProcess.on('error', function (data) {
        setInfo(data);
    });

    workerProcess.on('disconnect', function (data) {
        setInfo('disconnect: ');
    });
};

var compile = function () {
    if (getValue('compile')) {
        /**
         * form 表单ID
         * @type {[string,string,string,string,string]}
         */
        var ID = getFromId();
        var len = ID.length;
        var value = [];
        for (let i = 0; i < len; i++) {
            var val = checkValue(ID[i]);
            if (val) {
                value.push(val);
            } else {
                value = [];
            }
        }
        if (value.length) {
            var path = getValue('code_url');
            var version = getValue('version');
            var cmd = version.split(" ");
            var fileUtils = require(path + '\\bin\\file_utils.js');
            fileUtils.compileStart(cmd[1], cmd[2], callBack, path.replace(/\\/g, '\/'));
        }
    } else {
        Upload();
    }
}
/**
 * 提交动作
 * @private
 */
var _login = function () {
    window.location.href="login.html";
};

var _clear = function () {
    localStorage.clear();
}

/**
 * 编译成功后的回调
 * @param status
 */
var callBack  = function (status) {
    if (status) {
        setInfo("编译成功！开始上传，上传进度为：5%");
        Upload();
    } else {
        setInfo("编译失败，请联系研发人员定位后重新编译！");
    }
};

/**
 * 根据缓存设置所有输入框的值
 */
var setAllValue = function () {
    var ID = getFromId();
    var len = ID.length;
    for (let i = 0; i < len; i++) {
        var id = ID[i];
        var value = localStorage.getItem(id);
        if (value != null) {
            if (id !== 'version') {
                setSingleValue(id, value);
            } else {
                var optsObj = JSON.parse(value);
                var opts = optsObj.opts;
                var _len = opts.length;
                var sel = document.getElementById(id);
                for (let j = 0; j < _len; j++) {
                    var opt = opts[j];
                    var optDom = new Option(opt.lable, opt.value);
                    if (opt.value === optsObj.value) {
                        optDom.selected = true;
                    }
                    sel.appendChild(optDom);
                }
            }
        }
    }
};

/**
 * 判断是否是checkbox类型
 * @param id
 * @returns {boolean}
 */
var isCheckbox = function (id) {
    var dom = document.getElementById(id);
    if (dom && dom.type === 'checkbox') {
        return true;
    } else {
        return false;
    }
};

/**
 * 判断是否是ServerConfig 群组
 * @param id
 * @returns {*}
 */
var isServerConfig = function (id) {
    // 此处id和className用的一样 用于做数据获取和数据赋值比较方便
    return getServerConfigDom(id);
};
/**
 * 获取服务器相关配置dom集合
 * @param id
 * @returns {*}
 */
var getServerConfigDom = function (id) {
    var dom;
    if (id) {
        dom = document.getElementsByTagName(id);
    } else {
        dom = document.getElementsByTagName('server-group');
    }
    if (dom.length) {
        var _nextDom = dom[0].getElementsByClassName(id || 'server-group');
        if (_nextDom) {
            return _nextDom;
        }
        return false;
    }
    return false;
};

/**
 * 获取ServerConfig的数据 是以数组形式存储的
 */
var getServerConfig = function () {
    var configDom = getServerConfigDom();
    // [index].getElementsByTagName('input');
    var config = [];
    var _len = configDom.length;
    for (let key = 0; key < _len; key++) {
        var item = configDom[key];
        var singleDom = item.getElementsByTagName('input');
        var len = singleDom.length;
        var obj = {};
        for (let i = 0; i < len; i++) {
            var input = singleDom[i];
            obj[input.name] = input.value;
        }
        config.push(obj);
    }
    return config;
};

/**
 * 设置config的值
 * @param index
 * @param value
 */
var setServerConfig = function (index, value) {
    var configDom = getServerConfigDom()[index].getElementsByTagName('input');
    var len = configDom.length;
    for (let i = 0; i < len; i++) {
        var item = configDom[i];
        item.value = value[item.name];
    }
};

/**
 * 缓存的数据集合
 * @type {{ip: string, port: string, userName: string, password: string, address: string}}
 */
var ServerConfig = {
    ip: '', // 服务器地址
    port: '', // 端口号
    userName: '', // 用户名、密码
    password: '', // 用户名、密码
    address: '' // 部署地址
};


/**
 * 设置每个选项的数据值
 * @param id
 * @param value
 */
var setSingleValue = function (id, value) {
    var dom = document.getElementById(id);
    if (isCheckbox(id)) {
        $("#" + id).prop("checked", value === 'true' ? true : false);
    } else {
        var config = isServerConfig(id);
        if (config) {
            value = JSON.parse(value);
            if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    if (index) addServerGroup('server-group');
                    setServerConfig(index, item);
                });
            }
        } else {
            dom.value = value;
        }
    }
};


/**
 * 消息发送
 */
var sentMsg = function (msg) {

}
/**
 * onkeyup 事件
 * @param event
 * @private
 */
var _onkeyup = function (event) {

    // value=value.replace(/[^a-zA-Z]/g,'')
};

/**
 * 设置缓存 下次不用再输入
 * @param target
 */
var setCache = function () {
    var ID = getFromId();
    ID.forEach((id) => {
        if (id !== 'version') {
            var _val = getValue(id);
            localStorage.setItem(id, jQuery.isString(_val) ? _val : JSON.stringify(_val));
        } else {
            var optsCache = localStorage.getItem(id);
            if (optsCache == null) {
                optsCache = {};
            }
            if (jQuery.isString(optsCache)) {
                optsCache = JSON.parse(optsCache);
            }
            optsCache.value = getValue(id);
            localStorage.setItem(id, JSON.stringify(optsCache));
        }
    });
};

/**
 *
 * @param event
 * @private
 */
var _onblur = function (event) {
    var e = event || window.event;
    var target = e.target;
    if (target.value) {
        if (target.id !== 'code_url') {

        } else {
            var dirs = [];
            var pathName = target.value + '\\chubao';
            fs.readdir(pathName, function (err, files) {
                var dirs = [];
                (function iterator(i) {
                    if (i == files.length) {
                        var version = document.getElementById('version');
                        var len = dirs.length;
                        var opts = [];
                        for (let i = 0; i < len; i++) {
                            fs.readFile(pathName + '\\' + dirs[i], "utf-8", function (error, data) {
                                if (error) {
                                    setInfo("读取文件失败,内容是" + error.message, 'error');
                                    return
                                }
                                ;
                                var matchReg = /(?<=cmd \/k node \.\.).*/gi;
                                var str = data.match(matchReg)[0].replace(/\//g, '\\');
                                opts.push({
                                    lable: dirs[i],
                                    value: str
                                });
                                var opt = new Option(dirs[i], str);
                                version.appendChild(opt);
                            });
                        }
                        var optsCache = localStorage.getItem('version');
                        if (optsCache != null) {
                            optsCache = JSON.parse(optsCache);
                            optsCache.opts = opts;
                        } else {
                            optsCache = {
                                opts: opts
                            }
                        }
                        setTimeout(() => {
                            localStorage.setItem('version', JSON.stringify(optsCache));
                        });
                        return;
                    }
                    fs.stat(path.join(pathName, files[i]), function (err, data) {
                        if (data.isFile()) {
                            var fileName = files[i];
                            if (fileName.startsWith('chubao')) {
                                dirs.push(files[i]);
                            }

                        }
                        iterator(i + 1);
                    });
                })(0);
            });
        }
        setCache();
    }
};
/**
 *
 * @param _info  信息
 * @param type  info为信息 success为成功 danger 为错误
 */
var setInfo = function (_info, type) {
    var info = $('#info');
    if (type) {
        var className = info[0].className.split(" ")[1];
        info.removeClass(className);
        info.addClass('alert-' + (type === 'error' ? 'danger' : type));
    }
    setTimeout(() => {
        $('#info_text').html(_info);
    })
};

/**
 * 单服务上传
 * @param config
 * @constructor
 */
var UploadByConfig = function (item) {
    const {task} = require('gulp');
    const gulp = require('gulp');
    // 载入配置文件
    var sshConfig = {
        host: item.ip,
        port: item.port,
        username: item.userName,
        password: item.password,
    };
    var remoteDir = item.address.replace(/\\/g, '\/');
    remoteDir = remoteDir.endsWith('/') ? remoteDir : remoteDir + '/';
    //删除现有文件
    var remoteCmd = 'rm -rf ' + remoteDir + '*';

    // 载入ssh
    var GulpSSH = require('gulp-ssh');
    //打开ssh通道
    var gulpSSH = new GulpSSH({
        ignoreErrors: false,
        sshConfig: sshConfig
    });

    gulpSSH.on('error', (error) => {
        setInfo(error, 'error');
    });


    // 先执行删除，再执行上传

    // task('update', ['execDel','deployFile'], function () {
    //     // TODO 将你的默认的任务代码放在这
    // });

    /**
     * 执行删除命令
     */
    setInfo('开始删除老文件');
    var del = function () {
        var delInfo = gulpSSH.shell(remoteCmd, {filePath: 'commands.log'}).pipe(gulp.dest('logs'));
        delInfo.on("prefinish", () => {
            setInfo("删除完成，开始上传！");
            upload()
        })
    };

    del();

    /**
     *  上传开始
     */
    var upload = function () {
        var path = getValue('code_url').replace(/\\/g, '\/');
        var schedule = 0;
        var info = gulp.src([path + '/chubao/dist/**', '!**/node_modules/**'])
            .pipe(gulpSSH.dest(remoteDir));
        info.on('end', () => {

        });
        info.on('prefinish', () => {
            setInfo("prefinish完成，请刷新！", 'success');
        });

        info.on('drain', (a, b) => {
            schedule += 1;
            schedule = schedule >= 100 ? 99 : schedule;
            setInfo("上传中请稍后, 进度" + schedule + '%');
        });

        info.on('error', () => {
            setInfo("上传失败，请重新上传！", 'error');
        });

        info.on('finish', () => {
            setInfo("部署完成，请刷新！", 'success');
            schedule = 0;
        });

        info.on('unpipe', (readable, unpipeInfo) => {
            setInfo("unpipe完成，请刷新！", 'success');
        })
        // return new Promise((resolve,reject)=> {
        //     resolve(gulp.src([path + '/chubao/dist/**', '!**/node_modules/**'])
        //         .pipe(gulpSSH.dest(remoteDir)));
        // })
    };
}
/**
 * 开始上传动作
 * @constructor
 */
var Upload = function () {
    const _CONFIG = getValue("server-group");
    _CONFIG.forEach(item => {
        UploadByConfig(item);
    })
};


