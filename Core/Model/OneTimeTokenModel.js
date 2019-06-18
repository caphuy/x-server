var mongoose = require('mongoose');

module.exports = {
    one_time_token: mongoose.model('One_Time_Token', mongoose.Schema({
        uid: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        }
    }))
};
