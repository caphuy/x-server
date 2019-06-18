/*
 *@author: Huy
 */
"use strict";

var mongoose = require('mongoose'),
    RouteController = Loader.Controller('RouteController'),
    Conf = Loader.Core('Configs'),
    Model = Loader.Model('UserModel'),
    Q = require('q');

class SalaryForm extends RouteController {

    constructor(req, res, next) {
        super(req, res, next);
        this.model = Model;
    }

    /*
     * url: localhost:3000/post
     * json1: {
     *       "form_id": "SalaryForm",
     *       "rid": "5746c3686b90dbe3e1b93506",
     *       "action": "addstandard",
     *       "std1": "30",
     *       "std2": "30",
     *       "std3": "40"
     *   }
     * json2: {
     *       "form_id": "SalaryForm",
     *       "rid": "5746c3686b90dbe3e1b93506",
     *       "action": "addstandard",
     *       "std1": "30",
     *       "std2": "30",
     *       "std3": "40",
     *       "pid": "574905f95405af441f3fd9be"
     *   }
     * Sử dụng: Gửi json1 nếu muốn thêm standard, json2 nếu muốn thêm standard con
     * Thuật toán: Trong json sẽ có thông tin về roleId, parentId (nếu set), và các standard cùng %
     *             Lọc để lấy các thông tin về các standard trước để cho vào mảng standards (chứa tên các standard muốn thêm)
     *             Thực hiện các thao tác kiểm duyệt dữ liệu:
     *                 + Check xem trong số các standard muốn set có trùng tên với các standard đã có trong csdl hay không
     *                 + Check format và check xem có đúng mỗi thứ > 0% và <= 100% hay không
     *                 + Check xem tổng % các standard đã có cùng với % các standard mới có <= 100% hay không
     *             1 lỗi xảy ra sẽ return về lỗi và không thực hiện tiếp
     *             Nếu không có lỗi thì lưu các standard muốn set vào csdl
     * Các biến có thể không rõ ràng:
     *         body: Chứa toàn bộ request
     *         rid: roleId
     *         pid: parentId (Mặc định là null nếu không set)
     *         standards: Mảng chứa tên các standards muốn thêm
     *         bodyKeys: Mảng chứa các key của body
     *         bodyKeysLength: độ dài mảng bodyKeys
     *         totalPercent: Tổng toàn bộ % các standard
     *         standardsLength: Độ dài mảng standards
     *         docsLength: Độ dài mảng docs
     */
    addStandard() {
        var body = this.req.body;
        var pid = body.pid ? new mongoose.mongo.ObjectId(body.pid) : null;
        var rid = new mongoose.mongo.ObjectId(body.rid);
        var standards = this.req.body.standards;
        var standardKeys = Object.keys(standards);
        var standardKeysLength = standardKeys.length;
        var totalStandardPercent = 0;
        var standardsArr = [];

        // console.log(standardKeys);
        for (var i = 0; i < standardKeysLength; i++) {
            var standard = standards[standardKeys[i]];
            if (standard.name != undefined && standard.percent != undefined) {
                var newStandard = {};
                newStandard._id = new mongoose.mongo.ObjectId();
                newStandard.name = standard.name;
                newStandard.percent = standard.percent;
                newStandard.rid = rid;
                newStandard.parent_id = null;
                standardsArr.push(newStandard);
                totalStandardPercent += standard.percent;
                if (standard.childs != undefined) {
                    var childs = standard.childs;
                    var childKeys = Object.keys(childs);
                    var childKeysLength = childKeys.length;
                    var totalChildPercent = 0;
                    for (var j = 0; j < childKeysLength; j++) {
                        var child = childs[childKeys[j]];
                        if (child.name != undefined && child.percent != undefined) {
                            var newChild = {};
                            newChild._id = new mongoose.mongo.ObjectId();
                            newChild.name = child.name;
                            newChild.percent = child.percent;
                            newChild.rid = rid;
                            newChild.parent_id = newStandard._id;
                            standardsArr.push(newChild);
                            totalChildPercent += child.percent;
                        }
                    }
                    if (totalChildPercent < 100) {
                        return this.print('FAIL: <100%');
                    } else if (totalChildPercent >100) {
                        return this.print('FAIL: >100%');
                    }
                }
            }
        }
        if (totalStandardPercent == 100) {
            this.findOne('role', {_id: rid}, (err, role) => {
                if (!err) {
                    var newMaxSalary = this.req.body.new_max;
                    var compare_last_month = newMaxSalary - role.max_salary;
                    this.update('role', {_id: rid}, {max_salary: newMaxSalary,
                                                     compare_last_month: compare_last_month,
                                                     standards: standardsArr},
                                            (err, data) => {
                        if (!err) {
                            return this.print(data);
                        } else {
                            console.log(err);
                            return this.throwError(err);
                        }
                    });
                } else {
                    this.throwError(err);
                }
            });
        } else if (totalStandardPercent < 100) {
            return this.print('FAIL: < 100%');
        } else {
            return this.print('FAIL: > 100%');
        }
    }

