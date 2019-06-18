/*
 *@author: Huy
 */
"use strict";

var RouteController = Loader.Controller('RouteController'),
    mongoose = require('mongoose'),
    ProjectModel = Loader.Model('ProjectModel'),
    Conf = Loader.Core('Configs'),
    Model = Loader.Model('ProjectModel');

class ProjectForm extends RouteController {

    constructor(req, res, next) {
        super(req, res, next);
        this.model = Model;
    }

    add() {
        var estimatedTime = new Date(this.req.body.estimatedTime);
        var gitProjectsLength = this.req.body.gitProjects.length;
        var teamMembersLength = this.req.body.teamMembers.length;
        var gitProjects = [];
        var teamMembers = [];
        for (var i = 0; i < gitProjectsLength; i++) {
            var _id = this.req.body.gitProjects[i]._id;
            var project = {
                _id: new mongoose.mongo.ObjectId(_id),
                name: this.req.body.gitProjects[i].name
            }
            gitProjects.push(project);
        }
        for (var j = 0; j < teamMembersLength; j++) {
            var _id = this.req.body.teamMembers[j]._id;
            var member = {
                _id: new mongoose.mongo.ObjectId(_id),
                name: this.req.body.teamMembers[j].name
            }
            teamMembers.push(member);
        }
        var newProject = {
            estimatedTime: estimatedTime,
            gitProjects: gitProjects,
            teamMembers: teamMembers,
            mainColor: this.req.body.mainColor,
            description: this.req.body.description
        };
        this.save('project', newProject, (err, data) => {
            if (!err) {
                return this.res.json(data);
            } else {
                return this.res.json(err);
            }
        });
    }

    edit() {
        var projectId = this.req.body.projectId;
        var estimatedTime = new Date(this.req.body.estimatedTime);
        var gitProjectsLength = this.req.body.gitProjects.length;
        var teamMembersLength = this.req.body.teamMembers.length;
        var gitProjects = [];
        var teamMembers = [];
        for (var i = 0; i < gitProjectsLength; i++) {
            var _id = this.req.body.gitProjects[i]._id;
            var project = {
                _id: new mongoose.mongo.ObjectId(_id),
                name: this.req.body.gitProjects[i].name
            }
            gitProjects.push(project);
        }
        for (var j = 0; j < teamMembersLength; j++) {
            var _id = this.req.body.teamMembers[j]._id;
            var member = {
                _id: new mongoose.mongo.ObjectId(_id),
                name: this.req.body.teamMembers[j].name
            }
            teamMembers.push(member);
        }
        var editProject = {
            estimatedTime: estimatedTime,
            gitProjects: gitProjects,
            teamMembers: teamMembers,
            mainColor: this.req.body.mainColor,
            description: this.req.body.description
        };
        this.update('project', {_id: projectId}, editProject, (err, data) => {
            if (!err) {
                return this.res.json(data);
            } else {
                return this.res.json(err);
            }
        });
    }

    handler() {
        this.action();
    }
}

module.exports = ProjectForm;
