const LOWER_LINES = LINES.map(function (line) { return line.toLowerCase(); });

function escapeReg(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function splitKeywords(raw) {
  return raw.split(/[\s,，、;；|/]+/).map(function (x) { return x.trim(); }).filter(function (x) { return x.length > 0; });
}

function highlight(line, kws) {
  const reg = new RegExp("(" + kws.map(escapeReg).join("|") + ")", "gi");
  let out = "";
  let last = 0;
  let m;
  while ((m = reg.exec(line)) !== null) {
    out += escapeHtml(line.slice(last, m.index)) + '<span class="hit">' + escapeHtml(m[0]) + "</span>";
    last = m.index + m[0].length;
  }
  return out + escapeHtml(line.slice(last));
}

function doSearch() {
  const key = document.getElementById("inp").value.trim();
  const res = document.getElementById("res");
  const stat = document.getElementById("stat");
  if (!key) {
    res.innerText = "请输入关键词";
    stat.innerText = "全部题库已加载，等待检索";
    return;
  }
  const kws = splitKeywords(key);
  if (kws.length === 0) {
    res.innerText = "请输入关键词";
    return;
  }
  const lowerKws = kws.map(function (k) { return k.toLowerCase(); });
  const hits = [];
  for (let i = 0; i < LINES.length; i++) {
    let ok = true;
    for (let j = 0; j < lowerKws.length; j++) {
      if (LOWER_LINES[i].indexOf(lowerKws[j]) === -1) { ok = false; break; }
    }
    if (ok) hits.push(LINES[i]);
  }
  if (hits.length === 0) {
    res.innerText = "题库中没有同时包含这些关键词的题目，换关键词试试";
    stat.innerText = "命中 0 条";
    return;
  }
  stat.innerText = "命中 " + hits.length + " 条（需同时包含：" + kws.join("、") + "）";
  res.innerHTML = hits.map(function (line) {
    return '<div class="item">' + highlight(line, kws) + "</div>";
  }).join("");
}

function doClear() {
  document.getElementById("inp").value = "";
  document.getElementById("res").innerText = "请输入关键词开始检索……";
  document.getElementById("stat").innerText = "全部题库已加载，等待检索";
}

window.doSearch = doSearch;
window.doClear = doClear;
document.getElementById("inp").addEventListener("keydown", function (e) {
  if (e.key === "Enter") doSearch();
});
document.getElementById("btnSearch").addEventListener("click", doSearch);
document.getElementById("btnClear").addEventListener("click", doClear);