var mongoose = require('mongoose');

module.exports = {
    feed: mongoose.model('Feed', mongoose.Schema({
        type: {
            type: String,//git_commit, milestone, new_member, mine
            required: true,
            trim: true,
            lowercase: true,
        },
        content: mongoose.Schema.Types.Mixed,
        createdBy: {
            id: mongoose.Schema.Types.ObjectId,
            username: String,
            name: String,
        },
        created: {
            type: Date,
            required: true
        }
    }))
}
