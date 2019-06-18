/*
 *@author: Cap Huy
 */
"use strict";

var RouteController = Loader.Controller('RouteController'),
    mongoose = require('mongoose'),
    Conf = Loader.Core('Configs'),
    UserModel = Loader.Model('UserModel'),
    TermModel = Loader.Model('TermModel'),
    NodeModel = Loader.Model('NodeModel'),
    FeedModel = Loader.Model('FeedModel'),
    ProjectModel = Loader.Model('ProjectModel'),
    UnionModel = Loader.Model('UnionModel'),
    VocabularyModel = Loader.Model('VocabularyModel'),
    Q = require('q');

class Home extends RouteController{

    constructor(req, res, next) {
        super(req, res, next);
        this.model = {};
        this.model.term = TermModel.term;
        this.model.task = UserModel.task;
        this.model.node = NodeModel.node;
        this.model.feed = FeedModel.feed;
        this.model.time_recorder = UserModel.time_recorder;
        this.model.payment = UserModel.payment;
        this.model.project = ProjectModel.project;
        this.model.standard = UserModel.standard;
        this.model.user = UserModel.user;
        this.model.vocabulary = VocabularyModel.vocabulary;
        this.model.union = UnionModel.union;
        this.model.role = UserModel.role;
    }

    handler() {
        var self = this;
        var home = {};
        if (this.isAdmin) {
            home.management = {};
            home.user_management = {};
            home.configurations = {};
            Q.spawn(function* (){
                try {
                    yield new Promise((resolve, reject) => {
                        self.selectByPage('task', {status: {$in: [2, 3]}}, 'created', 0, 10, (err, data) => {
                            if (!err) {
                                home.management.pending_changes = data;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.selectByPage('time_recorder', {}, 'startAt', 0, 20, (err, data) => {
                            if (!err) {
                                home.management.salary_management = data;
                                resolve();
                            } else {
                                reject(err)
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.selectByPage('payment', {}, 'created', 0, 20, (err, data) => {
                            if (!err) {
                                home.management.payment_management = data;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.selectByPage('project', {}, 'estimatedTime', 0, 20, (err, data) => {
                            if (!err) {
                                home.project_management = data;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.select('vocabulary', {}, (err, data) => {
                            if (!err) {
                                home.term_management = data;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.selectByPage('time_recorder', {}, 'created', 0, 20, (err, data) => {
                            if (!err) {
                                home.user_management.stats = data;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.selectByPage('payment', {}, 'end_date', 0, 20, (err, data) => {
                            if (!err) {
                                home.user_management.payment = data;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.select('user', {isAdmin: 0}, (err, data) => {
                            if (!err) {
                                home.user_management.users = data;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.select('role', {}, (err, data) => {
                            if (!err) {
                                console.log(data);
                                home.configurations.roles = data;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    self.print(home);
                } catch(e){
                    console.log(e);
                    self.throwError(e);
                }
            });
        } else {
            var uid = this.req._user._id;
            var rid = this.req._user.role.id;
            home.currentSalary = this.req._user.salary;
            home.working_project = this.req._user.working_project;
            home.timeRecorders = {};
            home.project = {};
            Q.spawn(function* (){
                try {
                    yield new Promise((resolve, reject) => {
                        self.select('term', {pinned: true}, (err, pins) => {
                            if (!err) {
                                home.pins = pins;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.selectByPage('task', {}, 'created', 0, 20, (err, tasks) => {
                            if (!err) {
                                home.tasks = tasks;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.selectByPage('node', {}, 'meta.created', 0, 20, (err, nodes) => {
                            if (!err) {
                                home.nodes = nodes;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.counting('project', {teamMembers: {$elemMatch: {_id: uid}}}, (err, data) => {
                            if (!err) {
                                home.projects_count = data;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.counting('feed', {uid: uid, type: 'git_commit'}, (err, data) => {
                            if (!err) {
                                home.tasks_count = data;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.counting('task', {uid: uid}, (err, data) => {
                            if (!err) {
                                home.commits_count = data;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.selectByPage('feed', {}, 'created', 0, 20, (err, feeds) => {
                            if (!err) {
                                home.feeds = feeds;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.selectByPage('union', {}, 'created', 0, 20, (err, unions) => {
                            if (!err) {
                                home.unions = unions;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.selectByPage('time_recorder', {uid: uid}, 'startAt', 0, 20, (err, allTimeRecorder) => {
                            if (!err) {
                                home.timeRecorders.all = allTimeRecorder;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.selectByPage('time_recorder', {uid: uid, status: 1}, 'startAt', 0, 20, (err, bonusTimeRecorder) => {
                            if (!err) {
                                home.timeRecorders.bonus = bonusTimeRecorder;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.selectByPage('time_recorder', {uid: uid, status: 0}, 'startAt', 0, 20, (err, bonusTimeRecorder) => {
                            if (!err) {
                                home.timeRecorders.pen = bonusTimeRecorder;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.selectByPage('payment', {}, 'end_date', 0, 20, (err, payments) => {
                            if (!err) {
                                home.payments = payments;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.select('standard', {rid: rid}, (err, standards) => {
                            if (!err) {
                                home.standards = standards;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        self.sum('time_recorder', {status: 0, uid: uid}, null, '$value', (err, data) => {
                            if (!err) {
                                home.available_balance = data[0] ? data[0].total : 0;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        var date = new Date(), y = date.getFullYear(), m = date.getMonth();
                        var firstDay = new Date(y, m, 1);
                        var lastDay = new Date(y, m + 1, 0);
                        firstDay.setHours(23, 0, 0, 0);
                        lastDay.setHours(23, 59, 59, 999);
                        self.sum('time_recorder', {status: 0,
                                                   uid: uid,
                                                   date: {$gte: firstDay, $lte: lastDay}},
                                                       null, '$value', (err, data) => {
                            if (!err) {
                                home.this_month_so_far = data[0] ? data[0].total : 0;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    yield new Promise((resolve, reject) => {
                        var start = new Date();
                        var end = new Date();
                        start.setDate(start.getDate() - 1);
                        end.setDate(end.getDate() - 1);
                        start.setHours(0, 0, 0, 0);
                        end.setHours(23, 59, 59, 999);
                        self.sum('time_recorder', {status: 0,
                                                   uid: uid,
                                                   date: {$gte: start, $lte: end}},
                                                       null, '$value', (err, data) => {
                            if (!err) {
                                home.yesterday = data[0] ? data[0].total : 0;
                                resolve();
                            } else {
                                reject(err);
                            }
                        });
                    });
                    // yield new Promise((resolve, reject) => {
                    //     var workingProjectId = mongoose.mongo.ObjectId(self.req._user.working_project._id);
                    //     self.counting('task', {project: {$elemMatch: {_id: workingProjectId}}}, (err, data) => {
                    //         if (!err) {
                    //             console.log(data);
                    //             home.project.tasks_added = data;
                    //             resolve();
                    //         } else {
                    //             reject(err);
                    //         }
                    //     });
                    // });
                    // yield new Promise((resolve, reject) => {
                    //     var workingProjectId = mongoose.mongo.ObjectId(user.working_project._id);
                    //     this.counting('task', {project: {$elemMatch: {_id: workingProjectId}},
                    //                            status: 0}, (err, data) => {
                    //         home.project.tasks_opening = data;
                    //     });
                    // });
                    // yield new Promise((resolve, reject) => {
                    //     var workingProjectId = mongoose.mongo.ObjectId(user.working_project._id);
                    //     this.counting('task', {project: {$elemMatch: {_id: workingProjectId}},
                    //                            status: 2}, (err, data) => {
                    //         home.project.tasks_completed = data;
                    //     });
                    // });

                    self.print(home);
                } catch(e){
                    console.log(e);
                    self.throwError(e);
                }
            });
        }
    }
}

module.exports = Home;
