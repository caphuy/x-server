"use strict";

class DatabaseController {
    save(collection, data, callback){
        return new this.model[collection](data).save(callback);
    }

    select(collection, conditions, callback) {
        this.model[collection].find(conditions, callback);
    }

    selectLastest(collection, conditions, sortField, limit, callback) {
        return this.model[collection].find(conditions).sort('-' + sortField).limit(limit).exec(callback);
    }

    selectCustomField(collection, conditions, fields, callback) {
        this.model[collection].find(conditions, fields, callback);
    }

    update(collection, conditions, setting, callback) {
        return this.model[collection].update(conditions, {$set: setting}, {multi: true}, callback);
    }

    unset(collection, conditions, setting, callback) {
        return this.model[collection].update(conditions, {$unset: setting}, {multi: true}, callback);
    }

    remove(collection, conditions, callback) {
        this.model[collection].remove(conditions, callback);
    }

    count(collection, callback) {
        this.model[collection].count(callback);
    }

    counting(collection, conditions, callback) {
        this.model[collection].count(conditions, callback);
    }

    findById(collection, id, callback) {
        return this.model[collection].findById(id, callback);
    }

    findOne(collection, conditions, callback) {
        return this.model[collection].findOne(conditions, callback);
    }

    like(collection, keyword, callback) {
        return this.model[collection].find({$text: {$search: keyword, $caseSensitive: false, $diacriticSensitive: true}}, callback);
    }

    sum(collection, conditions, idField,  sumField , callback) {
        return this.model[collection].aggregate(
            {
                $match: conditions
            },
            {
                $group: {
                    _id: idField,
                    total: {
                        $sum: sumField
                    }
                }
            },
            callback
        );
    }

    selectByPage(collection, conditions, sortField, page, itemPerPage, callback) {
        var numSkip = page * itemPerPage;
        return this.model[collection].find(conditions).sort('-' + sortField).skip(numSkip).limit(itemPerPage).exec(callback);
    }

    selectByPageCusField(collection, conditions, fields, sortField, page, itemPerPage, callback) {
        var numSkip = page * itemPerPage;
        return this.model[collection].find(conditions, fields).sort('-' + sortField).skip(numSkip).limit(itemPerPage).exec(callback);
    }

    distinct(collection, conditions, field, callback) {
        return this.model[collection].distinct(field, conditions, callback);
    }
}

module.exports = DatabaseController;
