"use strict";

var Conf = Loader.Core('Configs'),
    http = require('http'),
    querystring = require('querystring'),
    crypto = require('crypto'),
    RouteController = Loader.Controller('RouteController'),
    UserController = Loader.Controller('User/UserController'),
    Util = Loader.Core('Utils'),
    Q = require('q');


class WorkSessionForm extends RouteController{
    constructor(req, res, next){
        super(req, res, next);
        this.actionController = new WorkSessionAction;
    }

    /*
     * @api params
     * {
            "form_id": "WorkSessionForm",
            "action": "getOneTimeKey"
        }
      *
      * return @id cho step startWorking check serialKey
     */
    getOneTimeKey(callback){
        if(this.data.user.workingStatus == 0){
            var dataKey = {},
                self = this;

            Q.spawn(function* (){
                try {
                    // Generate id + serialKey
                    yield new Promise(function(resolve, reject) {
                        var id = new Promise(function(resolve, reject) {
                            crypto.randomBytes(10, (err, buf) => {
                                if (err) {
                                    reject(err);
                                } else{
                                    dataKey.id = buf.toString('hex');
                                    resolve();
                                }
                            });
                        });
                        var key = new Promise(function(resolve, reject) {
                            crypto.randomBytes(50, (err, buf) => {
                                if (err) {
                                    reject(err);
                                } else{
                                    dataKey.serialKey = buf.toString('hex');
                                    resolve();
                                }
                            });
                        });

                        Promise.all([id, key]).then(function() {
                            resolve();
                        }, function(rej) {
                            reject(rej);
                        });
                    });

                    // curl đến local server để make key
                    yield new Promise(function(resolve, reject) {
                        self.actionController.makeSerialKey(dataKey, (e, data) => data === 'OK!' ? resolve() : reject(e.message || 'Error occurred. Please contact your administrator.'));
                    });

                    // Insert id+serialKey vao database
                    yield new Promise(function(resolve, reject) {
                        self.actionController.insertSerialKey({
                            uid: self.data.user.id,
                            id: dataKey.id,
                            serialKey: dataKey.serialKey,
                        }, (e, res) => !e ? resolve() : reject(e));
                    });

                    // Update workStatus trong table user
                    yield new Promise(function(resolve, reject) {
                        self.actionController.updateWorkingStatus(self.data.user.id, 1, (e, res) => !e ? resolve() : reject(e));
                    });

                    self.res.json(dataKey.id);
                } catch(e){
                    self.res.status(Conf.ERROR_CODE.GENERAL).json(e);
                }
            });

        } else{
            return this.next(new Error(Conf.ERROR_CODE.UNEXPECTED));
        }
    }

    /*
     * @api param
     * {
            "form_id": "WorkSessionForm",
            "action": "getOneTimeKey",
            "serialKey" : "33654bc7f00a92586c4028ebed6fa0fcc313368e5b416d7b8603e29360e0eaeb39d29e4a797560e653554c7b3eafc7191495"
        }
     */
    startSession(uid = this.data.user.id){
        var self = this;
        if(this.data.user.isAdmin != 1){
            if(this.data.user.workingStatus == 1){
                var session, hasValidSession, sessionError,
                    checkAccessWorkSession = Util.checkAccessWorkSession();

                return Q.spawn(function* (){
                    try {
                        // Check serialKey
                        yield new Promise(function(resolve, reject) {
                            self.actionController.select('work_sesion_key', {'uid': uid, 'serialKey': self.data.serialKey}, (e, data) => {
                                if(e || data.length == 0) {
                                    reject(e || 'Nhập sai onetime-key. Vui lòng thử lại.');
                                } else{
                                    session = data[0];
                                    resolve();
                                }
                            });
                        });

                        // Update workStatus trong table user
                        yield new Promise(function(resolve, reject) {
                            var now = Util.getLocalTime().getTime(),
                                keyExpire = session.expire.getTime();

                            if(keyExpire > now && !checkAccessWorkSession) {
                                hasValidSession = true;
                            } else{
                                sessionError = checkAccessWorkSession ? checkAccessWorkSession : 'Key đã hết hạn. Vui lòng thử lại.';
                            }

                            self.actionController.updateWorkingStatus(uid, hasValidSession ? 2 : 0, (e, res) => !e ? resolve() : reject(e));
                        });

                        // Del serialKey
                        yield new Promise(function(resolve, reject) {
                            self.actionController.removeSerialKey(session._id, (e, data) => !e ? resolve() : reject(e));
                        });

                        // Start Session!!!
                        yield new Promise(function(resolve, reject) {
                            if(hasValidSession){
                                self.actionController.insertWorkSession(uid, (e, resp) => !e ? resolve() : reject(e));
                            } else{
                                reject(sessionError);
                            }
                        });

                        self.res.json('OK!');
                    } catch(e){
                        self.res.status(Conf.ERROR_CODE.GENERAL).json(e);
                    }
                });
            } else {
                return this.next(new Error(Conf.ERROR_CODE.UNEXPECTED));
            }

        } else {
            return Q.spawn(function* (){
                try {
                    // Update workStatus trong table user
                    yield new Promise(function(resolve, reject) {
                        self.actionController.updateWorkingStatus(uid, 2, (e, res) => !e ? resolve() : reject(e));
                    });

                    // Start Session!!!
                    yield new Promise(function(resolve, reject) {
                        self.actionController.insertWorkSession(uid, (e, resp) => !e ? resolve() : reject(e));
                    });

                    self.res.json('OK!');
                } catch(e){
                    self.res.status(Conf.ERROR_CODE.GENERAL).json(e);
                }
            });
        }
    }

