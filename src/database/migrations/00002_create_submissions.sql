-- Migration: 00002_create_submissions
-- Description: Cria a tabela de submissões e o trigger de atualização automática para updated_at

CREATE TABLE IF NOT EXISTS submissions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    candidate_id TEXT UNIQUE NOT NULL,
    score_hard INT NOT NULL,
    score_soft INT NOT NULL,
    clean_code_detail TEXT NOT NULL,
    communication_detail TEXT NOT NULL,
    adaptability_detail TEXT NOT NULL,
    full_report JSONB NOT NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_candidate_id ON submissions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_submissions_evaluated_at ON submissions(evaluated_at DESC);

DROP TRIGGER IF EXISTS set_submissions_updated_at ON submissions;

CREATE TRIGGER set_submissions_updated_at
BEFORE UPDATE ON submissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
