/*
 *@author: Huy
 */
"use strict";

var RouteController = Loader.Controller('RouteController'),
    mongoose = require('mongoose'),
    Conf = Loader.Core('Configs'),
    model = model || Loader.Model('NodeModel'),
    NodeController = new (Loader.Controller('Node/NodeController'));

class NodeGetter extends RouteController{

    constructor(req, res, next) {
        super(req, res, next);
        this.model = model;
    }

    handler() {
        var uid = new mongoose.mongo.ObjectId(this.req._user._id);
        var action = this.req.query.action;
        switch (action) {
            case 'getbypage':
                var page = this.req.query.page;
                this.selectByPage('node', {}, 'created', page, 20, (err, nodes) => {
                    if (!err) {
                        return this.print(nodes);
                    } else {
                        return this.throwError(err);
                    }
                });
                break;
            case 'getbyterm':
                var term = new mongoose.mongo.ObjectId(this.req.query.term);
                var page = this.req.query.page;
                this.selectByPage('node', {'terms.categories': {$elemMatch: {_id: term}}}, 'created', page, 20, (err, nodes) => {
                    if (!err) {
                        return this.print(nodes);
                    } else {
                        return this.throwError(err);
                    }
                });
                break;
            case 'getnotetags':
                this.distinct('node', {type: 'note',
                                       'meta.author._id': uid},
                                           'terms.tags', (err, data) => {
                    if (!err) {
                        return this.print(data);
                    } else {
                        return this.throwError(err);
                    }
                });
                break;
            case 'getbytagid':
                var tagId = new mongoose.mongo.ObjectId(this.req.query.tagid);
                var page = this.req.query.page;
                this.selectByPage('node', {'terms.tags': {$elemMatch: {_id: tagId}},
                                           'meta.author._id': uid},
                                               'created', page, 20, (err, data) => {
                    if (!err) {
                        return this.print(data);
                    } else {
                        return thos.print(err);
                    }
                });
                break;
            case 'getbytagandproject':
                var tagId = new mongoose.mongo.ObjectId(this.req.query.tagid);
                var projectId = new mongoose.mongo.ObjectId(this.req.query.projectid);
                var page = this.req.query.page;
                this.selectByPage('node', {'terms.tags': {$elemMatch: {_id: tagId}},
                                     'projects': {$elemMatch: {_id: projectId}},
                                     'meta.author._id': uid},
                                         'created', page, 20, (err, data) => {
                    if (!err) {
                        return this.print(data);
                    } else {
                        return this.throwError(err);
                    }
                });
                break;
            case 'getbyprojectid':
                var projectId = new mongoose.mongo.ObjectId(this.req.query.projectid);
                var page = this.req.query.page;
                this.selectByPage('node', {'projects': {$elemMatch: {_id: projectId}},
                                     'meta.author._id': uid},
                                         'created', page, 20, (err, data) => {
                    if (!err) {
                        return this.print(data);
                    } else {
                        return thos.print(err);
                    }
                });
                break;
        }
    }

}

module.exports = NodeGetter;
