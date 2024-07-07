const { addReview } = require('../Controllers/Review.Controllers');
const { authentication } = require('../Middleware/auth.Middleware');
const router = require('express').Router();


router.post('/addreview/:id', authentication, addReview);

module.exports = router;