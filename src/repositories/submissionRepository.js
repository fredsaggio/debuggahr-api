const db = require('../config/database');

class SubmissionRepository {
  async upsert(submissionData) {
    const { candidateId, evaluatedAt, scorecard, fullReport } = submissionData;

    const queryText = `
      INSERT INTO submissions (
        candidate_id, evaluated_at, score_hard, score_soft,
        clean_code_detail, communication_detail, adaptability_detail, full_report,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      ON CONFLICT (candidate_id)
      DO UPDATE SET
        evaluated_at = EXCLUDED.evaluated_at,
        score_hard = EXCLUDED.score_hard,
        score_soft = EXCLUDED.score_soft,
        clean_code_detail = EXCLUDED.clean_code_detail,
        communication_detail = EXCLUDED.communication_detail,
        adaptability_detail = EXCLUDED.adaptability_detail,
        full_report = EXCLUDED.full_report,
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      candidateId,
      evaluatedAt || new Date().toISOString(),
      scorecard.score?.hardSkills ?? 0,
      scorecard.score?.softSkills ?? 0,
      scorecard.details?.cleanCode ?? '',
      scorecard.details?.communication ?? '',
      scorecard.details?.adaptability ?? '',
      JSON.stringify(fullReport),
    ];

    const result = await db.query(queryText, values);
    return result.rows[0];
  }

  async findAll() {
    const queryText = `
      SELECT id, candidate_id, evaluated_at, score_hard, score_soft, full_report, created_at, updated_at
      FROM submissions
      ORDER BY evaluated_at DESC;
    `;
    const result = await db.query(queryText);
    return result.rows;
  }

  async findByCandidateId(candidateId) {
    const queryText = `
      SELECT id, candidate_id, full_report, evaluated_at, created_at, updated_at
      FROM submissions
      WHERE candidate_id = $1;
    `;
    const result = await db.query(queryText, [candidateId]);
    return result.rows[0] || null;
  }
}

module.exports = new SubmissionRepository();
