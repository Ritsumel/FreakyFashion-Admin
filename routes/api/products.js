const express = require('express');
const router = express.Router();
const db = require('../../db'); // connects to data/freakyfashion.db

// 🆕 CREATE new product
router.post('/products', (req, res) => {
    const { name, description, sku, price, image_url, publishDate } = req.body;

    if (!name || !sku) {
        return res.status(400).json({ error: 'Name and SKU are required' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const stmt = db.prepare(`
        INSERT INTO products (name, slug, description, sku, price, image_url, publishDate)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([name, slug, description, sku, price, image_url, publishDate], function (err) {
        if (err) {
            console.error('Error inserting product:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        res.status(201).json({ id: this.lastID }); // return new product ID
    });

    stmt.finalize();
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

module.exports = router;
