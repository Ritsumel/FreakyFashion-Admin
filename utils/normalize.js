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

module.exports = normalize;
