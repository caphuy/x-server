var mongoose = require('mongoose');

module.exports = {
    project: mongoose.model('Project', mongoose.Schema({
        estimatedTime: {
            type: Date,
            required: true
        },
        gitProjects: {
            type: [],
            required: true
        },
        teamMembers: {
            type: [mongoose.Schema.Types.Mixed],
            required: true
        },
        mainColor: {
            type: String,
            required: true
        },
        description: {
            type: String
        }
    }))
};


