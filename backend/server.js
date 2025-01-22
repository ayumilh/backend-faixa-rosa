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
const verifyToken = require('./routes/utils/utils.js');
const plansRoutes = require('./routes/plansRoutes.js');
const companionRoutes = require('./routes/companionRoutes.js');

// Rotas
app.get('/', (req, res) => {
  res.send('API funcionando!');
});

app.use('/api/auth', authRoutes);
app.use('/api/', verifyToken);
app.use('/api/plans', plansRoutes);
app.use('/api/companions', companionRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});