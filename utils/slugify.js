function slugify(input) {
  return String(input)
    // normalize accents/diacritics (å/ä -> a, ö -> o, etc.)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    // remove hyphens that are inside words: e.g. "t-shirt" -> "tshirt"
    .replace(/([a-z0-9])\-+([a-z0-9])/gi, '$1$2')
    // everything non-alphanumeric becomes a hyphen (word separators)
    .replace(/[^a-z0-9]+/gi, '-')
    // collapse multiple hyphens
    .replace(/-+/g, '-')
    // trim leading/trailing hyphens
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

module.exports = slugify;