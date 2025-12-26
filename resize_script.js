const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

const TARGET_WIDTH = 1242;
const TARGET_HEIGHT = 2688;

const screenshots = [
  '1 startscherm.PNG',
  '2 zww.PNG',
  '3 donker.PNG'
];

async function resizeImages() {
  for (const file of screenshots) {
    const filePath = path.join(__dirname, 'screenshots', file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Bestand niet gevonden: ${file}`);
      continue;
    }

    try {
      const image = await Jimp.read(filePath);
      
      // Resize (cover zorgt dat hij niet uitrekt, maar vult)
      // Als je liever 'contain' hebt (zwarte randen), verander dan naar image.contain
      // Voor App Store is 'cover' of gewoon 'resize' vaak het mooist.
      // Omdat screenshots vaak al portrait zijn, gebruiken we resize om hem precies pas te maken.
      // Dit kan iets vervormen als de ratio heel anders is, maar voor iPhone -> iPhone is dat minimaal.
      image.resize(TARGET_WIDTH, TARGET_HEIGHT); 

      const newFileName = `UPLOAD_${file.replace('.PNG', '.jpg')}`;
      const newPath = path.join(__dirname, 'screenshots', newFileName);
      
      await image.writeAsync(newPath);
      console.log(`✅ Opgeslagen als: ${newFileName}`);
    } catch (err) {
      console.error(`❌ Fout bij ${file}:`, err);
    }
  }
}

resizeImages();
