require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require("cors");
const { authenticate } = require('./middleware/authMiddleware.js');

const app = express();

const allowedOrigins = ["https://www.faixarosa.com", "http://localhost:3000"];

// Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Desabilita o Content-Security-Policy
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.options("*", (req, res) => {
  res.sendStatus(204);
});

// Rotas publicas
const authRoutes = require('./routes/authRoutes');
app.get('/', (req, res) => {
  res.send('API funcionando!');
});

app.use('/api/user', authRoutes);

const userRoutes = require('./routes/userRoutes.js');
const plansRoutes = require('./routes/plansRoutes.js');
const companionRoutes = require('./routes/companionRoutes.js');
// const adminRoutes = require('./routes/admin/adminRoutes.js');


// Rotas privadas
// app.use('/api/admin', authenticate, adminRoutes);
app.use('/api/users/', authenticate, userRoutes);
app.use('/api/plans', authenticate, plansRoutes);
app.use('/api/companions', authenticate, companionRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});