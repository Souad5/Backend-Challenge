// utils/generateProductCode.js
const crypto = require("crypto");

const generateProductCode = async (name, db) => {
  const cleaned = name.toLowerCase().replace(/[^a-z]/g, "");
  if (cleaned.length < 2) throw new Error("Name too short for code");

  const subs = [];
  let start = 0;
  for (let i = 1; i < cleaned.length; i++) {
    if (cleaned.charCodeAt(i) <= cleaned.charCodeAt(i - 1)) {
      if (i - start >= 2) {
        subs.push({ sub: cleaned.slice(start, i), start, end: i - 1 });
      }
      start = i;
    }
  }
  if (cleaned.length - start >= 2) {
    subs.push({ sub: cleaned.slice(start), start, end: cleaned.length - 1 });
  }

  if (subs.length === 0) throw new Error("No increasing substring");

  const maxLen = Math.max(...subs.map(s => s.sub.length));
  const maxSubs = subs.filter(s => s.sub.length === maxLen);
  const concat = maxSubs.map(s => s.sub).join("");
  const startIdx = maxSubs[0].start;
  const endIdx = maxSubs[maxSubs.length - 1].end;

  const hash = crypto.createHash("sha256").update(name).digest("hex").slice(0, 7);
  let base = `${hash}-${startIdx}${concat}${endIdx}`;
  let code = base;
  let suffix = 1;

  while (await db.collection("products").findOne({ productCode: code })) {
    code = `${base}-${suffix++}`;
  }

  return code;
};

module.exports = { generateProductCode };