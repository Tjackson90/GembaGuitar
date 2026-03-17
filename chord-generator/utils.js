export const svgNS = "http://www.w3.org/2000/svg";

export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export function el(tag, attrs = {}) {
  const n = document.createElementNS(svgNS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
}

export function txt(str, x, y, size, fill, anchor = "start", weight = "normal") {
  const t = el("text", {
    x, y,
    fill,
    "font-size": size,
    "font-family": "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    "text-anchor": anchor,
    "font-weight": weight
  });
  t.textContent = str;
  return t;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
