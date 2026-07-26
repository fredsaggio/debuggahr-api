const app = require('./src/app');
const { runAutoMigration } = require('./src/database/migrate');
require('dotenv').config();

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  await runAutoMigration();

  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` 🚀 Hackaton API (Clean Architecture)`);
    console.log(` 🌐 Servidor rodando na porta: ${PORT}`);
    console.log(` 📥 POST /api/submissions`);
    console.log(` 📤 GET  /api/submissions`);
    console.log(` 🔍 GET  /api/submissions/:candidateId`);
    console.log(` 🎭 POST /api/chat`);
    console.log(`==================================================`);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Falha ao iniciar a aplicação:', err);
  process.exit(1);
});
