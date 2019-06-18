/*
 *@author: Huy
 */
"use strict";

var RouteController = Loader.Controller('RouteController'),
    Model = Loader.Model('VocabularyModel');

class VocabularyForm extends RouteController {

    constructor(req, res, next) {
        super(req, res, next);
        this.model = Model;
    }

    add() {
        var name = this.req.body.name;
        var description;
        if (this.req.body.description == undefined) {
            description = null;
        } else {
            description = this.req.body.description;
        }
        this.save('vocabulary', {
            name: name,
            description: description
        }, (err, data) => {
            if (!err) {
                return this.res.json(data);
            }
        });
    }

    handler(){
        // data.user = req._user;
        // this.next = next;
        // this.data = data;
        // this.res = res;
        this.action();
    }
}

module.exports = VocabularyForm;
