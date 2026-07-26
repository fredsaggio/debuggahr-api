const { GoogleGenerativeAI } = require('@google/generative-ai');
const { z } = require('zod');

const scorecardSchema = z.object({
  score: z.object({
    hardSkills: z.number().min(0).max(100),
    softSkills: z.number().min(0).max(100),
  }),
  details: z.object({
    cleanCode: z.string().min(1),
    communication: z.string().min(1),
    adaptability: z.string().min(1),
  }),
});

function formatChatHistory(payload) {
  if (!payload.chatHistory || payload.chatHistory.length === 0) {
    return 'Nenhuma mensagem registrada.';
  }

  return payload.chatHistory
    .map((message, index) => {
      return [
        `#${index + 1}`,
        `sender: ${message.sender}`,
        `timestamp: ${message.timestamp}`,
        `content: ${message.content}`,
      ].join('\n');
    })
    .join('\n\n');
}

function buildEvaluationPrompt(payload) {
  return `
Voce e um avaliador tecnico do MVP Sync&Solve. Avalie estaticamente a submissao final de um candidato em uma simulacao de hackathon.

Regras:
- Nao execute o codigo.
- Avalie o codigo final por leitura estatica: clareza, organizacao, legibilidade, manutencao, risco de bugs e se a solucao parece resolver o problema apresentado.
- Avalie o historico de chat: comunicacao com PM e Dev Junior, clareza, respeito, objetividade, colaboracao e adaptabilidade a mudancas.
- Retorne somente JSON valido, sem Markdown, sem comentarios e sem texto fora do JSON.
- Use notas numericas de 0 a 100.
- "hardSkills" deve refletir a qualidade tecnica do codigo e a plausibilidade da solucao.
- "softSkills" deve refletir comunicacao, colaboracao e adaptabilidade observadas no chat.
- As explicacoes em "details" devem ser curtas, especificas e em portugues do Brasil.

Formato obrigatorio:
{
  "score": {
    "hardSkills": 0,
    "softSkills": 0
  },
  "details": {
    "cleanCode": "texto",
    "communication": "texto",
    "adaptability": "texto"
  }
}

Dados da submissao:
candidateId: ${payload.candidateId}
timeRemainingSec: ${payload.timeRemainingSec}

Codigo final:
\`\`\`
${payload.finalCode}
\`\`\`

Historico de chat:
${formatChatHistory(payload)}
`.trim();
}

const mockScorecard = {
  score: {
    hardSkills: 85,
    softSkills: 90,
  },
  details: {
    cleanCode: 'Código bem estruturado com tratamento básico de overflow.',
    communication: 'Comunicação objetiva e clara com o time.',
    adaptability: 'Boa capacidade de adaptação aos requisitos.',
  },
};

/**
 * Scorecard de contingência quando a avaliação real não acontece.
 *
 * As notas são fixas e NÃO refletem o candidato, por isso vão marcadas: sem a
 * flag, um relatório mock chega ao recrutador indistinguível de uma avaliação
 * verdadeira. Os campos extras seguem para o full_report (JSONB).
 */
function failedEvaluation(reason) {
  return {
    ...mockScorecard,
    evaluationFailed: true,
    evaluationError: reason,
  };
}

class GeminiService {
  async evaluateSubmission(payload) {
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

    if (!apiKey) {
      console.warn('⚠️ [Gemini Service] GEMINI_API_KEY não encontrada. Utilizando resposta mock de segurança.');
      return failedEvaluation('GEMINI_API_KEY não configurada');
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });

      const promptText = buildEvaluationPrompt(payload);
      console.log(`🤖 [Gemini Service] Enviando prompt para o modelo ${modelName}...`);

      const result = await model.generateContent(promptText);
      const responseText = result.response.text();

      // Sanitizar markdown caso venha envolvido em ```json ... ```
      const cleanedJsonText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsedJson = JSON.parse(cleanedJsonText);

      const validatedScorecard = scorecardSchema.parse(parsedJson);
      console.log('✅ [Gemini Service] Avaliação da IA concluída e validada com sucesso!');

      return validatedScorecard;
    } catch (error) {
      console.error('❌ [Gemini Service Error] Falha na avaliação do Gemini:', error.message);
      console.warn('⚠️ Utilizando scorecard fallback de segurança (MARCADO COMO NÃO-AVALIADO).');
      return failedEvaluation(error.message);
    }
  }
}

module.exports = new GeminiService();