    setsalary() {
        var body = this.req.body;
        var uid = new mongoose.mongo.ObjectId(body.uid);
        var max_salary;
        var realSalary = 0;
        var objectSalary = {};
        var objectStandards = {};
        var totalPercent = 0;
        this.findById('user', uid, (err, user) => {
            if (!err) {
                var rid = new mongoose.mongo.ObjectId(user.role.id);
                this.findById('role', rid, (err, role) => {
                    console.log(role);
                    if (!err) {
                        realSalary = role.max_salary;
                        max_salary = role.max_salary;
                        var standards = role.standards;
                        var standardsLength = standards.length;
                        for (var i = 0; i < standardsLength; i++) {
                            var standard = standards[i];
                            var standardPercent = standard.percent / 100;
                            var settingStandard = body[standard.name];

                            if ((isNaN(settingStandard) && settingStandard != undefined)
                                || parseFloat(settingStandard) > 100
                                || parseFloat(settingStandard) < 0) {
                                return this.res.json('Wrong format');
                            }
                            var settingStandardPercent = parseFloat(settingStandard) / 100;
                            if (standard.parent_id == null) {
                                objectStandards[standard._id] = {};
                                objectStandards[standard._id].info = {};
                                if (settingStandard == undefined) {
                                    objectStandards[standard._id].child = {};
                                    var totalChildPercent = 0;
                                    for (var j = 0; j < standardsLength; j++) {
                                        var child = standards[j];
                                        var settingChild = body[child.name];
                                        if (standard._id.equals(child.parent_id)) {
                                            var childPercent = child.percent / 100;
                                            if (isNaN(settingChild)
                                                || parseFloat(settingChild) > 100
                                                || parseFloat(settingChild) < 0) {
                                                return this.res.json('Wrong format');
                                            }
                                            var settingChildPercent = parseFloat(settingChild) / 100;
                                            totalChildPercent += childPercent * settingChildPercent;
                                            var info = {};
                                            info.name = child.name;
                                            info.percent = settingChildPercent;
                                            info.money = settingChildPercent * childPercent * standardPercent *max_salary;
                                            objectStandards[standard._id].child[child._id] = {};
                                            objectStandards[standard._id].child[child._id] = info;
                                        }
                                    }
                                    totalPercent += standardPercent * totalChildPercent;
                                    var info = {};
                                    info.money = standardPercent * totalChildPercent * max_salary;
                                    info.name = standard.name;
                                    info.percent = totalChildPercent;
                                    objectStandards[standard._id].info = info;
                                } else {
                                    var info = {};
                                    info.money = standardPercent * settingStandardPercent * max_salary;
                                    info.name = standard.name;
                                    info.percent = settingStandardPercent;
                                    objectStandards[standard._id].info = info;
                                    totalPercent += standardPercent * settingStandardPercent;
                                }
                            }
                        }
                        realSalary *= totalPercent;
                        objectSalary.standards = objectStandards;
                        objectSalary.total = realSalary;
                        objectSalary.total_percent = totalPercent;
                        objectSalary.compare_last_month = realSalary - user.salary.total;
                        var self = this;
                        Q.spawn(function* (){
                            try {
                                yield new Promise((resolve, reject) => {
                                    self.update('user', {_id: uid}, {salary: objectSalary}, (err, data) => {
                                        if (!err) {
                                            resolve();
                                        } else {
                                            reject(err);
                                        }
                                    });
                                });
                                yield new Promise((resolve, reject) => {
                                    self.save('salary_history', {
                                        salaryhistory: objectSalary,
                                        uid: uid
                                    }, (err, data) => {
                                        if (!err) {
                                            resolve();
                                        } else {
                                            reject(err);
                                        }
                                    });
                                });
                                self.print('ok');
                            } catch(e){
                                console.log(e);
                            }
                        });
                    } else {
                        return this.res.json(err);
                    }
                });
            } else {
                return this.res.json(err);
            }
        });
    }
}

module.exports = SalaryForm;
