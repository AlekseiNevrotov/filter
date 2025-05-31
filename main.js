const upload = document.getElementById('upload');
const preview = document.getElementById('preview');
const output = document.getElementById('asciiOutput');

const chars = '@#W$9876543210?!abc;:+=-,._ '.split('').reverse();
const colorPalette = ['#6A9955', '#569CD6', '#C586C0', '#CE9178', '#DCDCAA', '#D4D4D4', '#808080'];

upload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    const ctx = preview.getContext('2d');
    const maxWidth = 120;
    const scale = maxWidth / img.width;
    const width = Math.floor(img.width * scale);
    const height = Math.floor(img.height * scale * 1.0); // aspect correction

    preview.width = width;
    preview.height = height;
    preview.style.width = width + 'px';
    preview.style.height = height + 'px';

    ctx.drawImage(img, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height).data;

    let ascii = '';
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = imageData[i], g = imageData[i+1], b = imageData[i+2];
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

    // SVG экспорт точно как output.innerHTML
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

      const htmlContent = output.innerHTML
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');

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
  };

  const reader = new FileReader();
  reader.onload = (event) => {
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});
