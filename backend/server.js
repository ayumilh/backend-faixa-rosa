require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require("cors");
const { authenticate, verifyAdmin } = require('./middleware/authMiddleware.js');

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

app.use(express.json( { limit: '100mb' } ));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

app.options("*", (req, res) => {
  res.sendStatus(204);
});

// Rotas publicas
const authRoutes = require('./routes/authRoutes');
app.get('/', (req, res) => {
  res.send('API funcionando!');
});

// USER ROUTES
const userRoutes = require('./routes/userRoutes.js');

const searchRoutes = require('./routes/searchCompanionRoute.js');

app.use('/api/user', authRoutes);


// ADMIN ROUTES
const adminRoutes = require('./routes/admin/adminCompanionRoutes.js');
const adminDoc = require('./routes/admin/adminDocumentRoutes.js');
const adminPlanRoutes = require('./routes/admin/adminPlanRoutes.js');
const adminPagamentoRoutes = require('./routes/admin/adminPagamentoRoutes');
const adminStoryRoutes = require('./routes/admin/adminStoryRoutes');
const adminFeedPostRoutes = require('./routes/admin/adminFeedPostRoutes');
const adminDenunciaRoutes = require('./routes/admin/adminDenunciasRoutes');
const adminUsuarioRoutes = require('./routes/admin/adminUserRoutes');
const { receiveWebhook } = require('./controllers/companion/paymentCompanionController.js');
const adminMediaRoutes = require('./routes/admin/adminMediaRoutes.js');



// ACOMPANHANTES ROUTES
const plansRoutes = require('./routes/companion/plansCompanionRoutes.js');
const companionRoutes = require('./routes/companion/companionRoutes.js');
const paymentRoutes = require('./routes/companion/paymentCompanionRoutes.js');
const denunciaRoutes = require('./routes/denunciarRoutes.js');
const feedPostRoutes = require('./routes/companion/feedPostCompanionRoutes.js');
const storyRoutes = require('./routes/companion/storyCompanionRoutes.js');
const followRoutes = require('./routes/companion/followRoutes.js');
const carrouselRoutes = require('./routes/companion/carrouselRoutes.js');


// Rotas privadas
app.use('/api/admin', authenticate, verifyAdmin,
  adminRoutes,
  adminDoc,
  adminUsuarioRoutes,
  adminPlanRoutes,
  adminDenunciaRoutes,
  adminStoryRoutes,
  adminFeedPostRoutes,
  adminPagamentoRoutes,
  adminMediaRoutes
);

app.use('/api/users', authenticate, 
  userRoutes
);

app.use('/api/plans', plansRoutes);

app.use('/api/companions', authenticate, 
  companionRoutes,
  storyRoutes,
  feedPostRoutes,
  followRoutes,
  carrouselRoutes
);

app.use('/api/search', searchRoutes);

app.use('/api/payments', authenticate, paymentRoutes);
app.post('/webhook', receiveWebhook);

app.post('/api/denuncias', authenticate, denunciaRoutes);

// ⏰ Inicia os crons agendados 
require('./job/index.js');

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
