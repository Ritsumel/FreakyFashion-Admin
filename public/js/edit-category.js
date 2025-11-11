const products = []; // existing products in the category (we’ll fill it later)
const skuInput = document.getElementById('sku');
const productsTable = document.querySelector('.categories-view');

// --- Handle adding product by SKU ---
skuInput?.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const sku = skuInput.value.trim();
    if (!sku) return;

    try {
      const res = await fetch(`/api/products?sku=${sku}`);
      const data = await res.json();

      if (data.length === 0) {
        alert('Ingen produkt hittades med den SKU');
        return;
      }

      const product = data[0];
      if (products.some(p => p.id === product.id)) {
        alert('Produkten finns redan i listan');
        return;
      }

      products.push(product);
      renderProducts();
      skuInput.value = '';
    } catch (err) {
      console.error(err);
      alert('Fel vid hämtning av produkt');
    }
  }
});

// --- Render product list ---
function renderProducts() {
  const nameCol = productsTable?.querySelectorAll('.category-details')[0];
  const skuCol = productsTable?.querySelectorAll('.category-details')[1];

  if (!nameCol || !skuCol) return;

  nameCol.innerHTML = `<h6>Namn</h6>${products.map(p => `<p>${p.name}</p>`).join('')}`;
  skuCol.innerHTML = `<h6>SKU</h6>${products.map(p => `<p>${p.sku}</p>`).join('')}`;
}

// --- Handle form submit ---
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('edit-category-form');
  if (!form) return; // stop if not on the edit page

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const slug = document.getElementById('slug').value.trim().toLowerCase().replace(/\s+/g, '-');
    const image_url = document.getElementById('image-url').value.trim();
    const productIds = products.map(p => p.id);
    const categoryId = window.location.pathname.split('/').pop();

    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, image_url, productIds })
      });

      if (res.ok) {
        window.location.href = `/admin/categories/${categoryId}`;
      } else {
        alert('Något gick fel vid uppdateringen');
      }
    } catch (err) {
      console.error(err);
      alert('Kunde inte ansluta till servern');
    }
  });
});
