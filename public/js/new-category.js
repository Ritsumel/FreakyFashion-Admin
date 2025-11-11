const products = []; // temporary store of products for this category

const skuInput = document.getElementById('sku');
const productsTable = document.getElementById('products-table');

skuInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const sku = skuInput.value.trim();
        if (!sku) return;

        try {
            const res = await fetch(`/api/products?sku=${sku}`);
            if (res.ok) {
                const data = await res.json();
                if (data.length > 0) {
                    products.push(data[0]); // assuming single product returned
                    renderProducts();
                } else {
                    alert('Ingen produkt hittades med den SKU');
                }
            }
        } catch (err) {
            console.error(err);
        }

        skuInput.value = '';
    }
});

function renderProducts() {
    productsTable.innerHTML = products.map(p => `
        <div class="category-details">
            <h6>Namn</h6>
            <p>${p.name}</p>
            <h6>SKU</h6>
            <p>${p.sku}</p>
        </div>
    `).join('');
}

document.querySelector('.new-category-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const image_url = document.getElementById('image-url').value.trim();
    const productIds = products.map(p => p.id);

    const body = { name, image_url, productIds };

    try {
        const res = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (res.status === 201) {
            const data = await res.json(); // { id: ... }
            window.location.href = `/admin/categories/${data.id}`;
        } else {
            alert('Något gick fel vid skapandet av kategorin');
        }
    } catch (err) {
        console.error(err);
        alert('Något gick fel vid anslutning till servern');
    }
});