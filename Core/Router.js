var router = require('express').Router(),
    Util = Loader.Core('Utils'),
    UploadController = Loader.Controller('UploadController');

router.get('/', (req, res) => res.send(`Hello, ${req._user.username}! What do you expect?`));
router.get('/get', (req, res, next) => Util.routing(req.query.id, 'GETTER', req, res, next));
router.post('/post', (req, res, next) => Util.routing(req.body.form_id, 'SETTER', req, res, next));
router.post('/upload', UploadController.any(), (req, res, next) => Util.routing(req.body.form_id, 'SETTER', req, res, next));

module.exports = router;
