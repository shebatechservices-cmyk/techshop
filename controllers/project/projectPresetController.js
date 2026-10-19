// Facade controller for project service presets and job types (Rule 1: < 200 lines)
const servicePresetController = require('./presets/servicePresetController');
const jobTypePresetController = require('./presets/jobTypePresetController');

module.exports = {
    ...servicePresetController,
    ...jobTypePresetController,
};
