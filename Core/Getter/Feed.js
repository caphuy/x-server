/*
 *@author: Huy
 */
"use strict";

var RouteController = Loader.Controller('RouteController'),
    mongoose = require('mongoose'),
    Conf = Loader.Core('Configs'),
    Model = Loader.Model('FeedModel');

class Feed extends RouteController{

    constructor(req, res, next) {
        super(req, res, next);
        this.model = Model;
    }

    handler() {
        var action = this.req.query.action;
        switch (action) {
            case 'getbyid':
                var feedId = this.req.query.feedid;
                this.findOne('feed', {_id: feedId}, (err, data) => {
                    if (!err) {
                        return this.print(data);
                    } else {
                        console.log(err);
                        return this.throwError(err);
                    }
                });
                break;
            case 'getbytype':
                var type = this.req.query.type; //git_commit, milestone, new_member, mine
                var page = this.req.query.page;
                this.selectByPage('feed', {type: type}, 'created', page, 20, (err, data) => {
                    if (!err) {
                        return this.print(data);
                    } else {
                        console.log(err);
                        return this.throwError(err);
                    }
                });
                break;
        }
    }
}

module.exports = Feed;
