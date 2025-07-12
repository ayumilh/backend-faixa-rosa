import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import cookieParser from "cookie-parser";
import { authenticate, verifyAdmin } from './middleware/authMiddleware.js';
import { receiveWebhook } from './controllers/companion/paymentCompanionController.js';

// Rotas
import authRoutes from './routes/authRoutes.js';
import top10Routes from './routes/top10Routes.js';
import consentRoutes from './routes/consentRoutes.js';
import userRoutes from './routes/userRoutes.js';
import searchRoutes from './routes/searchCompanionRoute.js';
import adminRoutes from './routes/admin/adminCompanionRoutes.js';
import adminDoc from './routes/admin/adminDocumentRoutes.js';
import adminPlanRoutes from './routes/admin/adminPlanRoutes.js';
import adminPagamentoRoutes from './routes/admin/adminPagamentoRoutes.js';
import adminStoryRoutes from './routes/admin/adminStoryRoutes.js';
import adminFeedPostRoutes from './routes/admin/adminFeedPostRoutes.js';
import adminDenunciaRoutes from './routes/admin/adminDenunciasRoutes.js';
import adminUsuarioRoutes from './routes/admin/adminUserRoutes.js';
import adminMediaRoutes from './routes/admin/adminMediaRoutes.js';
import adminContratanteRoutes from './routes/admin/adminContratanteRoute.js';
import plansRoutes from './routes/companion/plansCompanionRoutes.js';
import companionRoutes from './routes/companion/companionRoutes.js';
import paymentRoutes from './routes/companion/paymentCompanionRoutes.js';
import denunciaRoutes from './routes/denunciarRoutes.js';
import feedPostRoutes from './routes/companion/feedPostCompanionRoutes.js';
import storyRoutes from './routes/companion/storyCompanionRoutes.js';
import followRoutes from './routes/companion/followRoutes.js';
import carrouselRoutes from './routes/companion/carrouselRoutes.js';
import addPoints from './routes/companion/addPointsRoutes.js';

// Prisma (se precisar usar no Socket)
import prisma from './prisma/client.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "https://www.faixarosa.com",
  "https://faixarosa.com",
  "https://www.faixarosa.com.br",
  "https://faixarosa.com.br",
  "http://localhost:3000"
];

// ✅ Socket.IO + CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", async (socket) => {
  const userId = parseInt(socket.handshake.query.userId);

  if (!isNaN(userId)) {
    console.log(`Usuário ${userId} conectou via Socket`);

    await prisma.companion.updateMany({
      where: { userId },
      data: { lastOnline: new Date() },
    });

    socket.broadcast.emit("userStatus", { userId, status: "online" });
  }

  socket.on("disconnect", async () => {
    if (!isNaN(userId)) {
      console.log(`Usuário ${userId} desconectou via Socket`);

      await prisma.companion.updateMany({
        where: { userId },
        data: { lastOnline: new Date() },
      });

      socket.broadcast.emit("userStatus", { userId, status: "offline" });
    }
  });
});

// Middlewares
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
}));


app.use(helmet({ contentSecurityPolicy: false }));
app.use(cookieParser());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

app.options("*", (_, res) => res.sendStatus(204));



// Rotas públicas
app.get('/', (_, res) => res.send('API funcionando!'));
app.use('/api/consent', consentRoutes);
app.use('/api/companions/top10', top10Routes);

// Admin
app.use('/api/admin', authenticate, verifyAdmin,
  adminRoutes,
  adminDoc,
  adminUsuarioRoutes,
  adminPlanRoutes,
  adminDenunciaRoutes,
  adminStoryRoutes,
  adminFeedPostRoutes,
  adminPagamentoRoutes,
  adminMediaRoutes,
  adminContratanteRoutes
);

// Users
app.use('/api/users', authenticate, userRoutes);

// Companions
app.use('/api/plans', plansRoutes);
app.use('/api/companions', authenticate,
  companionRoutes,
  storyRoutes,
  feedPostRoutes,
  followRoutes,
  carrouselRoutes,
  addPoints
);

// Outros
app.use('/api/search', searchRoutes);
app.use('/api/payments', authenticate, paymentRoutes);
app.post('/webhook', receiveWebhook);
app.use('/api/denuncias', denunciaRoutes);

app.use("/api/auth", authRoutes);


// Jobs/crons
import('./job/index.js');

// Start
const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor com Socket.IO rodando na porta ${PORT}`);
});
