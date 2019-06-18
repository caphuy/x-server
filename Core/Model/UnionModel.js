var mongoose = require('mongoose');

module.exports = {
    union: mongoose.model('Union', mongoose.Schema({
        amount: {
            type: Number
        },
        note: {
            type: String,
            required: true,
            trim: true
        },
        created: {
            type: Date,
            default: Date.now
        },
        tags: {
            type: [],
            required: true,
            default: ['general']
        }
    }))
};
