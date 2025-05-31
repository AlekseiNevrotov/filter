const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const output = document.getElementById('output');
const chars = " .:-=+*#%@";
const colorPalette = ["#000", "#111", "#333", "#555", "#777", "#999", "#ccc", "#fff"];

fileInput.addEventListener('change', async function (e) {
  const file = e.target.files[0];
  if (!file) return;

  let img = new Image();
  img.crossOrigin = "anonymous";

  const url = URL.createObjectURL(file);
  img.onload = () => {
    URL.revokeObjectURL(url);
    processImage(img);
  };

  img.onerror = async () => {
    try {
      const convertedUrl = await convertToSupportedFormat(file);
      img.src = convertedUrl;
    } catch (err) {
      alert('Ошибка при конвертации изображения');
      console.error(err);
    }
  };

  img.src = url;
});

async function convertToSupportedFormat(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function () {
      const image = new Image();
      image.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);
        canvas.toBlob(function (blob) {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error("Не удалось создать Blob"));
          }
        }, "image/jpeg", 0.95); // не минимальное качество
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function processImage(originalImg) {
  const maxDisplaySize = Math.min(window.innerWidth, window.innerHeight) * 0.9;

  // Очистим EXIF ориентацию
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = originalImg.width;
  tempCanvas.height = originalImg.height;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.drawImage(originalImg, 0, 0);

  const cleanImg = new Image();
  cleanImg.onload = () => {
    const aspectRatio = cleanImg.width / cleanImg.height;
    let newWidth, newHeight;

    if (aspectRatio > 1) {
      newWidth = maxDisplaySize;
      newHeight = maxDisplaySize / aspectRatio;
    } else {
      newHeight = maxDisplaySize;
      newWidth = maxDisplaySize * aspectRatio;
    }

    preview.width = newWidth;
    preview.height = newHeight;
    preview.style.width = newWidth + 'px';
    preview.style.height = newHeight + 'px';

    const ctx = preview.getContext("2d");
    ctx.clearRect(0, 0, newWidth, newHeight);
    ctx.drawImage(cleanImg, 0, 0, newWidth, newHeight);

    const imageData = ctx.getImageData(0, 0, newWidth, newHeight).data;
    let ascii = '';
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const i = (y * newWidth + x) * 4;
        const r = imageData[i], g = imageData[i + 1], b = imageData[i + 2];
        const brightness = (r + g + b) / 3;
        const charIndex = Math.floor(brightness / 255 * (chars.length - 1));
        const colorIndex = Math.floor(brightness / 255 * (colorPalette.length - 1));
        const char = chars[charIndex];
        const color = colorPalette[colorIndex];
        ascii += `<span style="color:${color}">${char}</span>`;
      }
      ascii += '\n';
    }

    output.innerHTML = ascii;

    // Кнопка для скачивания SVG
    let existingBtn = document.getElementById('downloadSvg');
    if (existingBtn) existingBtn.remove();

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Скачать SVG';
    saveBtn.id = 'downloadSvg';
    saveBtn.style.marginTop = '10px';
    saveBtn.style.padding = '6px 12px';
    saveBtn.style.fontFamily = 'monospace';
    saveBtn.style.background = '#0f0';
    saveBtn.style.border = 'none';
    saveBtn.style.color = '#000';
    saveBtn.style.cursor = 'pointer';

    saveBtn.addEventListener('click', () => {
      const computed = getComputedStyle(output);
      const fontSize = computed.fontSize;
      const lineHeight = computed.lineHeight;
      const fontFamily = computed.fontFamily;
      const letterSpacing = computed.letterSpacing;
      const width = output.clientWidth;
      const height = output.clientHeight;

      const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml"
         style="background:black; font-family:${fontFamily}; font-size:${fontSize};
         line-height:${lineHeight}; letter-spacing:${letterSpacing};
         color:#0f0; white-space:pre-wrap;">
      ${output.innerHTML}
    </div>
  </foreignObject>
</svg>`;

      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ascii-art.svg';
      a.click();
      URL.revokeObjectURL(url);
    });

    output.after(saveBtn);
  };

  cleanImg.src = tempCanvas.toDataURL();
}
