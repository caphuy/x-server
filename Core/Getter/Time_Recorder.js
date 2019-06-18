/*
 *@author: Huy
 */
"use strict";

var RouteController = Loader.Controller('RouteController'),
    Conf = Loader.Core('Configs'),
    model = model || Loader.Model('UserModel');

class TimeRecorderGetter extends RouteController {

    constructor(req, res, next) {
        super(req, res, next);
        this.model = model;
    }

    handler() {
        var action = this.req.query.action;
        var uid = this.req.query.uid;
        switch (action) {
            case 'getbydate':
                var date = this.req.query.date;
                this.select('time_recorder', {date: date}, (err, data) => {
                    this.print(data);
                });
                break;
            case 'getbycustomdate':
                var startDate = this.req.query.start;
                var endDate = this.req.query.end;
                this.select('time_recorder', {date: {$gte: startDate, $lte: endDate}}, (err, data) => {
                    if (!err) {
                        return this.print(data);
                    } else {
                        console.log(err);
                    }
                });
                break;
        }
    }

}

module.exports = TimeRecorderGetter;
