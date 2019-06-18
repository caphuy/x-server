var mongoose = require('mongoose');

var model = model || {
    user: mongoose.model('User', mongoose.Schema({
        username: {
            type: String,
            required: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            trim: true
        },
        role: {
            id: mongoose.Schema.Types.ObjectId,
            position: String,
        },
        salary: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
            default: 0,
        },
        profile: mongoose.Schema.Types.Mixed,
        workingStatus: {
            type: Number,
            required: true,
            default: 0
        }, // 0 = inactive, 1 = đang làm việc
        isAdmin: {
            type: Number,
            required: true,
            default: 0
        },
        isBlocked: {
            type: String,
            required: true,
            default: 0
        }, // active or blocked
        schedule : {
            0 : {
                morning : Number,
                afternoon : Number
            },
            1 : {
                morning : Number,
                afternoon : Number
            },
            2 : {
                morning : Number,
                afternoon : Number
            },
            3 : {
                morning : Number,
                afternoon : Number
            },
            4 : {
                morning : Number,
                afternoon : Number
            },
            5 : {
                morning : Number,
                afternoon : Number
            },
            6 : {
                morning : Number,
                afternoon : Number
            }
        },
        join_date: {
            type : Date,
            required : true,
            default: Date.now
        },
        isOnline: {
            type: Boolean,
            required: true,
            default: false
        },
        lastseen: {
            type: String
        },
        picture: {
            type: String
        },
        accepted_device: {
            type: []
        },
        working_project: {
            type: mongoose.Schema.Types.Mixed
        }
    })),

    role: mongoose.model('Role', mongoose.Schema({
        role_name: String,
        max_salary: Number,
        standards: [{
            _id: mongoose.Schema.Types.ObjectId,
            name: String,
            percent: Number,
            parent_id: mongoose.Schema.Types.ObjectId
        }],
        compare_last_month: {
            type: Number,
            default: 0
        },
        default: []
    })),

    salary_history: mongoose.model('Salary_history', mongoose.Schema({
        salaryhistory: mongoose.Schema.Types.Mixed,
        uid: mongoose.Schema.Types.ObjectId,
        created: {type: Date, default: Date.now}
    })),

    time_recorder: mongoose.model('User_Time_Recorder', mongoose.Schema({
        uid: mongoose.Schema.Types.ObjectId,
        date: Date, // Date begin session
        startAt: Date, // Start time
        status: {
            type: Number,
            default: 0
        }, // 0 = Not Paid, 1 = Pending, 2 = Paid

        sec: {
            type: Number,
            required: true,
            default: 0,
        }, // Total seconds of session
        value: {
            type: Number,
            required: true,
            default: 0,
        }, // Total Money of session
        type: {
            type: Number,
            default: 0
        }, // Trừ hay cộng tiền cho session; 0 = Cong, 1 = Tru
        note: String,
    })),


    payment: mongoose.model('User_Payment', mongoose.Schema({
        uid: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        end_date: {
            type: Date,
            required: true,
        },
        status: {
            type: Number,
            default: 0
        }, // 0 = Pending, 1 = Paid
    })),

    task: mongoose.model('Task', mongoose.Schema({
        _id: {
            type: Number,
            default: 0
        },
        uid: mongoose.Schema.Types.ObjectId,
        assign: {
            type: String,
            required: true,
            trim: true
        },
        review: {
            type: String,
            trim: true
        }, // review note lại task bởi admin
        value: {
            type: Number,
            default: 0
        }, // Value của task
        status: {
            type: Number,
            required: true,
            default: 0
        }, // 0 :chưa xong ,1 :đã start, 2: đã request lên supervisor, 3:supervisor request len admin, 4: preapprove, 5 : approved
        deadline: Date,
        created: {
            type: Date,
            required : true
        },
        startAt: Date,
        completed: Date,
        reward: {
            type: Number,
            default: 0
        },
        supervisor: {
            type: mongoose.Schema.Types.Mixed
        },
        isStarred: {
            type: Number
        },
        tags: [],
    })),
    late : mongoose.model('late',mongoose.Schema({
        uid : String,
        date : Date,
        isMorning: Boolean,
        status: {
            type: Number,
            default: 0,
        }, // 0: ,1 :request, 2 : admin approved
        reason:String
    })),
}
module.exports = model;
