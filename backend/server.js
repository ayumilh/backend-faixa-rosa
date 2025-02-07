require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { authenticate } = require('./middleware/authMiddleware.js');

const app = express();

// Middlewares
app.use(helmet());
app.use(
  cors({
    origin: ["https://www.faixarosa.com", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas publicas
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const verifyToken = require('./routes/utils/utils.js');
const userRoutes = require('./routes/userRoutes.js');
const plansRoutes = require('./routes/plansRoutes.js');
const companionRoutes = require('./routes/companionRoutes.js');
// const adminRoutes = require('./routes/admin/adminRoutes.js');

app.get('/', (req, res) => {
  res.send('API funcionando!');
});
app.use('/api/', verifyToken);

// Rotas privadas
// app.use('/api/admin', authenticate, adminRoutes);
app.use('/api/users/', authenticate, userRoutes);
app.use('/api/plans', authenticate, plansRoutes);
app.use('/api/companions', authenticate, companionRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});