"use strict";

var RouteController = Loader.Controller('RouteController'),
    DatabaseController = Loader.Controller('DatabaseController'),
    model = model || Loader.Model('TermModel'),
    Conf = Loader.Core('Configs');

class Term extends RouteController {
    constructor(req, res, next) {
        super(req, res, next);
        this.model = model;
        // console.log(this.data);

        this.conditions = {};
        this.getter = new TermGetter;

        var keys = Object.keys(this.query);
        var len = keys.length;

        for (var i = 0; i < len; i++) {
            if (keys[i] !== 'id' && keys[i] !== 'action') {
                this.conditions[keys[i]] = this.query[keys[i]];
            }
        }
    }

    getAncestors() {
        if(this.conditions._id) {
            this.getter.getAncestors({_id: this.conditions._id}, (err, data) => {
                if (err) {
                    this.throwError(err);
                } else {
                    this.print(data);
                }
            });
        } else {
            this.throwError(`Could not parse ID.`);
        }
    }

    getDescendants() {
        if(this.conditions._id) {
            this.getter.getDescendants({parent: this.conditions._id}, (err, data) => {
                if (err) {
                    this.throwError(err);
                } else {
                    this.print(data);
                }
            });
        } else {
            this.throwError(`Could not parse ID.`);
        }
    }

    get() {
        this.select('term', this.conditions, (err, data) => {
            if(!err && data && data.length > 0) {
                this.print(data);
            } else {
                this.throwError('Could not find term.');
            }
        });
    }

}

class TermGetter extends DatabaseController {
    constructor() {
        super(); // exception thrown here when not called
        this.model = model;
        this.ancestors = [];
        this.descendants = [];
    }

    /*
     * Lấy toàn bộ các term cha và tổ tiên
     * Đệ quy cho đến khi không tìm đc bản ghi trên nó
     * Mỗi lần tìm được đều push vào thuộc tính ancestors
     */
    getAncestors(conditions, callback) {
        this.findOne('term', conditions, (err, doc1) => {
            if(!err) {
                var parent = doc1.parent;
                this.ancestors.push(doc1);

                if (parent == null) {
                    this.ancestors.splice(0, 1); // Xóa element đầu tiên, chính là bản ghi của thằng đang muốn tìm tổ tiên
                    callback(null, this.ancestors);
                } else {
                    this.getAncestors({_id: parent}, callback);
                }
            } else {
                callback(err.message || err);
            }
        });
    }

    /*
     * Lấy toàn bộ con và cháu
     * Đệ quy cho đến khi không tìm đc bản ghi dưới nó
     * Mỗi lần tìm được đều push vào thuộc tính descendants
     */
    getDescendants(conditions, callback) {
        this.select('term', conditions, (err, docs) => {
            if(!err) {
                if (docs[0] == undefined) {
                    callback(null, this.descendants);
                } else {
                    var arrIDs = [];
                    var len = docs.length;
                    for (var i = 0; i < len; i++) {
                        arrIDs.push(docs[i]._id);
                    }
                    this.descendants = this.descendants.concat(docs);
                    this.getDescendants({parent: {$in: arrIDs}}, callback);
                }

            } else {
                callback(err.message || err);
            }
        });
    }

}
module.exports = Term;
