// --- Global reusable fetch wrapper ---
async function apiFetch(url, options = {}) {
  try {
    console.log('🧾 Fetching:', url, options); // log every request

    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });

    if (!res.ok) {
      console.error(`API error ${res.status}: ${res.statusText}`);
      throw new Error(`API request failed`);
    }

    // Handle JSON or empty response
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } catch (err) {
    console.error(err);
    alert('Ett fel uppstod vid anslutning till servern.');
    throw err;
  }
}

// --- Global delete + publish handler ---
document.addEventListener('click', async (e) => {
  const deleteBtn = e.target.closest('[data-delete]');
  const publishBtn = e.target.closest('[data-publish]');

  // Handle DELETE
  if (deleteBtn) {
    e.preventDefault();
    const url = deleteBtn.getAttribute('data-delete');
    const confirmDelete = confirm('Är du säker att du vill radera?');
    if (!confirmDelete) return;

    try {
      await apiFetch(url, { method: 'POST' });

      // Redirect based on where we are
      if (window.location.pathname.includes('/admin/products/')) {
        window.location.href = '/admin/products';
      } else if (window.location.pathname.includes('/admin/categories/')) {
        window.location.href = '/admin/categories';
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }

  // Handle PUBLISH / UNPUBLISH toggle
  if (publishBtn) {
    e.preventDefault();
    const url = publishBtn.getAttribute('data-publish');

    // Decide message based on button text
    const isPublishing = publishBtn.textContent.trim().toLowerCase().includes('publisera');
    const confirmMsg = isPublishing
      ? 'Är du säker på att du vill publisera denna produkt?'
      : 'Är du säker på att du vill avpublisera denna produkt?';

    const confirmAction = confirm(confirmMsg);
    if (!confirmAction) return;

    try {
      await apiFetch(url, { method: 'POST' });
      window.location.reload(); // refresh to show new state
    } catch (err) {
      console.error('Publish toggle failed:', err);
      alert('Ett fel uppstod vid ändring av publiceringsstatus.');
    }
  }
});

// --- Category search filter ---
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-bar');
  if (!searchInput) return; // stop if not on categories page

  const nameCells = Array.from(document.querySelectorAll('.category-details:first-child p'));

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const allColumns = document.querySelectorAll('.category-details');
    const columnCount = allColumns.length;

    nameCells.forEach((nameCell, index) => {
      const categoryName = nameCell.textContent.toLowerCase();
      const isVisible = categoryName.includes(query);

      for (let i = 0; i < columnCount; i++) {
        const cell = allColumns[i].querySelectorAll('p')[index];
        if (!cell) continue;
        cell.style.display = isVisible ? '' : 'none';
      }
    });
  });
});
