/*
 *@author: Huy
 */
"use strict";

var RouteController = Loader.Controller('RouteController'),
    solr = require('solr-client'),
    client = solr.createClient('127.0.0.1', '8983', 'mongo_core', '/solr');

class Search extends RouteController{

    constructor(req, res, next) {
        super(req, res, next);
    }

    handler() {
        var q = this.req.query.q;
        var page = this.req.query.page;
        var start = page * 20;
        var query = client.createQuery()
                          .q(q)
                          .dismax()
                          .qf()
                          .mm()
                          .start(start)
                          .rows(20);
        client.search(query, (err, obj) => {
            if (!err) {
                this.print(obj.response.docs);
            } else {
                this.throwError(err);
            }
        });
    }

}

module.exports = Search;
