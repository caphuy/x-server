var Conf = require('./Configs.js'),
    path = require("path");

global._DIR = {
    SETTER: __dirname + '/Setter/',
    GETTER:  __dirname + '/Getter/',
    UPLOAD_TMP: path.join(__dirname, '..') + '/uploads',
};
global.Loader = {
    Controller: function(ctrl){
        return require(__dirname + '/Controller/' + ctrl);
    },
    Model: function(mdl){
        return require(__dirname + '/Model/' + mdl);
    },
    Core: function(file){
        return require(__dirname + '/' + file);
    },
};