    /*
     * @api param
     * {
            "form_id": "WorkSessionForm",
            "action": "finishSession"
        }
     */
    finishSession(uid = this.data.user.id){
        if(this.data.user.workingStatus == 2){
            var sessions,
                self = this,
                today = Util.getMidNightTime();

            return Q.spawn(function* (){
                try {
                    // Update + trừ lương session không finish
                    yield new Promise(function(resolve, reject) {
                        var conditions = {
                            'uid': uid,
                            'date': {$ne : today}
                        };
                        var settings = {
                            type: 1,
                            value: -1,
                            note: 'Trừ lương do quên finish trong thời gian quá dài.',
                        }
                        self.actionController.update('time_recorder', conditions, settings, (e, data) => !e ? resolve() : reject(e));
                    });

                    // Get active session
                    yield new Promise(function(resolve, reject) {
                        self.actionController.select('time_recorder', {'uid': uid, 'date': today, 'sec': 0, 'value': 0}, (e, data) => {
                            if(e) {
                                reject(e);
                            } else{
                                sessions = data;
                                resolve();
                            }
                        });
                    });

                    // Update lương cho mỗi session
                    yield new Promise(function(resolve, reject) {
                        var length = sessions.length;
                        if(length > 0){
                            var session = sessions[0];
                            for(var i=0; i<length; i++){
                                var session = sessions[i],
                                    settings = {
                                        sec: Util.calcSessionSecond(session.startAt),
                                        value: Util.calcSessionSalary(session.startAt, self.data.user.salary),
                                    }

                                self.actionController.update('time_recorder', {'_id': session.id}, settings, (e, data) => !e ? '' : reject(e));
                            }
                            resolve();
                        } else{
                            resolve();
                        }
                    });

                    // Update workStatus trong table user
                    yield new Promise(function(resolve, reject) {
                        self.actionController.updateWorkingStatus(uid, 0, (e, res) => !e ? resolve() : reject(e));
                    });

                    self.res.json('ok!');
                } catch(e){
                    self.res.status(Conf.ERROR_CODE.GENERAL).json(e);
                }
            });

        } else{
            return this.next(new Error(Conf.ERROR_CODE.UNEXPECTED));
        }
    }

    handler(){
        // data.user = req._user;
        // this.next = next;
        // this.data = data;
        // this.res = res;
        this.action();
    }
}

/*
 * Class WorkingSessionAction được tạo ra để tránh bug
 * chẳng hạn khi user nhập action vào là startSession
 * nếu đặt vào class WorkingSessionForm
 * sẽ được gọi trực tiếp mà không qua 1 validation nào
 */

class WorkSessionAction extends UserController{
    makeSerialKey(dataKey, callback){
        var postData = querystring.stringify({
          'op': 'create',
          'id': dataKey.id,
          'key': dataKey.serialKey,
          'sec': Conf.CREATE_SESSION_KEY,
        });
        var options = {
            hostname: Conf.HOST.EXTERNAL,
            path: '/work-session/manage-key.php',
            port: '80',
            method: 'POST',
            //This is the only line that is new. `headers` is an object with the headers to request
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postData.length
            }
        };

        var req = http.request(options, response => {
            response.setEncoding('utf8');

            var data = '';
            response.on('data', chunk => {
                data += chunk;
            });
            response.on('end', () => callback(null, data));
        });
        req.on('error', e => callback(e));
        // write data to request body
        req.write(postData);
        req.end();
    }

    insertSerialKey(data, callback){
        var now = Util.getLocalTime();
        var record = {
            uid: data.uid,
            _id: data.id,
            serialKey: data.serialKey,
            expire: new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + Conf.WORK_SESSION_KEY_ALIVE, now.getSeconds(), now.getMilliseconds()),
        };

        this.save('work_sesion_key', record, (e, resp) => callback(e, resp));
    }

    removeSerialKey(id, callback){
        this.remove('work_sesion_key', {'_id': id}, (e, res) => {
            if(e){
                return callback(e);
            } else{
                var postData = querystring.stringify({
                  'op': 'delete',
                  'id': id,
                  'sec': Conf.CREATE_SESSION_KEY,
                });
                var options = {
                    hostname: Conf.HOST.EXTERNAL,
                    path: '/work-session/manage-key.php',
                    port: '80',
                    method: 'POST',
                    //This is the only line that is new. `headers` is an object with the headers to request
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': postData.length
                    }
                };

                var req = http.request(options, response => {
                    var data = '';
                    response.on('data', chunk => {
                        data += chunk;
                    });
                    response.on('end', () => callback(null));
                });
                req.on('error', (e) => callback(e));
                // write data to request body
                req.write(postData);
                req.end();
            }
        });
    }

    insertWorkSession(uid, callback){
        var record = {
            uid: uid,
            date: Util.getMidNightTime(),
            startAt: Util.getLocalTime(),
        };
        this.save('time_recorder', record, (e, resp) => callback(e, resp));
    }

    updateWorkingStatus(uid, status, callback){
        this.update('user', {"_id": uid}, {"workingStatus": status}, callback);
    }
}

module.exports = WorkSessionForm;
