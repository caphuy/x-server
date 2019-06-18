"use strict";
var RouteController = Loader.Controller('RouteController'),
    mongoose = require('mongoose'),
    UserController = Loader.Controller('User/UserController'),
    Conf = Loader.Core('Configs'),
    Util = Loader.Core('Utils'),
    model = model || Loader.Model('UserModel');

class TaskForm extends RouteController {
    constructor(req, res, next) {
        super(req, res, next);
        this.model = model;
    }

    /**
     * Tạo task mới
     * @params
     * {
        "form_id": "TaskForm",
        "action": "create",
        "assign": Nhiệm vụ của task,
        "deadline": Deadline task, định dạng new Date hoặc timestamp
       }
     */
    create() {
        this.count('task', (err, count) => {
            var now = Util.getLocalTime();
            var uid = new mongoose.mongo.ObjectId(this.req.body.user._id);
            var record = {
                _id: count,
                uid: uid,
                assign: this.req.body.assign,
                created:now.toISOString(),
            };
            if (this.data.supervisor) {
                record.supervisor = this.data.supervisor;
                record.supervisor._id = mongoose.mongo.ObjectId(record.supervisor._id);
            }
            this.save('task', record, (err, data) => {
                if (!err) {
                    if (data._id === count){
                        return this.print(data);
                    } else {
                        this.res.status(Conf.ERROR_CODE.GENERAL).json('no thing changed!');
                    }
                } else {
                    this.res.status(Conf.ERROR_CODE.GENERAL).json(err);
                }
                // var taskId = (!err) ? data._id : 0;
                // this.insertLog(taskId,"create",!Boolean(err));
            });
        });
    }

    markAsDone() {
        var taskId = this.req.body.taskid;
        this.update('task', {_id: taskId}, {status: 2}, (err, data) => {
            if (!err) {
                this.print(data);
            } else {
                this.throwError(err);
            }
        });
    }

    addStar() {
        var taskId = this.req.body.taskid;
        this.update('task', {_id: taskId}, {star: 1}, (err, data) => {
            if (!err) {
                return this.print(data);
            } else {
                return this.throwError(err);
            }
        })
    }

    removeStar() {
        var taskId = this.req.body.taskid;
        this.unset('task', {_id: taskId}, {star: ""}, (err, data) => {
            if (!err) {
                return this.print(data);
            } else {
                return this.throwError(err);
            }
        });
    }

    /**
     * Start task
     * @params
     * {
        "form_id": "TaskForm",
        "action": "start",
        "taskId": id của task,
        "deadline": Deadline task, định dạng new Date hoặc timestamp
        }
     */
    start() {
        var calc = new TaskCalc(),
            user = this.data.user,
            now = Util.getLocalTime(),
            taskId = this.data.taskId;
        calc.calcSecondWorked(user,{start:now.getTime(),end:this.data.deadline}, (err,mseconds) => {
            var salaryPerSec = Util.calcSalaryPerSec(user.salary),
                value = (mseconds/1000) * salaryPerSec;
            this.update('task',{_id:taskId},{deadline: new Date(this.data.deadline).toISOString(),value:value,startAt:now.toISOString(),status:1}, (err, data) => {
                if (!err) {
                    if(data.nModified > 0) {
                        this.res.json(data);
                    } else {
                        this.res.status(Conf.ERROR_CODE.GENERAL).json('Wrong task ID or no pending update.');
                    }
                } else {
                    this.res.status(Conf.ERROR_CODE.GENERAL).json(err);
                }
                // var result = (err) ? Boolean(err) : Boolean(data.nModified);
                // this.insertLog(taskId,"start",result);
            });
        });

    }

    /**
     * Gửi request đến admin khi xong task
     * @params
     * {
        "form_id": "TaskForm",
        "action": "requestComplete",
        "taskId": id của task,
        }
     */
    requestComplete(){
        var now = Util.getLocalTime();
        var taskId = this.data.taskId;
        this.update('task', { _id: { $eq: taskId, $exists: true } }, { status: 2 }, (err, data) => {
            if (!err) {
                if(data.nModified > 0) {
                    this.res.json(data);
                } else {
                    this.res.status(Conf.ERROR_CODE.GENERAL).json('Wrong task ID or no pending update.');
                }
            } else {
                this.res.status(Conf.ERROR_CODE.GENERAL).json(err);
            }
            // var result = (err) ? Boolean(err) : Boolean(data.nModified);
            // this.insertLog(taskId,"requestComplete",result);
        });
    }


    /**
      * Supervisor
      * @params
      *  {
      *      "form_id" : "TaskForm",
      *      "action" : "supervisor",
      *      "body" :{ "taskId": "13", "supervisor":"abcxyz" }
      *  }
      */
      supervisor(){
         var taskId = this.data.taskId;
         var supervs = this.data.supervisor;
         if (taskId !== -1) {
             this.update('task', { _id: { $eq: taskId, $exists: true } }, { supervisor: supervs, status:3 }, (err, data) => {
                 if (err) {
                     this.res.json({ status: 404, success: false, message:err });
                 } else {
                     data.status = 200;
                     this.res.json(data);
                 }
                 // var result = (err) ? Boolean(err) : Boolean(data.nModified);
                 // this.insertLog(taskId,"supervisor",result);
             });
         } else {
             this.insertLog(taskId,"supervisor",false);
         }
     }

