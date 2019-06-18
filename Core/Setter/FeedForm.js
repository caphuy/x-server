"use strict";

var RouteController = Loader.Controller('RouteController'),
    model = model || Loader.Model('FeedModel');

class FeedForm extends RouteController {
    constructor(req, res, next) {
        super(req, res, next);
        this.model = model;
    }
    /**
     * Tạo feed
     * @params
     * {
        "form_id": "FeedForm",
        "action": "create",
        "content": Object/array/text,
        }
     */
    createCommit() {
        if(this.data.type && this.data.content && (this.data.content.length > 0 || Object.keys(this.data.content).length > 0)) {
            // Check type xem có được cho phép không
            // chỉ cần thêm type được cho phép vào array sau 'git_commit'
            if(['git_commit',].indexOf(this.data.type) >= 0 || this.data.user.isAdmin === 1) {
                var createdBy = {
                    id: this.data.user.id,
                    username:  this.data.user.username,
                };
                if(this.data.user.profile && this.data.user.profile.fullname) createdBy.name = this.data.user.profile.fullname;

                this.save('feed', {
                    type: this.data.type,
                    createdBy: createdBy,
                    content: this.data.content,
                }, (err, data) => !err ? this.print(data) : this.throwError(err));
            }
            else {
                this.throwError("You need permission to perform this action.", 401);
            }
        } else {
            this.throwError('Please fill in all of the required fields.');
        }
    }

    createFeed(feed, callback) {
        this.save('feed', feed, callback);
    }

    handler() {
        this.action();
    }
}

module.exports = FeedForm;
