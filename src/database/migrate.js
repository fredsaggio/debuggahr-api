const { runPendingMigrations } = require('./migrator');

async function runAutoMigration() {
  try {
    await runPendingMigrations();
  } catch (error) {
    console.error('⚠️ [Database Migration Warning] Erro ao aplicar migrations:', error.message);
  }
}

module.exports = {
  runAutoMigration,
};
