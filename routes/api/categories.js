const express = require('express');
const router = express.Router();
const db = require('../../db'); // already connected to freakyfashion.db

// CREATE category (POST /api/categories)
router.post('/categories', (req, res) => {
  const { name, image_url, productIds } = req.body;
  const slug = name.toLowerCase().replace(/\s+/g, '-');

  console.log('✅ POST /api/categories called');

  const stmt = db.prepare(`
    INSERT INTO categories (name, slug, image_url)
    VALUES (?, ?, ?)
  `);

  stmt.run([name, slug, image_url], function (err) {
    if (err) return res.status(500).send(err.message);

    const categoryId = this.lastID;

    // Assign products to this category if provided
    if (productIds && productIds.length > 0) {
      const placeholders = productIds.map(() => '?').join(',');
      db.run(
        `UPDATE products SET category_id = ? WHERE id IN (${placeholders})`,
        [categoryId, ...productIds],
        (err) => { if (err) console.error(err.message); }
      );
    }

    res.status(201).json({ id: categoryId });
  });

  stmt.finalize();
});

// ✅ UPDATED: Update category (POST /api/categories/:id)
router.post('/categories/:id', (req, res) => {
  const { id } = req.params;
  const { name, slug, image_url, productIds } = req.body;

  const query = `
    UPDATE categories 
    SET name = ?, slug = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `;

  db.run(query, [name, slug, image_url, id], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Optional: reassign products
    if (productIds && productIds.length > 0) {
      const placeholders = productIds.map(() => '?').join(',');
      db.run(
        `UPDATE products SET category_id = ? WHERE id IN (${placeholders})`,
        [id, ...productIds],
        (err) => { if (err) console.error(err.message); }
      );
    }

    res.status(200).json({ success: true });
  });
});

// DELETE category (POST /api/categories/:id/delete)
router.post('/categories/:id/delete', (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM categories WHERE id = ?`, [id], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }

    db.run(`UPDATE products SET category_id = NULL WHERE category_id = ?`, [id], (err) => {
      if (err) console.error(err);
    });

    // ✅ Respond with JSON always
    res.json({ success: true });
  });
});


module.exports = router;
