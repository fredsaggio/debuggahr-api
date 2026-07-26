-- Migration: 00001_create_update_updated_at_trigger_function
-- Description: Cria a função global de trigger para atualizar automaticamente o campo updated_at em tabelas

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
