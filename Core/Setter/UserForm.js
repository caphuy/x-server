"use strict";

var RouteController = Loader.Controller('RouteController'),
    passport = require('passport'),
    Conf = Loader.Core('Configs'),
    Util = Loader.Core('Utils'),
    AuthController = new (Loader.Controller('User/AuthController'));


class UserForm extends RouteController {
    /*
     * @header
     * Authorization: Basic base64_encode(username:password)
     * api @param
     * {
            "form_id": "UserForm",
            "action": "login"
        }
     */
    login(){
        var header = this.req.headers['authorization']||'',        // get the header
            token = header.split(/\s+/).pop()||'',            // and the encoded auth token
            auth = new Buffer(token, 'base64').toString(),    // convert from base64
            parts = auth.split(/:/);                          // split on colon
            this.req.username = parts[0];
            this.req.password = parts[1];

        AuthController.authenticate(this.req, (err, token) => {
            if (err || !token) {
                this.res.status(Conf.ERROR_CODE.GENERAL).json(err || 'Unknown Error.');
            } else{
                this.res.json(token);
            }
        });


        // console.log(parts);
        // passport.authenticate('basic', { session: false }, (err, token) => {
        //     if (err || !token) {
        //         this.res.status(Conf.ERROR_CODE.GENERAL).json(err || 'Unknown Error.');
        //     } else{
        //         this.res.json(token);
        //     }
        // })(this.req, this.res);
    }

    /*
     * api @param
     * {
        "form_id": "UserForm",
        "action": "register",
        "username": "greatb1nt",
        "password": "123456"
        }
     */
    register(){
        if(this.isAdmin) {
            if(!this.req.body || !this.req.body.username){
                this.res.json('Required field empty.');
            } else{
                var password = this.makePassword();
                AuthController.createUser({
                    username: this.req.body.username,
                    password: password,
                    email: this.req.body.email,
                    join_date: new Date()
                }, (err, user) => {
                    if(err) {
                        this.res.status(Conf.ERROR_CODE.GENERAL).json(err);
                    } else {
                        Util.sendMail({
                            to: 'cabhuy@gmail.com',
                            subject: 'Password secure',
                            content: '<h1>Welcome new member</h1>' +
                                        '<p>Here is your password:</p>' +
                                        '<h3>' + password + '</h3>' +
                                        '<p>Please repassword to protect your account</p>' +
                                        '<h5>XJEUS</h5>'
                        }, (err, info) => {
                            if (!err) {
                                return this.print('Register successfully user' + this.req.body.username);
                            } else {
                                return this.throwError(err);
                            }
                        });
                    }
                });
            }
        } else {
            this.throwError("User have not permission to register");
        }
    }

    makePassword() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < 5; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }
}

module.exports = UserForm;
