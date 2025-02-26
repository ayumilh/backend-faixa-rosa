const express = require('express');
const router = express.Router();
const { 
    approvedDocuments, 
    rejectDocument 
 } = require('../../controllers/admin/adminDocumentController');


router.post('/acompanhante/:id/documents/approve', approvedDocuments);

router.post('/acompanhante/:id/documents/reject', rejectDocument);


module.exports = router;
