const submissionService = require('../services/submissionService');

class SubmissionController {
  async createSubmission(req, res, next) {
    try {
      const result = await submissionService.processAndSaveSubmission(req.body);
      return res.status(201).json(result);
    } catch (error) {
      if (error.message.startsWith('VALIDATION_ERROR:')) {
        return res.status(400).json({ error: error.message.replace('VALIDATION_ERROR: ', '') });
      }
      next(error);
    }
  }

  async getAllSubmissions(req, res, next) {
    try {
      const result = await submissionService.listAllSubmissions();
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getSubmissionByCandidateId(req, res, next) {
    try {
      const { candidateId } = req.params;
      const result = await submissionService.getSubmissionByCandidateId(candidateId);
      return res.json(result);
    } catch (error) {
      if (error.statusCode === 404) {
        return res.status(404).json({ error: error.message.replace('NOT_FOUND: ', '') });
      }
      next(error);
    }
  }
}

module.exports = new SubmissionController();
