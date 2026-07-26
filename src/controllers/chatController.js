const personaService = require('../services/personaService');

class ChatController {
  async createReply(req, res, next) {
    try {
      const { persona, history, currentCode } = req.body;

      if (!personaService.isValidPersona(persona)) {
        return res.status(400).json({ error: 'Persona inválida solicitada.' });
      }

      const reply = await personaService.generateReply({
        persona,
        history: Array.isArray(history) ? history : [],
        currentCode: currentCode || '',
      });

      return res.status(200).json({ reply, persona });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();
