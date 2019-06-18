"use strict";

var RouteController = Loader.Controller('RouteController'),
    Conf = Loader.Core('Configs'),
    NodeController = new (Loader.Controller('Node/NodeController'));

class NodeForm extends RouteController{
    add(){
        var self = this;
        var getTags = new Promise((resolve, reject) => {
            NodeController.parseAutocompleteTerm(this.req.body.tags, 'tags', function(err, resp){
                return !err ? resolve(resp) : reject(err);
            });
        });
        var prepareNode = new Promise((resolve, reject) => {
            var input = this.req.body;
            input.author = {
                id: this.req._uid,
                name: 'Tung Bui',
                username: 'greatbnt'
            }
            NodeController.prepareNode(input, (err, resp) => !err ? resolve(resp) : reject(err));
        });


        Promise.all([prepareNode, getTags]).then(values => {
            var node = values[0];
            var tags = values[1];
            if(tags.length > 0){
                node.terms = {
                    'tags': tags,
                };
            }
            this.res.json(node);
            
            // NodeController.createNode(node, function(err, resp){
            //     return !err ? res.json(resp) : res.json(err);
            // });
        }, reject => this.res.status(Conf.ERROR_CODE.GENERAL).json(reject));
        
        // this.res.json('?');
    }
    handler(){
        // data.user = req._user;
        // this.next = next;
        // this.data = data;
        // this.res = res;
        this.action();
    }
}

module.exports = NodeForm;