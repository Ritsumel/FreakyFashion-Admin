// --- Global reusable fetch wrapper ---
async function apiFetch(url, options = {}) {
  try {

    console.log('🧾 Fetching:', url, options); // ✅ log every request

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

// --- Global delete button handler ---
document.addEventListener('click', async (e) => {
  const deleteBtn = e.target.closest('[data-delete]');
  if (!deleteBtn) return;

  e.preventDefault();
  const url = deleteBtn.getAttribute('data-delete');
  const confirmDelete = confirm('Är du säker att du vill radera det här objektet?');
  if (!confirmDelete) return;

  try {
    await apiFetch(url, { method: 'POST' });
    // ✅ If we're on a details page, redirect to the list
    if (window.location.pathname.includes('/admin/categories/')) {
      window.location.href = '/admin/categories';
    } else {
      window.location.reload();
    }
  } catch (err) {
    console.error('Delete failed:', err);
  }
});
