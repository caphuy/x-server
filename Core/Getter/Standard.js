/*
 *@author: Cap Huy
 */
"use strict";

var RouteController = Loader.Controller('RouteController'),
    Conf = Loader.Core('Configs'),
    model = model || Loader.Model('UserModel'),
    Q = require('q');

class StandardGetter extends RouteController{

    constructor(req, res, next) {
        super(req, res, next);
        this.model = model;
    }

    handler() {
        var roleId = this.req.query.roleid;
        var ret = {};
        this.findOne('role', {_id: roleId}, (err, role) => {
            if (!err) {
                this.select('standard', {rid: roleId}, (err, standards) => {
                    if (!err) {
                        ret.role = role;
                        ret.standards = standards;
                        return this.print(ret);
                    } else {
                        return this.throwError(err);
                    }
                });
            } else {
                return this.throwError(err);
            }
        });
    }

}

module.exports = StandardGetter;
