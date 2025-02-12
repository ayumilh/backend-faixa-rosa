require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require("cors");
const { authenticate, verifyAdmin  } = require('./middleware/authMiddleware.js');

const app = express();

const allowedOrigins = ["https://www.faixarosa.com", "http://localhost:3000"];

// Middlewares

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
  })
);

app.use(
  helmet({
    contentSecurityPolicy: false,
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
const adminRoutes = require('./routes/admin/adminCompanionRoutes.js');
const adminDoc = require('./routes/admin/adminDocumentRoutes.js');


// Rotas privadas
app.use('/api/admin', authenticate, verifyAdmin, adminRoutes, adminDoc);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/companions', authenticate, companionRoutes);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});