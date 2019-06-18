var mongoose = require('mongoose');

module.exports = {
    node: mongoose.model('Node', mongoose.Schema({
        type: {
            type: String,
            required: true,
            trim: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        body: String,

        meta: {
            author: {
                id: mongoose.Schema.Types.ObjectId,
                name: String,
                username: String,
            },
            created : {
                type : Date,
                default: Date.now
            },
            updated: {
                type: Date,
                default: Date.now
            },
            sticky: {
                type: Number,
                default: 0
            },
            status: {
                type: Number,
                default: 1
            },
        },
        terms: mongoose.Schema.Types.Mixed,
        attachment: mongoose.Schema.Types.Mixed,
        projects: []
    }))
};
