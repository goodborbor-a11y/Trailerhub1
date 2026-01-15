import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const saveBase64 = (base64Data, targetPath) => {
    const base64Image = base64Data.split(';base64,').pop();
    fs.writeFileSync(targetPath, base64Image, { encoding: 'base64' });
    console.log(`Saved image to ${targetPath}`);
};

const postersDir = path.join(__dirname, 'src/assets/posters');
if (!fs.existsSync(postersDir)) {
    fs.mkdirSync(postersDir, { recursive: true });
}

// Data passed via separate command or arguments
const [, , filename, data] = process.argv;
saveBase64(data, path.join(postersDir, filename));
