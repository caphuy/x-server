/*
 *@author: Huy
 */
"use strict";

var RouteController = Loader.Controller('RouteController'),
    Conf = Loader.Core('Configs'),
    model = model || Loader.Model('ProjectModel');

class ProjectGetter extends RouteController{

    constructor(req, res, next) {
        super(req, res, next);
        this.model = model;
    }

    handler() {
        var action = this.req.query.action;
        switch (action) {
            case 'getrecents':
                this.selectByPage('project', {}, 'estimatedTime', 0, 100, (err, data) => {
                    if (!err) {
                        return this.print(data);
                    } else {
                        return this.print(err);
                    }
                });
                break;
            case 'getbyid':
                var _id = this.req.query._id;
                this.findById('project', _id, (err, data) => {
                    if (!err) {
                        return this.print(data);
                    } else {
                        return this.print(err);
                    }
                });
        }
    }

}

module.exports = ProjectGetter;
