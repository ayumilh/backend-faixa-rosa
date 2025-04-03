const express = require('express');
const {
    followCompanion,
    unfollowCompanion,
    getFollowingOfContractor
} = require('../../controllers/companion/followController.js');

const router = express.Router();

router.post('follow/', followCompanion);
router.delete('follow/delete/:id', unfollowCompanion);

router.get('follow/list', getFollowingOfContractor);


module.exports = router;
