const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_PROMPTS = {
  pm: `Você é um Product Manager focado em resultados, pragmático e levemente ansioso em uma equipe de pagamentos.
O candidato (com quem você está falando) é o novo TECH LEAD da equipe.
O contexto: O Tech Lead está resolvendo um ticket crítico de 'duplicidade de cobrança'.

Sua tarefa: Interromper para anunciar uma mudança de escopo (ex: "O cliente quer análise manual agora") ou cobrar prazo/impacto nos negócios.

Regras Estritas:
1. NUNCA quebre o personagem (não cite que é IA, teste ou simulação).
2. ZERO FEEDBACK: Nunca elogie ou critique o desempenho/código.
3. ANTI-COLA: Você não entende de código.
4. CONCISÃO EXTREMA: Máximo de 2 frases curtas.`,

  dev_jr: `Você é um Desenvolvedor Júnior na equipe de pagamentos. É curioso, mas tem pouca experiência e se assusta com lógicas complexas.
O candidato (com quem você está falando) é o seu novo TECH LEAD.
O contexto: O Tech Lead está codando a solução para o bug de 'duplicidade de cobrança'.

Sua tarefa: Questionar a abordagem técnica, focando na complexidade, legibilidade ou manutenção do código no futuro.

Regras Estritas:
1. NUNCA quebre o personagem (não cite que é IA, teste ou simulação).
2. ZERO FEEDBACK: Nunca elogie a paciência ou a qualidade do código.
3. ANTI-COLA: Você é o Júnior e NÃO SABE a solução.
4. CONCISÃO EXTREMA: Máximo de 2 frases curtas.`,
};

const FALLBACK_REPLY = 'Estou aguardando as atualizações.';

/**
 * Converte o histórico do chat no formato de `contents` do Gemini.
 *
 * O histórico pode começar com fala de persona — é o normal, já que o Timer
 * injeta a abertura do dev_jr antes de o candidato escrever qualquer coisa. A
 * API aceita isso desde que exista ao menos uma fala do candidato, então essas
 * aberturas são preservadas: sem elas a persona não enxerga o que ela mesma já
 * disse e acaba se repetindo.
 */
function buildContents(history = []) {
  return history
    .filter((msg) => msg.sender !== 'system')
    .map((msg) => ({
      role: msg.sender === 'candidate' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));
}

class PersonaService {
  isValidPersona(persona) {
    return Object.prototype.hasOwnProperty.call(SYSTEM_PROMPTS, persona);
  }

  async generateReply({ persona, history, currentCode }) {
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

    if (!apiKey) {
      console.warn('⚠️ [Persona Service] GEMINI_API_KEY não encontrada. Retornando fala neutra.');
      return FALLBACK_REPLY;
    }

    const contents = buildContents(history);

    // Quem abre o assunto é o Timer no frontend, com mensagens fixas. Esta rota
    // só responde ao candidato — e a API rejeita uma conversa sem nenhuma fala
    // dele, então não vale gastar a requisição.
    if (!contents.some((entry) => entry.role === 'user')) {
      console.warn('⚠️ [Persona Service] Chamada sem nenhuma fala do candidato; nada a responder.');
      return FALLBACK_REPLY;
    }

    const systemInstruction = `
${SYSTEM_PROMPTS[persona]}

[ESTADO ATUAL DO EDITOR]:
\`\`\`
${currentCode && currentCode.trim() !== '' ? currentCode : 'Nenhum código estruturado digitado ainda.'}
\`\`\`
`.trim();

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        generationConfig: {
          temperature: 0.4,
          // O Gemini 3 gasta tokens de "thinking" dentro deste mesmo orçamento
          // (~400 por chamada). Um teto baixo trunca a fala antes de ela existir:
          // com 200, a resposta saía cortada no meio. A concisão é garantida pelo
          // system prompt, não por este limite.
          maxOutputTokens: 1000,
        },
      });

      console.log(`🎭 [Persona Service] Gerando fala da persona "${persona}" com ${modelName}...`);
      const result = await model.generateContent({ contents });
      const reply = result.response.text().trim();

      return reply || FALLBACK_REPLY;
    } catch (error) {
      console.error('❌ [Persona Service Error] Falha ao chamar o Gemini:', error.message);
      return FALLBACK_REPLY;
    }
  }
}

module.exports = new PersonaService();
