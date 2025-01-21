require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Middlewares
app.use(helmet());
app.use(
  cors({
    origin: ["https://interface-faixa-rosa.vercel.app", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json());

//  routes
const authRoutes = require('./routes/authRoutes');


// Rotas
app.get('/', (req, res) => {
  res.send('API funcionando!');
});

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});