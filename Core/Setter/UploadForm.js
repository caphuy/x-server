"use strict";

var RouteController = Loader.Controller('RouteController'),
    Conf = Loader.Core('Configs'),
    ConfigFTP = Conf.FTP,
    client = require('ftp'),
    fs = require('fs'),
    model = model || Loader.Model('FileModel');

class UploadForm extends RouteController {
    constructor(req, res, next) {
        super(req, res, next);
        this.model = model;
    }
     /*
     * Upload file sửa dụng formdata xhr
     * localhost:3000/upload
     * headers: enctype: multipart/form-data
     * data: {
     *        file: file
     *        action: upload
     *        form_id: UploadForm
     *    }
     * Biến path là đường dẫn tạm trên server NodeJS hiện tại
     * Hàm client.put để đưa lên ftp, tham số thứ 2 là đường dẫn muốn lưu trên server ftp
     */
    upload() {
        
        if(this.req.files && this.req.files.length > 0) {
            var length = this.req.files.length,
                returnFile = [],
                returnErr = [],
                paths = [],
                c = new client(),
                isFinished = function() {
                    return returnFile.length + returnErr.length == length;
                };

            c.connect(ConfigFTP.defaults);
            c.on('error', (e) => {
                this.throwError(e);
            });
            c.on('ready', () => {
                var deferred = new Promise((resolve,reject) => {
                    for(var i=0; i<length; i++) {
                        // nếu dùng var thay cho let sẽ gây lỗi
                        // các var cũ sẽ không bị thay thế khi vòng for tiếp tục
                        let file = this.req.files[i],
                            filename = this.req.files[i].filename,
                            path = _DIR.UPLOAD_TMP + '/' + filename,
                            ftpPath = ConfigFTP.defaults.basepath + filename,
                            tmpFile = {
                                'mimetype': file.mimetype,
                                'filename': filename,
                                'size': file.size,
                                'originalname': file.originalname,
                                'FTP': ConfigFTP.defaultName
                            };
                        
                        paths.push(path); // để tí nữa then unlink

                        c.put(path, `/${filename}`, (err) => {
                            if (!err) {
                                this.save('file', tmpFile, (err, data) => {
                                    if(!err) {
                                        data.url = ftpPath;
                                        returnFile.push(data);
                                    } else {
                                        returnErr.push(err);
                                    }
                                    if(isFinished()) resolve();
                                });
                            } else {
                                returnErr.push(err);
                            }

                            if(isFinished()) resolve();
                        });
                    }
                });
                deferred.then(() => {
                    c.end();
                    var pathLength = paths.length;
                    for(var i=0; i<pathLength; i++) {
                        fs.unlink(paths[i]);
                    }
                    if(returnErr.length == 0) {
                        this.print(returnFile);
                    } else {
                        this.throwError(returnErr);
                    }
                });
            });

            
        } else {
            this.throwError('No file selected.');
        }
    }

    /*
     * Xóa file sửa dụng json
     * localhost:3000/post
     * data: {
     *        action: delete
     *        form_id: NodeForm
     *        id: "dsadsa"
     *    }
     * Lấy file theo id sau đó xóa file trên ftp và xóa file trong csdl
     */
    deleteFile() {
        if(this.data.id) {
            var id = this.data.id;
            this.findById('file', id, (err, file) => {
                if(!err && file) {
                    this.remove('file', {_id: id}, (err, data) => {
                        if (err) {
                            return this.throwError(err);
                        } else {
                            var c = new client();
                            c.on('ready', () => {
                                var path = '/' + file.filename;
                                c.delete(path, (err) => {
                                    c.end();
                                    return !err ? this.print('ok') : this.throwError(err);
                                });
                            });
                            c.connect(ConfigFTP[file.FTP]);
                        }
                    });
                } else {
                    return this.throwError(`Could not find file.`);
                }
            });
        }
        
    }
}

module.exports = UploadForm;