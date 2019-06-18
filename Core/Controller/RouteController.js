"use strict";
var Conf = Loader.Core('Configs'),
    DatabaseController = Loader.Controller('DatabaseController');

/**
 * Các class con muốn kế thừa constructor và thêm var vào this thì dùng
 * constructor(req, res, next) {
    super(req, res, next);
   }
 */
class RouteController extends DatabaseController {

    constructor(req, res, next) {
        super();
        this.next = next;
        this.req= req;
        this.data = req.body || {};
        this.query = req.query || {};
        this.data.user = req._user;
        this.isAdmin = req._user ? req._user.isAdmin == 1 : null;
        this.res = res;
    }

    action() {
        var action = this.data.action || this.query.action;
        if(!action || typeof this[action] !== "function"){
            return this.throwError('Oops...Got no action!');
        } else {
            return this[action]();
        }
    }

    throwError(e, errorCode = Conf.ERROR_CODE.GENERAL) {
        return this.res.status(errorCode).json(e);
    }

    print(message) {
        this.res.json(message);
    }

    handler() {
        this.action();
    }
}

module.exports = RouteController;
