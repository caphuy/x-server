"use strict";
var RouteController = Loader.Controller('RouteController'),
    usermodel = usermodel || Loader.Model('UserModel'),
    feedmodel = feedmodel || Loader.Model('FeedModel');

class Dashboard extends RouteController {
    constructor(req, res, next) {
        super(req, res, next);
        this.model = Object.assign(usermodel, feedmodel);
    }
    handler() {
        this.select('feed', {'type' : 'git_commit'}, (e, result) => {
            this.print(result);
        });
    }
}

module.exports = Dashboard;