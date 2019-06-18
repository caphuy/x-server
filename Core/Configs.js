var mongoose = require('mongoose'),
    WorkingHour = require('./Config/WorkingHourConfig'),
    DayOff = require('./Config/DayOffConfig');



var conf = conf || Object.freeze({
    PORT: 3000,
    TIMEZONE: +7,
    SESSION_ALIVE: 2, // số ngày tồn tại của token
    TOKEN_LENGTH: 32,
    DB: 'mongodb://127.0.0.1/x',
    ERROR_CODE: {
        GENERAL: 721, // when query wrong or callback error
        UNEXPECTED: 722, // must restart app to fix error
        ACCESS: 401, // access denied,
        NOTFOUND: 404,
    },
    WORKING_HOUR: WorkingHour,
    DAYOFF: DayOff,
    CREATE_SESSION_KEY: 'zo6ipz6*"P0F21:.QHN5sVkam0Cxv~0/4y.A9"Y_LU78P?8!ca-nwN#^4es=UV',
    // HOST: {
    //     INTERNAL: '192.168.16.109',
    //     EXTERNAL: '113.190.203.137',
    // },
    ALLOWED_IP: ['113.190.203.137', '::1', '127.0.0.1'],
    WORK_SESSION_KEY_ALIVE: 2, // minute

    IMGURUSERNAME: 'jeusco',

    /**
     * vd: max: 3 * 8 * 60 * 60
     * 8 * 60 * 60 : số giây trong 1 ngày làm việc tức 8 tiếng
     * 3 : 3 ngày.
     * moneyLv : số lần tiền được cộng khi quá deadline
     * mức phạt theo bậc thang, mức 1 3 ngày, mức 2 4-7 ngày, mức 3 7-10 ngày, mức 4 >10 ngày
     */

    PENALTY_LEVEL: [
        {
            max: 3 * 8 * 60 * 60,
            moneyLv: -0.5
        }, // level 1
        {
            max: 4 * 8 * 60 * 60,
            moneyLv: -1
        }, // level 2
        {
            max: 3 * 8 * 60 * 60,
            moneyLv: -1.5
        }, // level 3
        {
            max: 0,
            moneyLv: -2,
        }, // level 4
    ],
    ALLOWED_LATE_MIN : 20,
    TARDINESS_REDUCTION : 20000, // Số tiền trừ mỗi lần đi muộn || nghỉ

    BUDGET: 5000000000,

    FTP: {
        FTP1: {
            host: "107.180.51.8",
            port: 21, // defaults to 21
            user: "de@dl.leechbb.com", // defaults to "anonymous"
            password: "ONOu8arKod", // defaults to "@anonymous"
            basepath: "http://dl.leechbb.com/de/"
        },
    }
});

mongoose.connect(conf.DB);
conf.FTP.defaults = conf.FTP.FTP1;
conf.FTP.defaultName = 'FTP1';

module.exports = conf;

// var mailOptions = {
//         from: '"Cáp Huy" <caphuy.282@gmail.com>',
//         to: 'greatbnt@gmail.com',
//         subject: 'Test',
//         text: 'Test',
//         html: '<b>Hello world</b>'
//     };
//     transporter.sendMail(mailOptions, (err, info) => {
//         if (err) {
//             return console.log(err);
//         } else {
//             console.log('Message sent: ' + info.response);
//         }
//     });
