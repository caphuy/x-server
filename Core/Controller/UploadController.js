var multer = require('multer'),
    storage = multer.diskStorage({
        destination: _DIR.UPLOAD_TMP,
        filename: function (req, file, cb) {
            var date = (new Date()).getTime();
            var len = file.originalname.length;
            var dot;
            for (var i = len - 1; i >= 0; i--) {
                if (file.originalname[i] === '.') {
                    dot = i;
                    break;
                }
            }
            var name = file.originalname.substr(0, dot) + '_' + date;
            var type = file.originalname.substr(dot + 1, len);
            var filename = name + '.' + type;
            cb( null, filename);
        }
    }),
    upload = multer({storage: storage});
    
module.exports = upload;
