var mongoose = require('mongoose');

module.exports = {
    file: mongoose.model('File', mongoose.Schema({
        mimetype: {
            type: String,
            required: true,
            trim: true
        },
        originalname: {
            type: String,
            required: true,
            trim: true
        },
        filename: {
            type: String,
            required: true,
            trim: true
        },
        size: {
            type: Number,
            required: true
        },
        FTP: {
            type: String,
            required: true,
            trim: true
        }
    }))
}