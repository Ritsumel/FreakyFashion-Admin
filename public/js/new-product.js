document.querySelector('.new-product-form').addEventListener('submit', async (e) => {
    e.preventDefault(); // prevent default form submission

    const name = document.getElementById('name').value.trim();
    const description = document.getElementById('description').value.trim();
    const image_url = document.getElementById('image-url').value.trim();
    const priceInput = document.getElementById('price').value;
    const price = priceInput ? parseFloat(priceInput) : null;
    const sku = document.getElementById('sku').value.trim();
    const publish = document.getElementById('publish').checked;

    const body = {
        name,
        description,
        image_url,
        price,
        sku,
        publishDate: publish ? new Date().toISOString() : null
    };

    try {
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (res.status === 201) {
            const data = await res.json();
            window.location.href = `/admin/products/${data.id}`;
        } else {
            let message = 'Något gick fel vid skapandet av produkten';
            try {
                const err = await res.json();
                if (err.error) message = err.error;
            } catch (_) {}
            alert(message);
        }
    } catch (err) {
        console.error(err);
        alert('Något gick fel vid anslutning till servern');
    }
});