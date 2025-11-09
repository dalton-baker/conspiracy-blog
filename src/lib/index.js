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

export const colorArray = [
    '#00FFFF', '#FF8C00', '#ADFF2F', '#FF69B4', '#1E90FF',
    '#FFD700', '#DA70D6', '#00FA9A', '#FF4500', '#7FFFD4',
    '#FF6347', '#40E0D0', '#BA55D3', '#98FB98', '#FFB6C1',
    '#87CEFA', '#FFA500', '#00CED1', '#FF1493', '#66CDAA'
];

export function getRandomColor(number){
    return colorArray[number % colorArray.length];
}

// Simple deterministic color picker based on username hash
export function colorForUser(username) {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash);
    return getRandomColor(index);
}