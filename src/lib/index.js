// place files you want to import through the `$lib` alias in this folder.
export function formatDate(isoDate) {
    const [year, month, day] = isoDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

export async function convertToWebP(file, maxWidth = 1200, quality = 0.9) {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();

    const scale = Math.min(1, maxWidth / img.width);
    const width = img.width * scale;
    const height = img.height * scale;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise(resolve =>
        canvas.toBlob(resolve, 'image/webp', quality)
    );

    return new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), {
        type: 'image/webp'
    });
}