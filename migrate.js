const { runAutoMigration } = require('./src/database/migrate');

runAutoMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Falha na migration manual:', err);
    process.exit(1);
  });
