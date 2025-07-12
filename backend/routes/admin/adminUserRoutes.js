import express from 'express';
import { 
  listUsers, 
  getUserById, 
  updateUserStatus, 
  deleteCompanionData 
} from '../../controllers/admin/adminUserController.js';

const router = express.Router();

// Listar contratantes
router.get('/users', listUsers);

// Obter detalhes de um usuário específico
router.get('/users/:id/', getUserById);

// Atualizar status de um usuário (Ativar/Suspender)
router.patch('/users/:id/status', updateUserStatus);

// Deletar usuário e dados vinculados
router.delete('/users/:id/delete', deleteCompanionData);

export default router;
