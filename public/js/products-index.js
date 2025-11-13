document.addEventListener('DOMContentLoaded', () => {
  const searchBtn = document.querySelector('.btn-search');
  const searchBar = document.getElementById('search-bar');
  const columns = document.querySelectorAll('.product-details');

  async function searchProducts() {
    const term = searchBar.value.trim();
    // clear old rows
    clearRows();

    if (!term) return;

    try {
      const res = await fetch(`/api/products/search?name=${encodeURIComponent(term)}`);
      const products = await res.json();

      if (products.length === 0) {
        columns[0].insertAdjacentHTML('beforeend', '<p>Inga produkter hittades.</p>');
        columns[1].insertAdjacentHTML('beforeend', '<p>&nbsp;</p>');
        columns[2].insertAdjacentHTML('beforeend', '<p>&nbsp;</p>');
        columns[3].insertAdjacentHTML('beforeend', '<p>&nbsp;</p>');
        return;
    }

      // Fill rows
      products.forEach(p => {
        columns[0].insertAdjacentHTML('beforeend', `<p><a href="/admin/products/${p.id}">${p.name}</a></p>`);
        columns[1].insertAdjacentHTML('beforeend', `<p>${p.sku}</p>`);
        columns[2].insertAdjacentHTML('beforeend', `<p>${p.publishDate || 'Ej publiserad'}</p>`);
        columns[3].insertAdjacentHTML('beforeend', `<p>${p.price ? p.price + ' kr' : '-'}</p>`);
      });
    } catch (err) {
      console.error(err);
      columns[0].insertAdjacentHTML('beforeend', '<p>Fel vid hämtning av produkter.</p>');
    }
  }

  function clearRows() {
    columns.forEach(col => {
      col.querySelectorAll('p').forEach(p => p.remove());
    });
  }

  searchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    searchProducts();
  });

  searchBar.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchProducts();
    }
  });
});
