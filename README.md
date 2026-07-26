# Hackaton API 🚀

Backend independente desenvolvido em **Node.js, Express e PostgreSQL** para armazenamento, avaliação via **Gemini AI** e consulta de relatórios técnicos de candidatos em simulações de hackathon.

---

## 🛠️ Tecnologias Utilizadas

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Banco de Dados:** PostgreSQL 16 (via Docker)
- **IA Integration:** Google Generative AI (`@google/generative-ai` - Gemini 3.6 Flash)
- **Validação de Schema:** Zod
- **Arquitetura:** Clean Architecture / Layered Architecture (Routes, Controllers, Services, Repositories)
- **Migrations:** Motor de migrations versionadas nativo com suporte a Triggers PL/pgSQL

---

## 📐 Arquitetura do Projeto

```text
src/
├── config/
│   └── database.js          # Pool de conexões PostgreSQL (pg)
├── database/
│   ├── migrations/          # Migrations versionadas .sql
│   │   ├── 00001_create_update_updated_at_trigger_function.sql
│   │   └── 00002_create_submissions.sql
│   ├── migrate.js           # Executor de migrations
│   └── migrator.js          # Motor de controle da tabela schema_migrations
├── repositories/
│   └── submissionRepository.js # Camada de acesso ao banco (SQL)
├── services/
│   ├── geminiService.js     # Avaliação estática de código e soft skills via Gemini AI
│   └── submissionService.js # Regras de negócio e orquestração
├── controllers/
│   └── submissionController.js # Handlers HTTP (Express)
├── routes/
│   └── submissionRoutes.js  # Rotas REST (/api/submissions)
├── middlewares/
│   ├── requestLogger.js     # Logger visual de requisições no terminal
│   └── errorHandler.js      # Tratamento global de exceções
└── app.js                   # Setup das instâncias Express
```

---

## 🚀 Como Executar o Projetos

### 1. Clonar o Repositório e Instalar Dependências

```bash
git clone <URL_DO_SEU_REPOSISORIO>
cd hackaton-api
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie o arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

Conteúdo do `.env`:
```env
PORT=3001
DATABASE_URL=postgres://postgres:postgrespassword@localhost:5433/hackaton_db
GEMINI_API_KEY=sua_chave_gemini_aqui
GEMINI_MODEL=gemini-3.6-flash
```

### 3. Iniciar o Banco de Dados PostgreSQL (Docker)

```bash
docker compose up -d
```

### 4. Executar a Aplicação (Com Auto-Migration)

```bash
npm run dev
```

> **Nota:** Ao iniciar a aplicação, o motor de migrations checará o banco de dados e aplicará todas as migrations pendentes automaticamente.

---

## 📡 Endpoints da API

### 1. Health Check
`GET /health`
```json
{
  "status": "ok",
  "service": "hackaton-api"
}
```

### 2. Avaliar e Registrar Submissão (IA + Postgres)
`POST /api/submissions`

**Payload:**
```json
{
  "candidateId": "cand_joao",
  "finalCode": "void processPayment(double amount, double* accountBalance) { ... }",
  "chatHistory": [
    { "sender": "candidate", "content": "Corrigido o ponteiro de memória", "timestamp": "14:30" }
  ],
  "timeRemainingSec": 1200
}
```

### 3. Listar Todas as Submissões (Recrutador)
`GET /api/submissions`

### 4. Consultar Relatório por ID do Candidato
`GET /api/submissions/:candidateId`

---

## 🛡️ Licença

Este projeto faz parte do MVP desenvolvido para o Hackathon.
