const express = require('express');
const router = express.Router();
const { 
    approvedDocuments, 
    rejectDocument 
 } = require('../../controllers/admin/adminDocumentController');


router.patch('/acompanhante/:id/documents/approve', approvedDocuments);

router.patch('/acompanhante/:id/documents/reject', rejectDocument);


module.exports = router;
