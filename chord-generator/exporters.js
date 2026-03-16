import { downloadBlob } from "./utils.js";

export function downloadSVG(svgEl, filename = "chord-diagram.svg") {
  const clone = svgEl.cloneNode(true);
  clone.removeAttribute("style");
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const svgText = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  downloadBlob(blob, filename);
}

export async function downloadPNG(svgEl, filename = "chord-diagram.png", targetW = 900) {
  const svgText = new XMLSerializer().serializeToString(svgEl);
  const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });

  const aspect = svgEl.height.baseVal.value / svgEl.width.baseVal.value;
  const targetH = Math.round(targetW * aspect);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, targetW, targetH);

  URL.revokeObjectURL(url);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (blob) downloadBlob(blob, filename);
}
