/*
 *@author: Cap Huy
 */
"use strict";

var RouteController = Loader.Controller('RouteController'),
    Conf = Loader.Core('Configs'),
    model = model || Loader.Model('UnionModel'),
    Q = require('q');

class UnionGetter extends RouteController{

    constructor(req, res, next) {
        super(req, res, next);
        this.model = model;
    }

    handler() {
        var action = this.req.query.action;
        switch(action) {
            case 'devicepage': {
                var page = this.req.query.page;
                this.selectByPage('union', {}, 'created', page, 20, (err, data) => {
                    if (!err) {
                        return this.print(data);
                    } else {
                        return this.throwError(err);
                    }
                });
                break;
            }
            case 'custom': {
                var startDate = this.req.query.start;
                var endDate = this.req.query.end;
                this.select('union', {created: {$gte: startDate, $lte: endDate}}, (err, data) => {
                    if (!err) {
                        return this.print(data);
                    } else {
                        return this.throwError(err);
                    }
                });
                break;
            }
            case 'tag': {
                var tag = this.req.query.tag;
                this.selectByPage('union', {tags: tag}, 'created', 0, 20, (err, data) => {
                    if (!err) {
                        return this.print(data);
                    } else {
                        return this.throwError(err);
                    }
                });
                break;
            }
            case 'home': {
                var self = this;
                var home = {};
                Q.spawn(function* (){
                    try {
                        yield new Promise((resolve, reject) => {
                            self.selectByPage('union', {}, 'created', 0, 20, (err, data) => {
                                if (!err) {
                                    home.statistic = data;
                                    resolve();
                                } else {
                                    reject(err);
                                }
                            });
                        });
                        yield new Promise((resolve, reject) => {
                            self.sum('union', {amount: {$gt: 0}}, null, '$amount', (err, data) => {
                                if (!err) {
                                    home.incoming = data[0] ? data[0].total : 0;
                                    resolve();
                                } else {
                                    reject(err);
                                }
                            });
                        });
                        yield new Promise((resolve, reject) => {
                            self.sum('union', {amount: {$lt: 0}}, null, '$amount', (err, data) => {
                                if (!err) {
                                    home.outgoing = data[0] ? data[0].total : 0;
                                    resolve();
                                } else {
                                    reject(err);
                                }
                            });
                        });
                        self.print(home);
                    } catch(e){
                        self.throwError(e);
                    }
                });
            }
        }
    }

}

module.exports = UnionGetter;
