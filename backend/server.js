require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rotas
app.get('/', (req, res) => {
  res.send('API funcionando!');
});

// Inicialização do Servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});