    /**
     * Admin tạm thời chấp nhận task
     * @params
     * {
        "form_id": "TaskForm",
        "action": "preApproved",
        "taskId": id của task,
        }
     */
    preApproved(){
        var taskId = this.data.taskId;
        this.select('task',{_id:taskId},(err,data) => {
            if (!err){
                if (data.length > 0){
                    var now = Util.getLocalTime(),
                        deadline = new Date(data[0].deadline).getTime(),
                        // value = data[0].value,
                        calc = new TaskCalc();
                    calc.calc(this.data.user,deadline, now.getTime(), (e, result) => {
                        this.update('task', { _id: { $eq: taskId, $exists: true } }, { status: 4 , reward:(result/1000)}, (err, data) => {
                            if (!err) {
                                if(data.nModified > 0) {
                                    this.res.json(data);
                                } else {
                                    this.res.status(Conf.ERROR_CODE.GENERAL).json('Wrong task ID or no pending update.');
                                }
                            } else {
                                this.res.status(Conf.ERROR_CODE.GENERAL).json(err);
                            }
                            // var result = (err) ? Boolean(err) : Boolean(data.nModified);
                            // this.insertLog(taskId,"preApproved",result);
                        });
                    });
                } else {
                    this.insertLog(taskId,"preApproved",false);
                    this.res.status(Conf.ERROR_CODE.GENERAL).json('Wrong task ID or no pending update.');
                }
            } else {
                this.insertLog(taskId,"preApproved",false);
                this.res.status(Conf.ERROR_CODE.GENERAL).json(err);
            }
        });


        // this.res.json(s);

    }

    /**
     * Admin approve task
     * @params
     * {
     *   "form_id": "TaskForm",
     *   "action": "approve",
     *   "taskId": id của task
     * }
     */
     approve(){
        var taskId = this.data.taskId;
        this.update('task', { _id: { $eq: taskId, $exists: true } }, { status: 5, review: this.data.review}, (err, data) => {
            if (!err) {
                if(data.nModified > 0) {
                    this.res.json(data);
                } else {
                    this.res.status(Conf.ERROR_CODE.GENERAL).json('Wrong task ID or no pending update.');
                }
            } else {
                this.res.status(Conf.ERROR_CODE.GENERAL).json(err);
            }
            // var result = (err) ? Boolean(err) : Boolean(data.nModified);
            // this.insertLog(taskId,"approve",result);
        });
     }

    /**
     * Thêm log vào db
     * @params
     *  {
     *    taskId: taskId,
     *    action: "",
     *    result: ,
     *  }
    */

    insertLog(taskId,action,result){
        var now = Util.getLocalTime();
        var uid = this.data.user._id.toString();
        this.save('log', { uid: uid, taskId: (taskId) ? taskId : 0, action:action, result: result, created:now.toISOString()}, (err, data) => {
            if (err) return console.log(err);
            console.log(data);
        });
    }

    handler() {
        this.action();
        // var calc = new TaskCalc();
        // calc.calcSecondWorked(this.data.user,{start:this.data.start,end:this.data.end}, (err,data) => {
        //     this.res.json(data/1000/60/60);
        // });
    }
}

class TaskCalc extends UserController {
    /**
     * @param
     * units số giây truyền vào để tính mức phạt,
     * Mức 0 : 3 ngày
     * Mức 1 : 4-7 ngày
     * Mức 2 : 7-10 ngày
     * Mức 3 : Lớn hơn 10 ngày
     */
    getPenaltyLevel(units){
        var fineLV = Conf.PENALTY_LEVEL;
        if (units <= fineLV[0].max) return 0;
        if (units <= fineLV[0].max + fineLV[1].max) return 1;
        if (units <= fineLV[0].max + fineLV[1].max + fineLV[2].max) return 2;
        return 3;
    }

    /**
     * Tính lương từ số giây vượt deadline, nếu sớm hơn deadline thì số giây âm,
     * Mức phạt có thể thay đổi trong file config.
     * @param:
     * "over" : số giây vượt deadline hoặc sớm so với deadline
     * "userData" : dùng để lấy schedule của user
     * trả về số tiền được cộng tương ứng với số giây vượt hay sớm so với deadline
     */
    calcOverSalary(over, userData){
        var salaryPerSec = Util.calcSalaryPerSec(userData.salary);
        if (over >= 0) {
            var fineLV = Conf.PENALTY_LEVEL,
                sum = 0, // Tổng số tiền sẽ được cộng
                lv = this.getPenaltyLevel(over), // Lấy mức phạt
                day = 0; // ví dụ: Mức 1 tối đa 3 ngày
                         // over là thời gian vượt deadline 2 ngày, thì biến "day"
                         // vẫn nhận giá trị là 3, sau vòng for mới trừ đi.
            for (var i = 0; i <= lv; i++) {
                sum += fineLV[i].max * fineLV[i].moneyLv * salaryPerSec;
                day += fineLV[i].max;
            }
            if (day >= over) {
                sum -= (day - over) * fineLV[lv].moneyLv * salaryPerSec;
            } else {
                sum += (over - day) * fineLV[3].moneyLv * salaryPerSec;
            }
            return sum;
        } else {
            return salaryPerSec * (-over);
        }
    }

