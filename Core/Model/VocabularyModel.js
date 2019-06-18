var mongoose = require('mongoose');

module.exports = {
    vocabulary: mongoose.model('Vocabulary', mongoose.Schema({
        name: {
            type: String,
            required: true
        },
        description: {
            type: String
        }
    }))
};

