const chatService = require('../services/chatService');

exports.handleChatSimulation = async (req, res, next) => {
  try {
    const { persona, history, currentCode } = req.body;

    if (!persona) {
      return res.status(400).json({ error: "Persona inválida solicitada." });
    }

    const chatResponse = await chatService.handleChat(persona, history || [], currentCode || '');
    
    return res.status(200).json(chatResponse);
  } catch (error) {
    next(error);
  }
};
