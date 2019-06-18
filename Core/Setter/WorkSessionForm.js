"use strict";

var Conf = Loader.Core('Configs'),
    http = require('http'),
    querystring = require('querystring'),
    crypto = require('crypto'),
    RouteController = Loader.Controller('RouteController'),
    UserController = Loader.Controller('User/UserController'),
    Util = Loader.Core('Utils'),
    Q = require('q'),
    requestIp = require('request-ip');


class WorkSessionForm extends RouteController{
    constructor(req, res, next){
        super(req, res, next);
        this.actionController = new WorkSessionAction;
        this.isAllowedIP = this.actionController.isAllowedIP(req);
    }

    /*
     * @api param
     * {
            "form_id": "WorkSessionForm",
            "action": "getOneTimeKey",
        }
     */
    startSession(uid = this.data.user.id){
        if(this.data.user.isAdmin != 1){
            if(this.data.user.workingStatus == 0){
                var session, hasValidSession, sessionError,
                    self = this,
                    checkAccessWorkSession = Util.checkAccessWorkSession();

                return Q.spawn(function* (){
                    try {
                        // Check request
                        yield new Promise(function(resolve, reject) {
                            !checkAccessWorkSession && self.isAllowedIP ? resolve() : reject(checkAccessWorkSession || "You're not allowed to perform this operation.");
                        });

                        // Start Session!!!
                        yield new Promise(function(resolve, reject) {
                            self.actionController.updateWorkingStatus(uid, 1, (e, res) => !e ? resolve() : reject(e));
                            self.actionController.insertWorkSession(uid, (e, resp) => !e ? resolve() : reject(e));  
                        });

                        self.res.json('Successfully created work session. Go conquer the world!');
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
                    // Start Session!!!
                    yield new Promise(function(resolve, reject) {
                        self.actionController.updateWorkingStatus(uid, 1, (e, res) => !e ? resolve() : reject(e));
                        self.actionController.insertWorkSession(uid, (e, resp) => !e ? resolve() : reject(e)); 
                    });

                    self.res.json('Successfully created work session. Go conquer the world!');
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
        if(this.data.user.workingStatus == 1){
            var sessions,
                self = this,
                today = Util.getMidNightTime();

            return Q.spawn(function* (){
                try {
                    // Check request
                    yield new Promise(function(resolve, reject) {
                        if(self.data.user.isAdmin != 1){
                            self.isAllowedIP ? resolve() : reject("You're not allowed to perform this operation.");
                        } else{
                            resolve();
                        }
                    });


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

                    self.res.json('ヾ(´￢｀)ﾉ (^ _ ^)/');
                } catch(e){
                    self.res.status(Conf.ERROR_CODE.GENERAL).json(e);
                }
            });
            
        } else {
            return this.next(new Error(Conf.ERROR_CODE.UNEXPECTED));
        }
    }

    handler() {
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

    isAllowedIP(request) {
        var clientIP = requestIp.getClientIp(request),
            allowedIP = Conf.ALLOWED_IP,
            length = allowedIP.length,
            isValid = false;

        for(var i = 0; i < length; i++) {
            if(~clientIP.indexOf(allowedIP[i]) !== 0){
                isValid = true;
                break;
            }
        }
        return isValid;
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