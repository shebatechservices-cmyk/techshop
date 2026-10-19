const { createProject } = require('./crud/createProjectController');
const { updateProject } = require('./crud/updateProjectController');
const { deleteProject } = require('./crud/deleteProjectController');

module.exports = {
    createProject,
    updateProject,
    deleteProject
};
