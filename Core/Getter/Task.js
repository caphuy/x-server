/*
 *@author: Huy
 */
"use strict";

var RouteController = Loader.Controller('RouteController'),
    mongoose = require('mongoose'),
    Conf = Loader.Core('Configs'),
    Model = Loader.Model('UserModel');

class Task extends RouteController{

    constructor(req, res, next) {
        super(req, res, next);
        this.model = Model;
    }

    handler() {
        var action = this.req.query.action;
        switch (action) {
            case 'gettaskbytag':
                var page = this.req.query.page;
                var tagId = new mongoose.mongo.ObjectId(this.req.query.tagid);
                this.selectByPage('task', {tags: {$elemMatch: {_id: tagId}}}, 'created',page, 20, (err, tasks) => {
                    if (!err) {
                        this.print(tasks);
                    } else {
                        console.log(err);
                        this.throwError(err);
                    }
                });
                break;
            case 'gettaskbyid':
                var taskId = this.req.query.taskid;
                this.findOne('task', {_id: taskId}, (err, task) => {
                    if (!err) {
                        return this.print(task);
                    } else {
                        console.log(err);
                        return this.throwError(err);
                    }
                });
                break;
        }
    }
}

module.exports = Task;
