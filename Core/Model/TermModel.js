"use strict";
var mongoose = require('mongoose');

module.exports = {
    term: mongoose.model('Term', mongoose.Schema({

        vocabulary: mongoose.Schema.Types.Mixed,
        name: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        parent: mongoose.Schema.Types.ObjectId,
        isPinned: {
            type: Boolean,
            required: false
        }
    }))
};
