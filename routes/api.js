/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;

const mongoose = require('mongoose');

const CONNECTION_STRING = process.env.MONGO_URI; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

const projectSchema = new mongoose.Schema({
  issue_title: { type: String, required: true },
  issue_text: { type: String, required: true },
  created_by: { type: String, required: true },
  assigned_to: String,
  status_text: String,
  created_on: { type: Date, default: Date.now },
  updated_on: { type: Date, default: Date.now },
  open: { type: Boolean, default: true }
});

const Project = mongoose.model('Project', projectSchema);

module.exports = function(app) {
  app
    .route('/api/issues/:project')
    // GET REQUEST
    .get(async function(req, res) {
      const {
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
        open
      } = req.body;
      const filter = {};

      if (issue_title) filter.issue_title = issue_title;
      if (issue_text) filter.issue_text = issue_text;
      if (created_by) filter.created_by = created_by;
      if (assigned_to) filter.assigned_to = assigned_to;
      if (status_text) filter.status_text = status_text;
      if (open) filter.open = open;

      await Project.find(filter, (err, projects) => {
        if (err) throw err;
        res.send(projects);
      });
    })

    // POST REQUEST
    .post(function(req, res) {
      var project = req.params.project;
      const {
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text
      } = req.body;

      let count = 0;

      if (issue_title) count++;
      if (issue_text) count++;
      if (created_by) count++;
      if (count < 3) return res.send('must fill in all required');

      const newProject = new Project({
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text
      });

      newProject.save();

      const projectObject = {
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
        created_on: newProject.created_on,
        updated_on: newProject.updated_on,
        open: true,
        _id: newProject._id
      };

      res.json(projectObject);
    })

    // PUT REQUEST
    .put(async function(req, res) {
      var project = req.params.project;

      const {
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text
      } = req.body;

      try {
        // Learn thix hsist
        // const theProject = await Project.findByIdAndUpdate(req.body._id, { $set: {
        // issue_title: issue_title || $issue_title,
        // issue_text: issue_text || this.issue_text,
        // created_by: created_by || this.created_by,
        // assigned_to: assigned_to || this.assigned_to,
        // status_text: status_text || this.status_text,
        // updated_on: Date.now
        // }})

        const theProject = await Project.findById(req.body._id, (err, item) => {
          if (err) {
            res.send(`could not update ${req.body._id}`);
            throw err;
          }

          if (Object.values(req.body).filter(x => x !== '').length === 1)
            return res.send('no updated field sent');

          (item.issue_title = issue_title || item.issue_title),
            (item.issue_text = issue_text || item.issue_text),
            (item.created_by = created_by || item.created_by),
            (item.assigned_to = assigned_to || item.assigned_to),
            (item.status_text = status_text || item.status_text),
            (item.open = req.body.open || item.open);
          item.updated_on = Date.now();
          item.save();

          res.send('successfully updated');
        });
      } catch (error) {
        console.log('ERROR:', error.message);
        res.send(`could not update ${req.body._id}`);
      }
    })

    // DELETE REQUEST
    .delete(async function(req, res) {
      var project = req.params.project;
      const id = req.body._id;

      if (id === null || !id) return res.send('_id error');

      try {
        const myProject = await Project.findById(id);

        if (!myProject) return res.send(`no such id is found`);

        await Project.findByIdAndRemove(id);

        res.send(`deleted ${req.body._id}`);
      } catch (error) {
        res.send(`could not delete ${req.body._id}`);
      }
    });
};
