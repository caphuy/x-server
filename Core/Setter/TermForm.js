"use strict";

var RouteController = Loader.Controller('RouteController'),
    mongoose = require('mongoose'),
    Conf = Loader.Core('Configs'),
    model = model || Loader.Model('TermModel');

class TermForm extends RouteController {
    constructor(req, res, next) {
        super(req, res, next);
        this.model = model;
    }
    // add(){
    //     TermController.create({
    //         vocabulary: 'tags',
    //         name: 'This is tag 1',
    //     }, function(err, user){
    //         if (err){
    //             return res.end(err);
    //         } else{
    //             // Success Message
    //             return res.end('Register successfully!');
    //         }
    //     });
    // }


    /*
     * {
     *      "form_id": "TermForm",
     *      "action": "add",
     *      "schema": {
     *              "vocabulary": "vocab1",
     *              "name": "term1",
     *              "parent": null
     *       }
     * }
     */
    add() {
        var parent = this.data.schema.parent ? new mongoose.mongo.ObjectId(this.data.schema.parent) : null;
        var schema = {
            name: this.data.schema.name,
            vocabulary: {
                _id: new mongoose.mongo.ObjectId(this.data.schema.vocabulary.id),
                name: this.data.schema.vocabulary.name
            },
            parent: parent
        };
        if (this.data.schema.vocabulary.name == 'Task tags') {
            schema.isPinned = this.data.schema.isPinned;
        }
        this.save('term', schema, (err, data) => {
            if(!err) {
                this.print(data);
            } else {
                this.throwError(err);
            }
        });
    }

    updatePin() {
        var id = this.data.id;
        var isPinned = this.isPinned;
        this.update('term', {_id: id}, {isPinned: isPinned} , (err, data) => {
            if (!err) {
                this.print(data);
            } else {
                this.throwError(err);
            }
        });
    }

    delete() {
        var id = this.data.id;
        this.remove('term', {_id: id}, (err, data) => {
            if (!err) {
                this.print(data);
            } else {
                this.throwError(err);
            }
        });
    }
}

module.exports = TermForm;

// bulkadd(){
//         TermController.create(
//             [
//                 {
//                     vocabulary: 'tags',
//                     name: 'This is tag 7',
//                 },
//                 {
//                     vocabulary: 'tags',
//                     name: 'This is tag 8',
//                 },
//             ], function(err, terms){
//             if (err){
//                 return res.end(err);
//             } else{
//                 return res.json(terms);
//             }

//         });
//     }
