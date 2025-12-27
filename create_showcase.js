const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// App Store formaten
const IPHONE_WIDTH = 1242;
const IPHONE_HEIGHT = 2688;
const HEADER_HEIGHT = 350;

const INPUT_DIR = './screenshots';
const OUTPUT_DIR = './screenshots/showcase';

// Teksten per screenshot (op basis van bestandsnaam)
const TEXTS = {
    'hint': { title: '🧠 SMART HINTS', subtitle: 'Learn, dont cheat!' },
    'black': { title: '🌙 DARK MODE', subtitle: 'Perfect for bedtime' },
    'blue': { title: '🌊 OCEAN THEME', subtitle: 'Calm and relaxing' },
    'roze': { title: '💜 NOORTJE THEME', subtitle: 'Made with love' },
    'dark': { title: '🌑 MIDNIGHT', subtitle: 'Easy on the eyes' },
    'layout': { title: '🎮 AD-FREE', subtitle: '100% No advertisements' },
};

function getTextForFile(filename) {
    const lower = filename.toLowerCase();
    for (const key of Object.keys(TEXTS)) {
        if (lower.includes(key)) {
            return TEXTS[key];
        }
    }
    return { title: '✨ SUDOKU DREAM', subtitle: 'Unique puzzles every time' };
}

function createTextOverlay(title, subtitle) {
    return Buffer.from(`
        <svg width="${IPHONE_WIDTH}" height="${HEADER_HEIGHT}">
            <rect width="100%" height="100%" fill="#121212"/>
            <text x="50%" y="140" 
                  font-family="Arial, Helvetica, sans-serif" 
                  font-size="72" 
                  font-weight="bold"
                  fill="white" 
                  text-anchor="middle">${title}</text>
            <text x="50%" y="240" 
                  font-family="Arial, Helvetica, sans-serif" 
                  font-size="48" 
                  fill="#AAAAAA" 
                  text-anchor="middle">${subtitle}</text>
        </svg>
    `);
}

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
            const text = getTextForFile(file);
            
            // Lees originele afbeelding
            const image = sharp(inputPath);
            const metadata = await image.metadata();
            
            // Bereken schaal om te passen
            const availableHeight = IPHONE_HEIGHT - HEADER_HEIGHT - 100; // ruimte voor padding
            const scale = Math.min(
                (IPHONE_WIDTH - 100) / metadata.width,
                availableHeight / metadata.height
            );
            
            const newWidth = Math.round(metadata.width * scale);
            const newHeight = Math.round(metadata.height * scale);
            
            // Resize de screenshot
            const resizedImage = await image
                .resize(newWidth, newHeight)
                .toBuffer();
            
            // Maak tekst overlay
            const textOverlay = createTextOverlay(text.title, text.subtitle);
            
            // Combineer alles op een canvas
            const outputPath = path.join(OUTPUT_DIR, `showcase_${file.replace(/\.(jpeg|jpg)$/i, '.png')}`);
            
            await sharp({
                create: {
                    width: IPHONE_WIDTH,
                    height: IPHONE_HEIGHT,
                    channels: 4,
                    background: { r: 18, g: 18, b: 18, alpha: 1 } // #121212
                }
            })
            .composite([
                {
                    input: textOverlay,
                    top: 0,
                    left: 0
                },
                {
                    input: resizedImage,
                    top: HEADER_HEIGHT + 50,
                    left: Math.round((IPHONE_WIDTH - newWidth) / 2)
                }
            ])
            .png()
            .toFile(outputPath);
            
            console.log(`✅ Opgeslagen: ${outputPath}`);

        } catch (error) {
            console.error(`❌ Fout bij ${file}:`, error.message);
        }
    }
    
    console.log('\n🎉 Klaar! Screenshots met tekst staan in:', OUTPUT_DIR);
}

processScreenshots();
