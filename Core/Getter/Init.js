/*
 *@author: Huy
 */
"use strict";

var RouteController = Loader.Controller('RouteController'),
    Conf = Loader.Core('Configs'),
    UserModel = Loader.Model('UserModel'),
    NodeModel = Loader.Model('NodeModel'),
    Q = require('q');

class Init extends RouteController {

    constructor(req, res, next) {
        super(req, res, next);
        this.model = {};
        this.model.node = NodeModel.node;
        this.model.user = UserModel.user;
        this.model.time_recorder = UserModel.time_recorder;
        this.model.payment = UserModel.payment;
    }

    handler(){
        var self = this;
        var ret = {
            user: this.data.user,
        };
        if (this.isAdmin) {
            Q.spawn(function* () {
                try {
                    yield new Promise((resolve, reject) => {
                        var date = new Date(), y = date.getFullYear(), m = date.getMonth();
                        var firstDay = new Date(y, m, 1);
                        var lastDay = new Date(y, m + 1, 0);
                        firstDay.setHours(23, 0, 0, 0);
                        lastDay.setHours(23, 59, 59, 999);
                        self.sum('time_recorder', {status: 0,
                                                   date: {$gte: firstDay, $lte: lastDay}},
                                                       null, '$value', (err, data) => {
                            if (!err) {
                                ret.salary_this_month = data[0] ? data[0].total : 0;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.sum('time_recorder', {status: 0}, null, '$value', (err, data) => {
                            if (!err) {
                                ret.salary_all_time = data[0] ? data[0].total : 0;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.sum('payment', {status: 0}, null, '$amount', (err, data) => {
                            if (!err) {
                                ret.pending = data[0] ? data[0].total : 0;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.sum('payment', {status: 1}, null, '$amount', (err, data) => {
                            if (!err) {
                                ret.processed = data[0] ? data[0].total : 0;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        ret.remaining = Conf.BUDGET - ret.salary_all_time;
                        ret.total = Conf.BUDGET;
                        resolve();
                    });
                    self.print(ret);
                } catch(e){
                    console.log(e);
                    self.throwError(e);
                }
            });
        } else {
            var id = this.data.user._id;
            Q.spawn(function* (){
                try {
                    yield new Promise((resolve, reject) => {
                        self.selectByPage('node', {type: 'article'}, 'meta.created', 0, 10, (err, articles) => {
                            if (!err) {
                                ret.articles = articles;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.selectByPage('node', {type: 'note'}, 'meta.created', 0, 10, (err, articles) => {
                            if (!err) {
                                ret.articles = articles;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.selectCustomField('user', {_id: {$ne: id}}, {
                            _id: 1,
                            isOnline: 1,
                            lastseen: 1,
                            picture: 1,
                            username: 1}, (err, users) => {
                                if (!err) {
                                    ret.buddies = users;
                                    resolve();
                                } else {
                                    reject(err);
                                }
                        });
                    });
                    self.print(ret);
                } catch(e){
                    self.throwError(e);
                }
            });
        }
    }
}

module.exports = Init;