    /**
     * Tổng số giây làm việc từ ngày X đến ngày Y
     * @params
     * userData: là user
     * data : {
     *   start : ngày bắt đầu
     *   end : ngày kết thúc
     * }
     * Muốn tính cả số giây làm trong ngày X thì nên đặt X.getHours() < Y.getHours()
     */
    calcSecondWorked(userData, data, callback) {
        var start = data.start,
            end = data.end,
            sum = 0, // Tổng số giây làm việc
            unit = 4 * 60 * 60, // số giây làm việc của mỗi buổi 4 tiếng * 60 Phút * 60 giây;
            schedule = userData.schedule;

        var workingHour = Conf.WORKING_HOUR;
        if(schedule) {
            while (start <= end) {
                var dayOfWeek = new Date(start).getDay(), // Lấy ngày trong tuần
                    morning = schedule[dayOfWeek].morning, // Buổi sáng làm hay không
                    afternoon = schedule[dayOfWeek].afternoon, // Buổi chiều làm hay không
                    morningEnd = (new Date(start)).setHours(workingHour.MORNING.END,0,0), // giờ kết thức buổi sáng
                    afternoonEnd = (new Date(start)).setHours(workingHour.AFTERNOON.END,0,0), // giờ kết thúc buổi chiều
                    morningStart = (new Date(start)).setHours(workingHour.MORNING.START,0,0), // giờ bắt đầu buổi sáng
                    afternoonStart = (new Date(start)).setHours(workingHour.AFTERNOON.START,0,0); // giờ bắt đầu buổi chiều

                console.log(' thu ' + (dayOfWeek+1));
                // Nếu start trước giờ làm việc buổi sáng thì gán start bằng giờ làm việc buổi sáng
                start = (start < morningStart) ? morningStart : start;
                if (morning && start <= morningEnd){ // Nếu buổi sáng có làm việc theo lịch và thời gian start thuộc vào buổi sáng
                    // nếu thời gian start trước giờ làm việc thì set start = giờ làm việc
                    var startTmp = (start >= morningStart) ? start : morningStart;

                    // nếu end trước giờ kết thúc làm việc buổi sáng
                    var endTmp = (end < morningEnd) ? end : morningEnd;
                    // console.log(afternoonStart);
                    console.log('sang lam ' + (endTmp - startTmp) / 1000 / 60 / 60);

                    // Tổng = end - start;
                    sum += (endTmp - startTmp);
                    if (end >= afternoonStart){
                        start = afternoonStart;
                    }
                } else {
                    console.log('sang nghi');
                }

                // Nếu start sau thời gian làm việc buổi chiều.
                start = (start < afternoonStart) ? afternoonStart : start;
                if (afternoon && start <= end){ // Buổi chiều có làm việc và chưa kết thúc deadline
                    var startTmp = (afternoonStart < start) ? start : afternoonStart;
                    var endTmp = (end < afternoonEnd) ? end : afternoonEnd;
                    console.log('chieu lam ' + (endTmp - startTmp) / 1000 / 60 / 60);
                    // console.log(afternoonStart);
                    sum += (endTmp - startTmp);

                } else {
                    console.log('chieu nghi');
                }
                // next đến ngày tiếp theo và set giờ là giờ làm việc buổi sáng.
                start = (new Date(start+24*60*60*1000)).setHours(workingHour.MORNING.START,0,0);
            }
            console.log('Tong :' + sum/1000/60/60);
            return callback(null, sum);
        } else {
            return callback(`Could not find working schedule of ${userData.username}`)
        }
    }

    /**
     * Tính tiền lương được cộng khi xong deadline
     * @params
     * deadline : Thời gian (timestamp) deadline
     * completed : Thời gian (timestamp) lúc client request xong task
     */
    calc(userData, deadline, completed, callback) {
        if(completed >= deadline) {
            // chậm tiến độ, over = total
            this.calcSecondWorked(userData, {
                start: deadline,
                end: completed
            }, (e, total) => {
                return callback(null, this.calcOverSalary(total, userData));
            });
        } else {
            // nhanh tiến độ, over= -total
            this.calcSecondWorked(userData, {
                start: completed,
                end: deadline
            }, (e, total) => {
                return callback(null, this.calcOverSalary(-total, userData));
            });
        }

    }
}

module.exports = TaskForm;
