const express = require('express');
const router = express.Router();
const db = require('../db');

// --- Admin auth middleware ---
router.use((req, res, next) => {
  req.user = { isAdmin: true };
  next();
});

// --- Categories ---

// Categories list
router.get('/categories', (req, res) => {
  const query = `
    SELECT 
      c.id, 
      c.name, 
      c.slug, 
      c.image_url,
      (SELECT COUNT(*) FROM products WHERE category_id = c.id) AS productCount
    FROM categories c
    ORDER BY c.name
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Database error");
    }

    res.render('admin/categories/categories-index', {
      baseUrl: '/admin',
      activePage: 'categories',
      categories: rows
    });
  });
});

// ✅ New category page (must come BEFORE /:id)
router.get('/categories/new', (req, res) => {
  res.render('admin/categories/new-category', { baseUrl: '/admin', activePage: 'categories' });
});

// Category details page
router.get('/categories/:id', (req, res) => {
  const categoryId = req.params.id;

  const queryCategory = `SELECT * FROM categories WHERE id = ?`;
  const queryProducts = `SELECT id, name, sku FROM products WHERE category_id = ?`;

  db.get(queryCategory, [categoryId], (err, categoryRow) => {
    if (err) return res.status(500).send('Database error');
    if (!categoryRow) return res.status(404).send('Category not found');

    db.all(queryProducts, [categoryId], (err, productsRows) => {
      if (err) return res.status(500).send('Database error');

      res.render('admin/categories/category-details', {
        baseUrl: '/admin',
        activePage: 'categories',
        category: {
          ...categoryRow,
          products: productsRows
        }
      });
    });
  });
});

// Edit category page
router.get('/categories/:id/edit', (req, res) => {
  const categoryId = req.params.id;
  const queryCategory = `SELECT * FROM categories WHERE id = ?`;
  const queryProducts = `SELECT id, name, sku FROM products WHERE category_id = ?`;

  db.get(queryCategory, [categoryId], (err, categoryRow) => {
    if (err) return res.status(500).send('Database error');
    if (!categoryRow) return res.status(404).send('Category not found');

    db.all(queryProducts, [categoryId], (err, productsRows) => {
      if (err) return res.status(500).send('Database error');

      res.render('admin/categories/edit-category', {
        baseUrl: '/admin',
        activePage: 'categories',
        category: {
          ...categoryRow,
          products: productsRows
        }
      });
    });
  });
});


// --- Products ---

// Products list
router.get('/products', (req, res) => {
  res.render('admin/products/products-index', { baseUrl: '/admin', activePage: 'products' });
});

// New product page
router.get('/products/new', (req, res) => {
  res.render('admin/products/new-product', { baseUrl: '/admin', activePage: 'products' });
});

// Product details
router.get('/products/:id', (req, res) => {
  const productId = req.params.id;

  db.get('SELECT * FROM products WHERE id = ?', [productId], (err, product) => {
    if (err) return res.status(500).send('Database error');
    if (!product) return res.status(404).send('Product not found');

    res.render('admin/products/product-details', {
      baseUrl: '/admin',
      activePage: 'products',
      product
    });
  });
});

// Edit product
router.get('/products/:id/edit', (req, res) => {
  const productId = req.params.id;

  const product = {
    id: productId,
    name: 'Svart T-Shirt',
    description: 'Lorem ipsum ...',
    price: 199,
    sku: 'SVA123',
    image_url: '/images/svart-tshirt.png',
    publishDate: null,
    slug: 'svart-tshirt'
  };

  res.render('admin/products/edit-product', { 
    baseUrl: '/admin', 
    activePage: 'products', 
    product 
  });
});

module.exports = router;
