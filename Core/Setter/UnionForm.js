/*
 *@author: Huy
 */
"use strict";

var RouteController = Loader.Controller('RouteController'),
    Model = Loader.Model('UnionModel');

class UnionForm extends RouteController {

    constructor(req, res, next) {
        super(req, res, next);
        this.model = Model;
    }

    add() {
        var union = {};
        union.amount = parseInt(this.req.body.amount);
        union.note = this.req.body.note;
        if (this.req.body.tags != undefined) {
            union.tags = this.req.body.tags;
        }
        this.save('union', union, (err, data) => {
            if (!err) {
                return this.print(data);
            } else {
                return this.throwError(err);
            }
        });
    }

    remove() {

    }

    handler(){
        // data.user = req._user;
        // this.next = next;
        // this.data = data;
        // this.res = res;
        this.action();
    }
}

module.exports = UnionForm;
