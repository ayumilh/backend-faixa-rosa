const express = require('express');
const router = express.Router();
const { 
    listUsers, 
    getUserById, 
    updateUserStatus, 
    deleteUser 
} = require('../../controllers/admin/adminUserController'); 

// Listar todos os usuários
router.get('/users', listUsers);

// Obter detalhes de um usuário específico
router.get('/users/:id/', getUserById);

// Atualizar status de um usuário (Ativar/Suspender)
router.patch('/users/:id/status', updateUserStatus);

// Deletar usuário e dados vinculados
router.delete('/users/:id/delete', deleteUser);

module.exports = router;
