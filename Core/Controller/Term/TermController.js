"use strict";
var model = model || Loader.Model('TermModel');

class TermController {
    constructor() {
        // create collection "Node" in mongodb
        this.model = model;
    }
    createSingleTerm(term, callback) {
        return new this.model(term).save(callback);
    }
    create(terms, callback) {
        return this.model.collection.insert(terms, callback);
    }
    getTermById(id, callback) {
        return this.model.findById(id, callback);
    }
    getSuggestionTag(name, callback) {
        return this.model.find({
            'vocabulary' : 'tags',
            'name': {'$regex': name}
        }, 'name', callback);
    }
    /*
     * Get multiple terms by name
     * @param names
     *  array of names need to find on db
    */
    getTermsByName(names, callback){
        // console.log(names);
        return this.model.find({
            'vocabulary' : 'tags',
            'name': {'$in': names}
        }, callback);
    }
}


module.exports = TermController;