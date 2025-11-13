const express = require('express');
const router = express.Router();
const db = require('../../db'); // connects to data/freakyfashion.db


// CREATE new product (multi-category support)
router.post('/products', (req, res) => {

  // --- Helper: normalize Swedish words for matching ---
  function normalize(word) {
    word = word.toLowerCase();

    // only remove "or" if word is longer than 4 characters (so "skor" stays intact)
    if (word.length > 4 && word.endsWith("or")) {
      word = word.slice(0, -2);
    }

    if (word.endsWith("ar")) word = word.slice(0, -2); // klänningar -> klänning
    if (word.endsWith("er")) word = word.slice(0, -2); // tröjer -> tröj
    if (word.endsWith("a"))  word = word.slice(0, -1); // jacka -> jack
    if (word.endsWith("an")) word = word.slice(0, -2); // jackan -> jack
    if (word.endsWith("en")) word = word.slice(0, -2); // hatten -> hatt
    if (word.endsWith("na")) word = word.slice(0, -2); // klänningarna -> klänning
    return word;
  }

  // --- Accessory synonym list (maps words to "accessoarer" category)
  const accessoryKeywords = [
    "halsduk", "mössa", "keps", "hatt", "handskar", "vantar", "klocka", 
    "klockor", "armband", "örhänge", "örhängen", "glasögon", "solglasögon", 
    "halsband", "ring", "ringar", "smycke", "smycken", "bälte", "sjal", "scarf"
  ];

  const synonyms = {
    byxor: ["jeans", "leggings", "chinos", "kostymbyxor", "mjukisbyxor"],
    tröjor: ["hoodie", "sweatshirt", "t-shirt", "topp", "linne", "blus", "skjorta"],
    skor: ["sneakers", "stövlar", "sandaler", "flip flops", "klackar", "klackskor", "pumps", "gympaskor"],
    väskor: ["handväska", "ryggsäck", "axelväska", "kuvertväska"],
  };

  const { name, description, sku, price, image_url, publishDate } = req.body;

  if (!name || !sku) {
    return res.status(400).json({ error: 'Name and SKU are required' });
  }

    // Validate SKU format (must be 3 letters + 3 digits)
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
      console.error('🔥 Product insert failed:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const productId = this.lastID;
    const text = `${name} ${description}`
      .split(/\s+/)
      .map(normalize)
      .join(' ');

    // Find matching categories automatically
    db.all(`SELECT id, name FROM categories`, [], (err, categories) => {
    if (err) return console.error('Error fetching categories:', err);

    const matches = categories.filter(cat => {
      const catName = normalize(cat.name);
      const lowerText = text.toLowerCase();

      // --- Direct name match (simple substring)
      if (lowerText.includes(catName)) return true;

      // --- Synonym-based category linking
      const relatedWords =
        synonyms[cat.name.toLowerCase()] || synonyms[normalize(cat.name)] || [];

      // For byxor, tröjor, skor → require exact word matches to avoid overmatching
      if (['byxor', 'tröjor', 'skor'].includes(catName)) {
        if (relatedWords.some(word => new RegExp(`\\b${normalize(word)}\\b`, 'i').test(lowerText))) {
          return true;
        }
      } 
      // For other categories → allow partial matches (like vinterjacka, regnjacka)
      else {
        if (relatedWords.some(word => lowerText.includes(normalize(word)))) {
          return true;
        }
      }

      // --- Accessories logic (special category)
      if (
        catName.includes('accessoar') &&
        accessoryKeywords.some(word => lowerText.includes(normalize(word)))
      ) {
        return true;
      }

      // --- Generic clothing logic (broad category “Kläder”)
      if (
        catName.includes('kläd') &&
        [
          'jacka', 'jackor', 'byxa', 'byxor', 'jeans', 
          'klänning', 'klänningar', 'tröja', 'tröjor', 
          'kjol', 'kjolar'
        ].some(word => lowerText.includes(normalize(word)))
      ) {
        return true;
      }

      return false;
    });

    // --- 5️⃣ Insert matches into link table
    if (matches.length > 0) {
      const insert = db.prepare(`
        INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)
      `);
      matches.forEach(cat => {
        insert.run([productId, cat.id], err2 => {
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

// Publish product (set publishDate to now)
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

// Toggle publish/unpublish
router.post('/products/:id/toggle-publish', (req, res) => {
  const { id } = req.params;

  // First, check current publish status
  db.get('SELECT publishDate FROM products WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!row) return res.status(404).json({ error: 'Product not found' });

    // if product is published → unpublish it
    if (row.publishDate) {
      db.run('UPDATE products SET publishDate = NULL WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true, published: false });
      });
    } else {
      // if not published → publish now
      const now = new Date().toISOString();
      db.run('UPDATE products SET publishDate = ? WHERE id = ?', [now, id], function (err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true, published: true, publishDate: now });
      });
    }
  });
});

// DELETE product
router.post('/products/:id/delete', (req, res) => {
  const { id } = req.params;

  // Remove from link table first
  db.run(`DELETE FROM product_categories WHERE product_id = ?`, [id], (err) => {
    if (err) console.error('Error cleaning up product_categories:', err);

    // Then delete the product itself
    db.run(`DELETE FROM products WHERE id = ?`, [id], function (err) {
      if (err) {
        console.error('Error deleting product:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ success: true });
    });
  });
});

// GET product by SKU (used in new-category.js)
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

// GET products by name (used for search on products-index page)
router.get('/products/search', (req, res) => {
  const name = req.query.name?.trim();
  if (!name) return res.json([]);

  const query = `
    SELECT DISTINCT p.id, p.name, p.sku, p.price, p.publishDate
    FROM products p
    LEFT JOIN product_categories pc ON p.id = pc.product_id
    LEFT JOIN categories c ON c.id = pc.category_id
    WHERE LOWER(p.name) LIKE LOWER(?) 
       OR LOWER(c.name) LIKE LOWER(?) 
    ORDER BY p.name
  `;

  db.all(query, [`%${name}%`, `%${name}%`], (err, rows) => {
    if (err) {
      console.error('Error fetching products by name or category:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const formattedRows = rows.map(product => ({
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
