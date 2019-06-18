var mongoose = require('mongoose');

module.exports = mongoose.model('GitProject', mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    gitDate: {
        type: Date,
        required: true,
        default: Date.now
    }
}));

