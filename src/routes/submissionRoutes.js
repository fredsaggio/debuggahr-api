const { Router } = require('express');
const submissionController = require('../controllers/submissionController');

const router = Router();

router.post('/', (req, res, next) => submissionController.createSubmission(req, res, next));
router.get('/', (req, res, next) => submissionController.getAllSubmissions(req, res, next));
router.get('/:candidateId', (req, res, next) => submissionController.getSubmissionByCandidateId(req, res, next));

module.exports = router;
