const projectCrud = require('./projectCrudController');
const projectQuery = require('./projectQueryController');
const projectLifecycle = require('./projectLifecycleController');

module.exports = {
    // CRUD
    createProject: projectCrud.createProject,
    updateProject: projectCrud.updateProject,
    deleteProject: projectCrud.deleteProject,

    // Queries
    getProjects: projectQuery.getProjects,
    getProjectById: projectQuery.getProjectById,

    // Lifecycle & Workflow
    technicianRespond: projectLifecycle.technicianRespond,
    adminRespondRejection: projectLifecycle.adminRespondRejection,
    confirmByIncharge: projectLifecycle.confirmByIncharge,
    updateProgress: projectLifecycle.updateProgress,
    completeProject: projectLifecycle.completeProject,
};
