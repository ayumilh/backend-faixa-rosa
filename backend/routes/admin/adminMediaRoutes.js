const express = require('express');
const router = express.Router();
const { 
    approvedMedia, 
    rejectMedia,
    suspendMedia,
 } = require('../../controllers/admin/adminMediaController');


router.post('/companion/:id/media/approve', approvedMedia);

router.post('/companion/:id/media/reject', rejectMedia);

router.post('/companion/:id/media/suspend', suspendMedia);


module.exports = router;
