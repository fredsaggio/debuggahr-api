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
4. CONCISÃO EXTREMA: Máximo de 2 frases curtas.`
};

/**
 * Resposta usada quando não foi possível obter uma fala real da persona.
 *
 * Devolve `reply: null` de propósito: inventar aqui um texto tipo "Falha na
 * comunicação com o simulador" faz o candidato ler uma mensagem de erro técnica
 * dentro do chat, como se a persona tivesse dito aquilo. Quem sabe o nome e o
 * tom de cada contato é o frontend, então cabe a ele escolher a fala de
 * contingência — este flag é só o aviso de que precisa fazê-lo.
 */
function unavailable(persona, reason) {
  return { reply: null, persona, fallback: true, reason };
}

class ChatService {
  async handleChat(persona, history, currentCode) {
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

    if (!apiKey) {
      console.warn('⚠️ [Chat Service] GEMINI_API_KEY não encontrada.');
      return unavailable(persona, 'GEMINI_API_KEY não configurada');
    }

    try {
      const basePrompt = SYSTEM_PROMPTS[persona];
      if (!basePrompt) {
        throw new Error("Persona inválida solicitada.");
      }

      const systemInstruction = `
          ${basePrompt}
          
          [ESTADO ATUAL DO EDITOR]:
          \`\`\`
          ${currentCode && currentCode.trim() !== '' ? currentCode : "Nenhum código estruturado digitado ainda."}
          \`\`\`
      `;

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: systemInstruction 
      });

      const geminiContents = history
        .filter(msg => msg.sender !== 'system')
        .map(msg => ({
          role: msg.sender === 'candidate' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));

      // A API exige ao menos uma fala de 'user'. O Timer injeta a abertura do
      // dev_jr antes de o candidato escrever qualquer coisa, entao o historico
      // pode conter so falas de persona — e ai a requisicao seria rejeitada.
      const hasCandidateMessage = geminiContents.some(entry => entry.role === 'user');
      const contents = hasCandidateMessage
        ? geminiContents
        : [{ role: 'user', parts: [{ text: 'Olá' }] }];

      const result = await model.generateContent({
        contents,
        generationConfig: {
          temperature: 0.4,
          // O Gemini 3 gasta tokens de "thinking" dentro deste mesmo orcamento
          // (~400 por chamada). Com 65, o thinking consumia tudo e a resposta
          // saia truncada ou vazia. A concisao e garantida pelo system prompt,
          // nao por este limite.
          maxOutputTokens: 1000,
        }
      });

      const responseText = result.response.text().trim();
      if (!responseText) {
        return unavailable(persona, 'Gemini devolveu resposta vazia');
      }

      return { reply: responseText, persona };
    } catch (error) {
      console.error('❌ [Chat Service Error] Falha na simulação de chat do Gemini:', error.message);
      return unavailable(persona, error.message);
    }
  }
}

module.exports = new ChatService();
