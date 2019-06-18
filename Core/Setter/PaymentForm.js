/*
 *@author: Huy
 */
"use strict";

var RouteController = Loader.Controller('RouteController'),
    Conf = Loader.Core('Configs'),
    mongoose = require('mongoose'),
    Model = Loader.Model('UserModel');

class PaymentForm extends RouteController{

    constructor(req, res, next) {
        super(req, res, next);
        this.model = Model;
    }

    getPaymentSum(){

    }

    createPayment() {
        if (this.isAdmin) {
            this.sum('time_recorder', {status: 0}, '$uid', '$value', (err, data1) => {
                this.update('time_recorder', {
                        status: 0
                    }, {status: 1}, (err, data2) => {
                    if (!err) {
                        if (data2.n > 0) {
                            var len = data1.length;
                            for (var i = 0; i < len; i++) {
                                var newPayment = {};
                                var uid = data1[i]._id;
                                var amount = data1[i].total;
                                var date = new Date();
                                date.setDate(1);
                                date.setHours(-1);
                                var end_date = date.getTime();
                                newPayment['uid'] = new mongoose.mongo.ObjectId(uid);
                                newPayment['amount'] = amount;
                                newPayment['end_date'] = end_date;
                                this.save('payment', newPayment, (err, data) => {
                                    if (!err) {

                                    } else {
                                        return this.res.json(err);
                                    }
                                });
                            }
                            return this.print("ok");
                        } else {
                            return this.print(data1);
                        }
                    } else {
                        return this.print(err);
                    }
                });
             });
        } else {
            return this.print('User have not permission')
        }
    }

    payPayment() {
        var paymentId = this.req.body.paymentid;
        this.update('payment', {_id: paymentId}, {status: 1}, (err, data) => {
            if (!err) {
                return this.print(data);
            } else {
                return this.throwError(err);
            }
        });
    }

    handler(){
        // data.user = req._user;
        // this.next = next;
        // this.data = data;
        // this.res = res;
        if(!this.data.action || typeof this[this.data.action] !== "function"){
            return this.res.status(Conf.ERROR_CODE.GENERAL).json('Oops...Got no action!');
        } else{
            return this[this.data.action]();
        }
    }
}

module.exports = PaymentForm;
