"use strict";
var DatabaseController = Loader.Controller('DatabaseController'),
    model = model || Loader.Model('UserModel');

class UserController extends DatabaseController {
    constructor() {
        super(); // exception thrown here when not called
        this.model = model;
    }
    getUserById(id, callback) {
        this.model.user.findById(id, callback);
    }
    getUserByUsername(username, callback) {
        this.model.user.findOne({'username': username}, callback);
    }
    getUser(conditions, field, callback) {
        return this.model.user.find(conditions, field, callback);
    }
}

module.exports = UserController;
