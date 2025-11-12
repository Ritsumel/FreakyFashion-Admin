const express = require('express');
const router = express.Router();
const db = require('../../db'); // connects to data/freakyfashion.db


// 🆕 CREATE new product (multi-category support)
router.post('/products', (req, res) => {
  const { name, description, sku, price, image_url, publishDate } = req.body;

  if (!name || !sku) {
    return res.status(400).json({ error: 'Name and SKU are required' });
  }

    // validate SKU format (must be 3 letters + 3 digits)
    const skuPattern = /^[A-Z]{3}[0-9]{3}$/i;
        if (!skuPattern.test(sku)) {
        return res.status(400).json({
            error: 'SKU måste vara i formatet XXXYYY, där X är bokstäver och Y är siffror (t.ex. ABC123).'
        });
    }

  const slug = name.toLowerCase().replace(/\s+/g, '-');
  const normalizedSKU = sku.trim().toUpperCase(); // always uppercase

  const stmt = db.prepare(`
    INSERT INTO products (name, slug, description, sku, price, image_url, publishDate)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run([name, slug, description, normalizedSKU, price, image_url, publishDate], function (err) {
    if (err) {
      console.error('Error inserting product:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const productId = this.lastID;
    const text = `${name} ${description}`.toLowerCase();

    // Find matching categories automatically
    db.all(`SELECT id, name FROM categories`, [], (err, categories) => {
      if (err) return console.error('Error fetching categories:', err);

      const matches = categories.filter(cat => {
        const catName = cat.name.toLowerCase();
        return (
            text.includes(catName) ||
            text.includes(catName.replace(/ar$/, '')) ||
            text.includes(catName.slice(0, -1))
        );
      });

      // Insert into product_categories table
      if (matches.length > 0) {
        const insert = db.prepare(`INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)`);
        matches.forEach(cat => {
          insert.run([productId, cat.id], (err2) => {
            if (err2) console.error('Error linking product to category:', err2);
          });
        });
        insert.finalize();
      }
    });

    res.status(201).json({ id: productId });
  });

  stmt.finalize();
});

// 🟢 Publish product (set publishDate to now)
router.post('/products/:id/publish', (req, res) => {
  const { id } = req.params;
  const publishDate = new Date().toISOString();

  db.run(
    `UPDATE products SET publishDate = ? WHERE id = ?`,
    [publishDate, id],
    function (err) {
      if (err) {
        console.error('Error publishing product:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ success: true, publishDate });
    }
  );
});

// 🟢 Toggle publish/unpublish
router.post('/products/:id/toggle-publish', (req, res) => {
  const { id } = req.params;

  // First, check current publish status
  db.get('SELECT publishDate FROM products WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!row) return res.status(404).json({ error: 'Product not found' });

    // If product is published → unpublish it
    if (row.publishDate) {
      db.run('UPDATE products SET publishDate = NULL WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true, published: false });
      });
    } else {
      // If not published → publish now
      const now = new Date().toISOString();
      db.run('UPDATE products SET publishDate = ? WHERE id = ?', [now, id], function (err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true, published: true, publishDate: now });
      });
    }
  });
});

// 🗑️ DELETE product
router.post('/products/:id/delete', (req, res) => {
  const { id } = req.params;

  // 1️⃣ Remove from link table first
  db.run(`DELETE FROM product_categories WHERE product_id = ?`, [id], (err) => {
    if (err) console.error('Error cleaning up product_categories:', err);

    // 2️⃣ Then delete the product itself
    db.run(`DELETE FROM products WHERE id = ?`, [id], function (err) {
      if (err) {
        console.error('Error deleting product:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ success: true });
    });
  });
});

// 🔍 GET product by SKU (used in new-category.js)
router.get('/products', (req, res) => {
    const sku = req.query.sku;
    if (!sku) return res.json([]); // no SKU provided

    const query = `
        SELECT id, name, sku, price, image_url
        FROM products
        WHERE LOWER(sku) = LOWER(?)
    `;

    db.all(query, [sku], (err, rows) => {
        if (err) {
            console.error('Error fetching product by SKU:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.json(rows); // always returns an array (can be empty)
    });
});

// 🔍 GET products by name (used for search on products-index page)
router.get('/products/search', (req, res) => {
  const name = req.query.name?.trim();
  if (!name) return res.json([]); // return empty if no search term

  const query = `
    SELECT id, name, sku, price, publishDate
    FROM products
    WHERE LOWER(name) LIKE LOWER(?) 
    ORDER BY name
  `;

  db.all(query, [`%${name}%`], (err, rows) => {
    if (err) {
      console.error('Error fetching products by name:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Format publishDate
    const formattedRows = rows.map((product) => ({
      ...product,
      publishDate: product.publishDate
        ? new Date(product.publishDate).toLocaleString('sv-SE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }).replace(',', '')
        : null
    }));

    res.json(formattedRows);
  });
});


module.exports = router;
