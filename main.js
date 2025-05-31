const upload = document.getElementById('upload');
const preview = document.getElementById('preview');
const output = document.getElementById('asciiOutput');

const chars = '@#W$9876543210?!abc;:+=-,._ '.split('').reverse();
const colorPalette = ['#6A9955', '#569CD6', '#C586C0', '#CE9178', '#DCDCAA', '#D4D4D4', '#808080'];

// Проверка поддерживаемого формата
function isUnsupportedFormat(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  return ext === 'heic' || ext === 'heif';
}

// Конвертация файла HEIC/HEIF в JPEG через canvas
function convertImageToJpeg(img, callback) {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    callback(url);
    // Очистим url позже
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }, 'image/jpeg', 1);
}

upload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();

    // Обработчик ошибки загрузки (например, при HEIC, если браузер не поддерживает)
    img.onerror = () => {
      // Если формат неподдерживаемый — пробуем конвертировать через canvas (попытка)
      if (isUnsupportedFormat(file.name)) {
        // Создаём временный объект URL из файла и загружаем его в img
        const tempUrl = URL.createObjectURL(file);
        const tempImg = new Image();

        tempImg.onload = () => {
          convertImageToJpeg(tempImg, (jpegUrl) => {
            // После конвертации загружаем JPEG в canvas для обработки
            const finalImg = new Image();
            finalImg.onload = () => {
              processImage(finalImg);
              URL.revokeObjectURL(tempUrl);
            };
            finalImg.src = jpegUrl;
          });
        };

        tempImg.onerror = () => {
          alert('Не удалось обработать изображение');
          URL.revokeObjectURL(tempUrl);
        };

        tempImg.src = tempUrl;
      } else {
        alert('Не удалось загрузить изображение.');
      }
    };

    // Если загрузка прошла успешно — обрабатываем
    img.onload = () => {
      processImage(img);
    };

    img.src = event.target.result;
  };

  reader.readAsDataURL(file);
});

// Функция обработки изображения: рисуем в preview, выводим ASCII
function processImage(img) {
  const ctx = preview.getContext('2d');
  const maxWidth = 120;
  const scale = maxWidth / img.width;
  const width = Math.floor(img.width * scale);
  const height = Math.floor(img.height * scale * 1.0); // коррекция пропорций

  preview.width = width;
  preview.height = height;
  preview.style.width = width + 'px';
  preview.style.height = height + 'px';

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height).data;

  let ascii = '';
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
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

  // Кнопка скачивания SVG
  let button = document.getElementById('downloadSvg');
  if (button) button.remove();

  const saveButton = document.createElement('button');
  saveButton.textContent = 'Скачать SVG';
  saveButton.id = 'downloadSvg';
  saveButton.style.marginTop = '10px';
  saveButton.style.padding = '6px 12px';
  saveButton.style.fontFamily = 'monospace';
  saveButton.style.background = '#0f0';
  saveButton.style.border = 'none';
  saveButton.style.color = '#000';
  saveButton.style.cursor = 'pointer';

  saveButton.addEventListener('click', () => {
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
         style="
           background: black;
           font-family: ${fontFamily};
           font-size: ${fontSize};
           line-height: ${lineHeight};
           letter-spacing: ${letterSpacing};
           color: #0f0;
           white-space: pre-wrap;
           display: block;
           width: ${width}px;
           height: ${height}px;
        ">
      ${output.innerHTML}
    </div>
  </foreignObject>
</svg>
    `;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ascii-export.svg';
    a.click();
    URL.revokeObjectURL(url);
  });

  output.after(saveButton);
}
