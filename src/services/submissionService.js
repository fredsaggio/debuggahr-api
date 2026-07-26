const submissionRepository = require('../repositories/submissionRepository');
const geminiService = require('./geminiService');

class SubmissionService {
  async processAndSaveSubmission(data) {
    const candidateId = data.candidateId;
    if (!candidateId) {
      throw new Error('VALIDATION_ERROR: O campo candidateId é obrigatório');
    }

    const payload = data.payload || {
      candidateId,
      finalCode: data.finalCode || '',
      chatHistory: data.chatHistory || [],
      timeRemainingSec: data.timeRemainingSec || 0,
    };

    // Se o scorecard não veio pré-calculado, o backend executa a avaliação do Gemini
    let scorecard = data.scorecard;
    if (!scorecard) {
      console.log(`🤖 [Service] Iniciando avaliação técnica do Gemini no backend para o candidato ${candidateId}...`);
      scorecard = await geminiService.evaluateSubmission(payload);
    }

    const evaluatedAt = data.evaluatedAt || new Date().toISOString();

    const fullReport = {
      candidateId,
      evaluatedAt,
      scorecard,
      payload,
    };

    const record = await submissionRepository.upsert({
      candidateId,
      evaluatedAt,
      scorecard,
      fullReport,
    });

    if (scorecard.evaluationFailed) {
      console.warn('==================================================');
      console.warn(`🚨 [Service] ATENÇÃO: a avaliação do Gemini NÃO ocorreu para ${candidateId}.`);
      console.warn(`🚨 Motivo: ${scorecard.evaluationError}`);
      console.warn(`🚨 As notas abaixo são fixas do mock e NÃO representam o candidato.`);
      console.warn('==================================================');
    }

    console.log('==================================================');
    console.log(`✅ [Service] SUBMISSÃO AVALIADA E REGISTRADA NO POSTGRESQL!`);
    console.log(`👤 Candidato ID : ${candidateId}`);
    console.log(`🎯 Hard Skills   : ${scorecard.score?.hardSkills ?? 0} / 100`);
    console.log(`🤝 Soft Skills   : ${scorecard.score?.softSkills ?? 0} / 100`);
    console.log(`📄 Relatório JSON Completo:`);
    console.log(JSON.stringify(fullReport, null, 2));
    console.log('==================================================\n');

    return {
      message: 'Submissão avaliada pelo Gemini e registrada no PostgreSQL com sucesso',
      candidateId,
      record,
    };
  }

  async listAllSubmissions() {
    const submissions = await submissionRepository.findAll();
    console.log('==================================================');
    console.log(`📊 [Service] CONSULTA DE SUBMISSÕES REALIZADA`);
    console.log(`🔢 Total no PostgreSQL: ${submissions.length}`);
    console.log('==================================================\n');

    return {
      total: submissions.length,
      submissions,
    };
  }

  async getSubmissionByCandidateId(candidateId) {
    const report = await submissionRepository.findByCandidateId(candidateId);
    if (!report) {
      const error = new Error(`NOT_FOUND: Submissão do candidato ${candidateId} não encontrada`);
      error.statusCode = 404;
      throw error;
    }

    console.log('==================================================');
    console.log(`🔍 [Service] CONSULTA POR CANDIDATO: ${candidateId}`);
    console.log(JSON.stringify(report.full_report, null, 2));
    console.log('==================================================\n');

    return report.full_report;
  }
}

module.exports = new SubmissionService();
