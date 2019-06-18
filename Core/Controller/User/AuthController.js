"use strict";
var bcrypt = require('bcryptjs'),
    crypto = require('crypto'),
    Conf = Loader.Core('Configs'),
    mongoose = require('mongoose'),
    UserController = Loader.Controller('User/UserController'),
    Redis = Loader.Controller('Redis'),
    BasicStrategy = require('passport-http').BasicStrategy,
    Util = Loader.Core('Utils'),
    OneTimeTokenModel = OneTimeTokenModel || Loader.Model('OneTimeTokenModel'),
    Q = require('q');

class AuthController extends UserController {

    constructor() {
        super(); // exception thrown here when not called
        // this.model = model;
        this.model.one_time_token = OneTimeTokenModel.one_time_token;
    }

    cryptPassword(password) {
        // var salt = bcrypt.genSaltSync(10);
        return bcrypt.hashSync(password, 10);
    }
    checkRegisterUser(userFromForm, callback){
        this.getUserByUsername(userFromForm.username, (err, user) => err || user ? callback(err || 'Username is already taken.') : callback(null, userFromForm));
    }
    createUser(userFromForm, callback) {
        this.checkRegisterUser(userFromForm, (err, user) => {
            if (err) {
                return callback(err);
            } else{
                var data = user;
                data.password = this.cryptPassword(user.password);
                return new this.model.user(data).save(callback);
            }
        });
    }
    comparePassword(candidatePassword, hash, callback) {
        bcrypt.compare(candidatePassword, hash, (err, matches) => err || !matches ? callback(err || 'Password does not match!') : callback(null, true));
    }
    expireToken(headers, callback) {
        try {
            var token = this.extractTokenFromHeader(headers);
            if (token == null) {
                callback(new Error('Token is null'));
            } else{
                Redis.expireToken(token, callback);
            }
        } catch (err) {
            return callback(err);
        }
    }
    createAndStoreToken(data, ttl, callback) {
        data = data || {};
        ttl = ttl || Conf.SESSION_ALIVE * 60*60*24;

        if (data != null && typeof data !== 'object') callback(new Error('data is not an Object'));
        if (ttl != null && typeof ttl !== 'number') callback(new Error('ttl is not a valid Number'));

        this.createToken(function(err, token) {
            if (err) callback(err);

            Redis.setTokenWithData(token, data, ttl, function(err, success) {
                if (err) callback(err);

                if (success) {
                    callback(null, token);
                }
                else {
                    callback(new Error('Error when saving token'));
                }
            });
        });
    }
    createToken(callback) {
        crypto.randomBytes(Conf.TOKEN_LENGTH, (err, token) => err || !token ? callback(err || new Error('Problem when generating token')) : callback(null, token.toString('hex')));
    }
    extractTokenFromHeader(headers) {
        if (headers == null || headers.authorization == null) throw new Error('Authorization header is null');

        var authorization = headers.authorization;
        var authArr = authorization.split(' ');
        if (authArr.length != 2) throw new Error('Authorization header value is not of length 2');

        // retrieve token
        var token = authArr[1];
        if (token.length != Conf.TOKEN_LENGTH * 2) throw new Error('Token length is not the expected one');

        return token;
    }
    verifyToken(req, res, next) {
        var uid, token,
            headers = req.headers,
            self = this;
        if (req.body && req.body.form_id == 'UserForm' && req.body.action == 'login') {
            return next();
        } else{
            Q.spawn(function* (){
                try {
                    // Get token
                    yield new Promise(function(resolve, reject) {
                        try {
                            token = self.extractTokenFromHeader(headers);
                            resolve();
                        } catch (e) {
                            reject();
                        }
                    });

                    // Get uid
                    yield new Promise(function(resolve, reject) {
                        Redis.getDataByToken(token, function(err, resp) {
                            if (err) {
                                reject();
                            } else{
                                uid = resp;
                                resolve();
                            }
                        });
                    });

                    // Get user info
                    yield new Promise(function(resolve, reject) {
                        self.getUserById(uid, function(err, resp) {
                            if (err) {
                                reject();
                            } else{
                                req._user = resp;
                                resolve();
                            }
                        });
                    });
                    next();

                } catch(e){
                    next(new Error(Conf.ERROR_CODE.ACCESS));
                }
            });
        }
    }
    authenticate(req, callback){
        var self = this,
            username = req.username,
            password = req.password,
            user, token;
        // this.getUserByUsername(username, function(err, user) {
        //     // console.log(err + ' ' + user);
        //     if (err || !user) {
        //         return callback(err || 'Unknown User');
        //     }
        //     self.comparePassword(password, user.password, function(compareErr, isMatch){
        //         if (isMatch) {
        //             self.createAndStoreToken(user._id, Conf.SESSION_ALIVE * 60*60*24, function(tokenErr, token) {
        //                 if (err) {
        //                     return callback(tokenErr);
        //                 }
        //                 // user._doc._token = token; // All user variable store here
        //                 return callback(null, token);
        //             });
        //         } else{
        //             return callback(compareErr || 'Password Not Match');
        //         }
        //     });
        // });

        Q.spawn(function* (){
            try {
                yield new Promise(function(resolve, reject) {
                    self.getUserByUsername(username, function(err, userData) {
                        if (err || !userData) {
                            reject(err || 'Unknown User');
                        }
                        user = userData;
                        resolve();
                    });
                });
                yield new Promise(function(resolve, reject) {
                    self.comparePassword(password, user.password, function(compareErr, isMatch){
                        if (compareErr || !isMatch) {
                            reject(compareErr || 'Password Not Match');
                        }
                        resolve();
                    });
                });
                yield new Promise(function(resolve, reject) {
                    // var storeData = {
                    //     id: user._id,
                    //     username: user.username,
                    // };
                    // if(user.isAdmin == 1) storeData.isAdmin = 1;

                    // Không được store user variable vào đây
                    // vì user có thể đăng nhập trên nhiều thiết bị
                    // nếu khi user thay đổi thông tin (nghĩa là user variable thay đổi)
                    // thì có thể logout trên thiết bị đấy để login lại và refresh lại user variable
                    // nhưng các thiết bị khác vẫn đang tồn tại session với variable cũ
                    // => bug
                    var expireTime = Conf.SESSION_ALIVE * 60*60*24;
                    self.createAndStoreToken(user._id, expireTime, function(tokenErr, resToken) {
                        if (tokenErr) {
                            reject(tokenErr);
                        }

                        // user._doc._token = token; // All user variable store here
                        token = {
                            token: resToken,
                            expire: expireTime,
                        };
                        resolve();
                    });
                });
                // yield new Promise(function(resolve, reject) {
                //     var device = req.body.device_id;
                //     var acceptedDevice = user.accepted_device;
                //     var length = acceptedDevice.length;
                //     var check = false;
                //     for (var i = 0; i < length; i++) {
                //         if (device == acceptedDevice[i]) {
                //             check = true;
                //             resolve();
                //             break;
                //         }
                //     }
                //     if (!check) {
                //         var uid = new mongoose.mongo.ObjectId(user._id);
                //         self.save('one_time_token', {
                //             uid: uid
                //         }, (err, oneTimeToken) => {
                //             Util.sendMail({
                //                 to: user.email,
                //                 subject: 'VERIFY LOGIN',
                //                 content: '<b>' + oneTimeToken.uid + '</b>'
                //             }, (err, info) => {
                //                 console.log(info);
                //                 reject('This is the first time your login on this device. Please check your email to verify this login time!');
                //             });
                //         });
                //     }

                // });
                callback(null, token);
            } catch(e){
                callback(e, null);
            }
        });
    }
}

// passport.use(new BasicStrategy({}, function(username, password, callback) {
//         (new AuthController).authenticate(username, password, callback);
//     }
// ));

module.exports = AuthController;
