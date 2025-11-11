const express = require('express');
const router = express.Router();

// Admin auth middleware for all admin pages
router.use((req, res, next) => {
    if (!req.user?.isAdmin) return res.redirect('/');
    next();
});

router.get('/products', (req, res) => {
    res.render('admin/products-index', { baseUrl: '/admin', activePage: 'products' });
});

router.get('/categories', (req, res) => {
    res.render('admin/categories-index', { baseUrl: '/admin', activePage: 'categories' });
});

module.exports = router;