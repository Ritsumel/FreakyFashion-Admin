function matchCategories(text, categories, normalize) {

  // --- Accessory synonym list
  const accessoryKeywords = [
    "halsduk", "mössa", "keps", "hatt", "handskar", "vantar", "klocka",
    "klockor", "armband", "örhänge", "örhängen", "glasögon", "solglasögon",
    "halsband", "ring", "ringar", "smycke", "smycken", "bälte", "sjal", "scarf"
  ];

  // IMPORTANT: These keys MUST match the normalized root of category names
  const synonymMap = {
    byx: ["jeans", "leggings", "chinos", "kostymbyxor", "mjukisbyxor"],
    tröj: ["hoodie", "sweatshirt", "t-shirt", "topp", "linne", "blus", "skjorta"],
    skor: ["sneakers", "stövlar", "sandaler", "flip flops", "klackar",
           "klackskor", "pumps", "gympaskor", "boots"],
    väsk: ["handväska", "ryggsäck", "axelväska", "kuvertväska"]
  };

  const rawText = (text || "").toLowerCase();
  const normalizedText = normalize(rawText);
  const tokens = normalizedText.split(/\s+/).filter(Boolean);

  let matched = categories.filter(cat => {
    const rawName = cat.name.toLowerCase();
    const normName = normalize(rawName);

    // 1) Direct category name match
    if (rawText.includes(rawName) || normalizedText.includes(normName)) {
      return true;
    }

    // 2) Determine baseType (roots from your normalize() output)
    let baseType = null;

    if (normName.startsWith("byx")) baseType = "byx";
    else if (normName.startsWith("tröj")) baseType = "tröj";
    else if (normName.startsWith("skor")) baseType = "skor";
    else if (normName.startsWith("väsk")) baseType = "väsk";

    // 3) Synonym matching — normalize all synonyms FIRST
    if (baseType && synonymMap[baseType]) {
      const normalizedSynonyms = synonymMap[baseType].map(w => normalize(w));

      // ALSO match compound words
      if (normalizedSynonyms.some(sw =>
          tokens.some(t => t.includes(sw))
      )) {
          return true;
      }
    }

    // 4) Accessories
    if (normName.includes("accessoar")) {
      const normalizedAcc = accessoryKeywords.map(w => normalize(w));
      if (normalizedAcc.some(a => tokens.some(t => t.includes(a)))) {
        return true;
      }
    }

    // 5) Generic “kläder”
    if (normName.includes("kläd")) {
      const clothingWords = [
        "jacka", "jackor", "byxa", "byxor", "jeans",
        "klänning", "klänningar", "tröja", "tröjor",
        "kjol", "kjolar", "hoodie", "sweatshirt",
        "t-shirt", "topp", "linne", "blus", "skjorta",
        "leggings"
      ].map(w => normalize(w));

      if (clothingWords.some(w => tokens.includes(w))) {
        return true;
      }
    }

    return false;
  });

  // ---------------------------
  // AUTO-ADD “KLÄDER” CATEGORY
  // ---------------------------

  const clothingRoots = ["tröj", "byx", "kjol", "jack", "klänning"];

  const matchedRoots = matched.map(c => normalize(c.name));

  const hasClothingCategory = matchedRoots.some(root =>
    clothingRoots.some(cr => root.startsWith(cr))
  );

  if (hasClothingCategory) {
    const clothesCategory = categories.find(c =>
      normalize(c.name).startsWith("kläd")
    );

    if (clothesCategory && !matched.includes(clothesCategory)) {
      matched.push(clothesCategory);
    }
  }

  return matched;
}

module.exports = matchCategories;
