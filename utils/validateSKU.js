function validateSKU(sku) {
  const skuPattern = /^[A-Z]{3}[0-9]{3}$/i;

  if (!skuPattern.test(sku)) {
    return {
      valid: false,
      message: 'SKU måste vara i formatet XXXYYY, där X är bokstäver och Y är siffror (t.ex. ABC123).'
    };
  }

  return { valid: true };
}

module.exports = validateSKU;
