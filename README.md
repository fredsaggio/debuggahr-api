# Hackaton API (Backend PostgreSQL)

API REST desenvolvida em Node.js / Express para armazenar e disponibilizar os relatórios de avaliação do Gemini AI gerados na aplicação do Hackaton.

## 🚀 Como Executar

### 1. Iniciar o banco PostgreSQL no Docker
```bash
docker compose up -d
```

### 2. Instalar dependências e iniciar o servidor
```bash
npm install
npm start
```
O servidor estará rodando na porta **3001** (`http://localhost:3001`).

---

## 📌 Endpoints da API

* `POST /api/submissions`: Registra ou atualiza o relatório do candidato no PostgreSQL.
* `GET /api/submissions`: Retorna a lista de todas as submissões registradas.
* `GET /api/submissions/:candidateId`: Retorna o relatório JSON completo de um candidato específico.
* `GET /health`: Healthcheck do servidor.
