"use strict";

var baseUtil = require('util'),
    Conf = Loader.Core('Configs.js'),
    fs = require('fs'),
    nodemailer = require('nodemailer'),
    transporter = nodemailer.createTransport('smtps://no-reply%40jeus.co:1A2b3C4d@smtp.gmail.com');

var util = {
    routing: function(id, method, req, res, next){
        var methodDir = _DIR[method];

        if(typeof id === 'string' && typeof methodDir === 'string'){
            var path = `${methodDir}${id}.js`;
            fs.access(path, fs.F_OK, (err) => {
                if(!err){
                    var MethodLoader = require(path);
                    var Controller = new MethodLoader(req, res, next);
                    Controller.handler();
                } else{
                    res.status(Conf.ERROR_CODE.NOTFOUND).json(`${method} {${id}} not exist. Path: ${path}`);
                }
            });
        } else{
            res.status(Conf.ERROR_CODE.GENERAL).json(`ID: ${id}?`);
        }
    },

    getLocalTime: function(timezone = Conf.TIMEZONE){
        // create Date object for current location
        var d = new Date();

        // convert to msec
        // add local time zone offset
        // get UTC time in msec
        var utc = d.getTime() + (d.getTimezoneOffset() * 60000);

        // create new Date object for different city
        // using supplied offset
        return new Date(utc + (3600000*timezone));
    },
    getMidNightTime: function(date = this.getLocalTime()){
        // Tháng bắt đầu từ 0
        // Đụ con mẹ JS ngu vkl!!
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    },
    checkAccessWorkSession: function(){
        return ;
        var hour = this.getLocalTime().getHours();
        if((hour >= Conf.WORKING_HOUR.MORNING.END && hour < Conf.WORKING_HOUR.AFTERNOON.START) ||
            (hour > 0 && hour < Conf.WORKING_HOUR.MORNING.START)){
            return 'Chưa đến giờ làm việc.';
        } else if(hour >= Conf.WORKING_HOUR.AFTERNOON.END && hour <= 23){
            return 'Đã hết giờ làm việc.';
        }
    },
    formatWorkingTime: function(seconds){
        return +(Math.round((seconds/3600) + "e+2")  + "e-2");
    },
    formatMoney: function(amount, hasSign = true){
        var formatter = new Intl.NumberFormat('es-ES', {style: 'currency', currency: 'eur', minimumFractionDigits: 0, maximumFractionDigits: 0});
        return formatter.format(amount);
        // return  number_format(money, 0, '', '.') + (hasSign ? ' ₫' : '');
    },
    _30days_ago: function() {
        return new Date(this.getLocalTime().getTime() - 30*24*60*60*1000);
        // return strtotime('-30 days, 00:00');
    },
    calcDayInMonth: function(month,year){
        return new Date(year, month, 0).getDate();
    },
    calcDayOffInMonth: function(){
        var now = this.getLocalTime();
        var nationalDayOffThisMonth = Conf.DAYOFF[now.getMonth()+1].length;
        return 6 + nationalDayOffThisMonth;
    },
    calcSalaryPerSec: function(salaryPerMonth) {
        var now = this.getLocalTime();
        // Số ngày trong tháng
        // now.getMonth() bắt đầu từ 0
        // Đụ con mẹ JS ngu vkl!!
        var totalDay = this.calcDayInMonth(now.getMonth() + 1, now.getFullYear()) - this.calcDayOffInMonth();
        var todoSec = 8 * 3600; // Số giây phải làm mỗi ngày
        var totalSec = totalDay * todoSec; // Số giây phải làm mỗi tháng
        var moneyPerSec = salaryPerMonth / totalSec; // Số tiền / mỗi giây
        return moneyPerSec;
    },
    calcSessionSecond: function(start){
        var stopTime = this.getLocalTime().getTime();
        var startTime = start.getTime();
        var maxHour = start.getHours() >= 14 ? Conf.WORKING_HOUR.AFTERNOON.END : Conf.WORKING_HOUR.MORNING.END;
        var maxTime = new Date(start.getFullYear(), start.getMonth(), start.getDate(), maxHour, 0, 0, 0);
        var milSeconds = stopTime < maxTime ? (stopTime - startTime) : (maxTime - startTime);
        return milSeconds/1000;
    },
    calcSessionSalary: function(start, salaryPerMonth) {
        var totalSessionSec = this.calcSessionSecond(start);
        var moneyPerSec = this.calcSalaryPerSec(salaryPerMonth);
        return moneyPerSec * totalSessionSec;
    },

    sendMail: function(options, callback) {
        /*
         * Options include:
         * to: email want to send
         * subject: subject
         * content: html code, all about body of email
         * attachments: array all attachments wants to send. It seem like:
         *  [
                {
                    filename: 'x.txt',
                    path: 'D:/path/to/x.txt'
                },
            ]
         * example options:
         * {
         *      from: '"Auto email" <no-reply@jeus.co>',
         *      to: 'cabhuy@gmail.com',
         *      subject: 'Test',
         *      html: '<b>Hello world</b>',
         *      attachments: [
         *          {   // file on disk as an attachment
         *              filename: 'x.txt',
         *               path: 'D:/path/to/x.txt' // stream this file
         *          },
         *      ]
         * }
         */
        var mailOptions = {
            from: '"Auto email" <no-reply@jeus.co>',
            to: options.to,
            subject: options.subject,
            html: options.content
        };
        if (options.attachments) {
            mailOptions.attachments = options.attachments;
        }
        transporter.sendMail(mailOptions, callback);
    }
};


module.exports = Object.assign(baseUtil, util);
