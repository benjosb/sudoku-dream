const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// iPad Pro 12.9" formaat
const IPAD_WIDTH = 2048;
const IPAD_HEIGHT = 2732;

const INPUT_DIR = './screenshots/showcase';
const OUTPUT_DIR = './screenshots/showcase_ipad';

async function processScreenshots() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const files = fs.readdirSync(INPUT_DIR).filter(file => 
        /\.(png|jpg|jpeg)$/i.test(file) && !file.startsWith('.')
    );

    console.log(`Gevonden: ${files.length} screenshots\n`);

    for (const file of files) {
        console.log(`Verwerken van ${file}...`);
        
        try {
            const inputPath = path.join(INPUT_DIR, file);
            
            // Lees originele afbeelding
            const image = sharp(inputPath);
            const metadata = await image.metadata();
            
            // Bereken schaal - fit binnen iPad canvas met padding
            const maxWidth = IPAD_WIDTH - 200; // 100px padding aan elke kant
            const maxHeight = IPAD_HEIGHT - 200;
            
            const scale = Math.min(
                maxWidth / metadata.width,
                maxHeight / metadata.height
            );
            
            const newWidth = Math.round(metadata.width * scale);
            const newHeight = Math.round(metadata.height * scale);
            
            // Resize de screenshot (behoud aspect ratio)
            const resizedImage = await image
                .resize(newWidth, newHeight, { fit: 'inside' })
                .toBuffer();
            
            // Maak iPad canvas met donkere achtergrond
            const outputPath = path.join(OUTPUT_DIR, file);
            
            await sharp({
                create: {
                    width: IPAD_WIDTH,
                    height: IPAD_HEIGHT,
                    channels: 4,
                    background: { r: 18, g: 18, b: 18, alpha: 1 } // #121212
                }
            })
            .composite([
                {
                    input: resizedImage,
                    top: Math.round((IPAD_HEIGHT - newHeight) / 2),
                    left: Math.round((IPAD_WIDTH - newWidth) / 2)
                }
            ])
            .png()
            .toFile(outputPath);
            
            console.log(`✅ Opgeslagen: ${outputPath} (${newWidth}x${newHeight} op ${IPAD_WIDTH}x${IPAD_HEIGHT} canvas)`);

        } catch (error) {
            console.error(`❌ Fout bij ${file}:`, error.message);
        }
    }
    
    console.log('\n🎉 Klaar! iPad screenshots staan in:', OUTPUT_DIR);
}

processScreenshots();



