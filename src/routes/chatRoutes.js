const { Router } = require('express');
const chatController = require('../controllers/chatController');

const router = Router();

router.post('/', (req, res, next) => chatController.createReply(req, res, next));

module.exports = router;
