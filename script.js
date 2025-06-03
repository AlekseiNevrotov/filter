    const upload = document.getElementById('upload');
    const preview = document.getElementById('preview');
    const output = document.getElementById('asciiOutput');
    const chars = '@#W$9876543210?!abc;:+=-,._ '.split('').reverse();
    // Палитра VS Code (Dark+)
    const colorPalette = [
      '#6A9955', // зелёный
      '#569CD6', // синий
      '#C586C0', // фиолетовый
      '#CE9178', // оранжевый
      '#DCDCAA', // жёлтый
      '#D4D4D4', // светлый
      '#808080'  // серый
    ];
    upload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const img = new Image();
      img.onload = () => {
        const ctx = preview.getContext('2d');
        const maxWidth = 120;
        const aspectRatioCorrection = 1; // Для консольного вида
        const scale = maxWidth / img.width;
        const width = Math.floor(img.width * scale);
        const height = Math.floor(img.height * scale * aspectRatioCorrection);
        preview.width = width;
        preview.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height).data;
        let ascii = '';
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const offset = (y * width + x) * 4;
            const r = imageData[offset];
            const g = imageData[offset + 1];
            const b = imageData[offset + 2];
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
        // Удаляем старую кнопку и прогресс-бар
        let oldWrapper = document.getElementById('downloadPngWrapper');
        if (oldWrapper) oldWrapper.remove();
        // Создаём обёртку для кнопки и прогресс-бара
        const wrapper = document.createElement('div');
        wrapper.id = 'downloadPngWrapper';
        // Создаём кнопку "Скачать PNG"
        const savePngButton = document.createElement('button');
        savePngButton.textContent = 'Скачать PNG';
        savePngButton.id = 'downloadPng';
        // Создаём прогресс-бар
        const progressBar = document.createElement('div');
        progressBar.id = 'downloadPngProgress';
        wrapper.appendChild(savePngButton);
        wrapper.appendChild(progressBar);
        output.after(wrapper);
        savePngButton.addEventListener('click', () => {
          savePngButton.classList.add('loading');
          progressBar.style.width = '0';
          progressBar.style.transition = 'none';

          // Немного задержки, чтобы прогресс-бар начал анимацию
          setTimeout(() => {
            progressBar.style.transition = 'width 2s ease';
            progressBar.style.width = '100%';
          }, 50);
          html2canvas(output, {
            backgroundColor: '#000',
            scale: 10,
            useCORS: true
          }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'ascii-art.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            progressBar.style.width = '100%';
            setTimeout(() => {
              savePngButton.classList.remove('loading');
              progressBar.style.width = '0';
            }, 500);
          });
        });
      };
      const reader = new FileReader();
      reader.onload = (event) => {
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });