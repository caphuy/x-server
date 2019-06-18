var Conf = require('./Core/Configs'),
    Global = require('./Core/Global.js'),
    http = require('http'),
    express = require('express'),
    bodyParser  = require('body-parser'),
    AuthController = new (Loader.Controller('User/AuthController')),
    Router = Loader.Core('Router'),
    app = express();

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'authorization');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    if ('OPTIONS' == req.method) {
        res.send(200);
    }
    else {
        next();
    }
});

/*
 * Đặt 2 dòng này lên đầu để chạy trước khi app chạy
 */
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.all('*', (req, res, next) => AuthController.verifyToken(req, res, next));

app.use('/', Router);

/*
 * Error handler
 * Code này phải được đặt dưới cùng mới chạy được
 * xem @http://expressjs.com/en/guide/error-handling.html
*/
app.use((err,req,res,next) => {
    // Just basic, should be filled out to next()
    // or respond on all possible code paths
    if(err instanceof Error){
        var message;
        switch(err.message){
            case `${Conf.ERROR_CODE.ACCESS}`:
                message = 'Access Denied.';
            break;
            case `${Conf.ERROR_CODE.UNEXPECTED}`:
                message = 'Oops...Something went wrong. Please restart the app.';
            break;
        }
        res.status(err.message).end(message);
    }
});

var server = http.createServer(app);
server.listen(Conf.PORT);
// server.listen(80);