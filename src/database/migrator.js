const fs = require('fs');
const path = require('path');
const db = require('../config/database');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureMigrationTable(client) {
  const sql = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await client.query(sql);
}

async function getAppliedVersions(client) {
  const result = await client.query('SELECT version FROM schema_migrations ORDER BY version ASC;');
  return new Set(result.rows.map((row) => row.version));
}

async function runPendingMigrations() {
  const client = await db.pool.connect();

  try {
    await ensureMigrationTable(client);
    const appliedVersions = await getAppliedVersions(client);

    if (!fs.existsSync(MIGRATIONS_DIR)) {
      console.warn('⚠️ [Migrator] Diretório de migrations não encontrado.');
      return;
    }

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    let appliedCount = 0;

    for (const file of files) {
      const match = file.match(/^(\d+)_(.+)\.sql$/);
      if (!match) {
        console.warn(`⚠️ [Migrator] Arquivo ignorado (formato inválido, use NNNNN_nome.sql): ${file}`);
        continue;
      }

      const version = parseInt(match[1], 10);
      const name = match[2];

      if (appliedVersions.has(version)) {
        continue;
      }

      console.log(`🚀 [Migrator] Aplicando migration: ${file}...`);
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version, name) VALUES ($1, $2);', [version, name]);
        await client.query('COMMIT');
        console.log(`✅ [Migrator] Migration ${file} aplicada com sucesso!`);
        appliedCount += 1;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ [Migrator Error] Falha ao aplicar migration ${file}:`, err.message);
        throw err;
      }
    }

    if (appliedCount === 0) {
      console.log('✅ [Migrator] Nenhuma nova migration pendente. Banco de dados atualizado!');
    } else {
      console.log(`🎉 [Migrator] Total de ${appliedCount} migration(s) executada(s) com sucesso!`);
    }
  } finally {
    client.release();
  }
}

module.exports = {
  runPendingMigrations,
};
