const express = require('express');
const router = express.Router();
const db = require('../../db');
const slugify = require('../../utils/slugify');

// CREATE category (POST /api/categories)
router.post('/categories', (req, res) => {
  let { name, image_url, productIds } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const slug = slugify(name); 

  if (!image_url || image_url.trim() === '') {
    image_url = '/images/freakyfashion-placeholder.png';
  }

  const stmt = db.prepare(`
    INSERT INTO categories (name, slug, image_url)
    VALUES (?, ?, ?)
  `);

  stmt.run([name, slug, image_url], function (err) {
    if (err) {
      console.error('Error inserting category:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const categoryId = this.lastID;

    // Assign products (many-to-many via product_categories)
    if (Array.isArray(productIds) && productIds.length > 0) {
      const insert = db.prepare(`
        INSERT OR IGNORE INTO product_categories (product_id, category_id)
        VALUES (?, ?)
      `);
      productIds.forEach(pid => insert.run([pid, categoryId]));
      insert.finalize();
    }

    res.status(201).json({ id: categoryId });
  });

  stmt.finalize();
});

// UPDATE category (POST /api/categories/:id)
router.post('/categories/:id', (req, res) => {
  const { id } = req.params;
  let { name, image_url, productIds } = req.body;
  const slug = slugify(name);


  // ensure image_url is never empty
  if (!image_url || image_url.trim() === '') {
    image_url = '/images/freakyfashion-placeholder.png';
  }

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

    // Step 1: Remove all existing links
    db.run(`DELETE FROM product_categories WHERE category_id = ?`, [id], (err) => {
      if (err) console.error(err);

      // Step 2: Add new links
      if (Array.isArray(productIds) && productIds.length > 0) {
        const insert = db.prepare(`
          INSERT OR IGNORE INTO product_categories (product_id, category_id)
          VALUES (?, ?)
        `);
        productIds.forEach(pid => {
          insert.run([pid, id]);
        });
        insert.finalize();
      }
    });

    res.status(200).json({ success: true });
  });
});

// DELETE category (POST /api/categories/:id/delete)
router.post('/categories/:id/delete', (req, res) => {
  const { id } = req.params;

  // Remove links first
  db.run(`DELETE FROM product_categories WHERE category_id = ?`, [id], (err) => {
    if (err) console.error(err);

    // Then delete category
    db.run(`DELETE FROM categories WHERE id = ?`, [id], function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ success: true });
    });
  });
});

module.exports = router;
