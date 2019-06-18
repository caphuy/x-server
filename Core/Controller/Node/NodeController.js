"use strict";
var Q = require('q'),
    TermController = new (Loader.Controller('Term/TermController')),
    model = model || Loader.Model('NodeModel');

class NodeController {
    constructor() {
        // create collection "Node" in mongodb
        this.model = model;
    }
    prepareNode(input, callback){
        var node = {
            'type': 'documentation',
            'title': input.title,
            'body': input.body,
            'meta': {
                author: input.author,
            }
        }
        return callback(null, node);
    }
    createNode(node, callback) {
        return new this.model(node).save(callback);
    }
    getNodeById(id, callback) {
        return this.model.findById(id, callback);
    }
    getNode(conditions, callback) {
        return this.model.find(conditions, callback);
    }
    parseAutocompleteTerm(terms, vocabulary, callback){
        var inputTerm = [],
            existTerm = [],
            newTerm = [],
            cbRes = [],
            cbErr = null;
        function parseInputTerm(){
            if(terms){
                var parse = terms.split(',');
                var parseLength = parse.length;
                for(var i = 0; i < parseLength; i++){
                    var term = parse[i].trim();
                    if(term.length !== 0) inputTerm.push(term);
                }
                return Promise.resolve();
            }
        }
        function parseExistTerm(){
            return new Promise(function(resolve, reject) {
                TermController.getTermsByName(inputTerm, function(err, resp){
                    if (err){
                        reject(err);
                    } else{
                        // Đm, có 1 lỗi khắm lọ ở đây là nếu tag user
                        // nhập vào là number, ví dụ 123,456
                        // thì khi parse ra sẽ bị lỗi lìn j ấy (thử là biết)
                        // nên phải thêm $ vào trước để number thành string.
                        // ĐCM Javascript làm mất cả buổi chiều đéo hiểu lỗi mẹ gì!
                        cbRes = resp;
                        var length = resp.length;
                        for(var i=0;i<length;i++){
                            var tag = resp[i];
                            var name = tag.name;
                            existTerm['$' + name] = tag._id;
                        }
                        resolve();
                    }
                });
            });

        }
        function createNewTerm(){
            var length = inputTerm.length;
            for(var i = 0;i<length;i++){
                var termName = inputTerm[i].toString();
                if(!existTerm['$' + termName]){
                    newTerm.push({
                        vocabulary: 'tags',
                        name: termName
                    });
                }
            }
            if(newTerm.length > 0){
                return new Promise(function(resolve, reject) {
                    TermController.create(newTerm, function(err, createdTerms){
                        if (err){
                            reject(err);
                        } else{
                            Array.prototype.push.apply(cbRes, createdTerms.ops);
                            resolve();
                        }
                    });
                });
            } else{
                return Promise.resolve(cbRes);
            }
        }
        Q.spawn(function* (){
            try {
                yield parseInputTerm();
                yield parseExistTerm();
                yield createNewTerm();
                callback(null, cbRes);
            } catch(e){
                callback(e, null);
            }
        });

    }


}

module.exports = NodeController;
