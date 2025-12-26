const Jimp = require('jimp-compact');
const fs = require('fs');
const path = require('path');

const TARGET_WIDTH_IPHONE = 1242;
const TARGET_HEIGHT_IPHONE = 2688;

const TARGET_WIDTH_IPAD = 2048;
const TARGET_HEIGHT_IPAD = 2732;

const screenshots = [
  { src: '1 startscherm.PNG', dest_iphone: '1_startscherm_iphone.png', dest_ipad: '1_startscherm_ipad.png' },
  { src: '2 zww.PNG', dest_iphone: '2_zww_iphone.png', dest_ipad: '2_zww_ipad.png' },
  { src: '3 donker.PNG', dest_iphone: '3_donker_iphone.png', dest_ipad: '3_donker_ipad.png' }
];

async function resizeImages() {
  for (const shot of screenshots) {
    const srcPath = path.join(__dirname, 'screenshots', shot.src);
    
    if (!fs.existsSync(srcPath)) {
        console.error(`Bestand niet gevonden: ${srcPath}`);
        continue;
    }

    try {
      const image = await Jimp.read(srcPath);
      
      // 1. iPhone Versie
      const imgIphone = image.clone();
      imgIphone.cover(TARGET_WIDTH_IPHONE, TARGET_HEIGHT_IPHONE);
      await imgIphone.writeAsync(path.join(__dirname, 'screenshots', shot.dest_iphone));
      console.log(`✅ ${shot.src} -> iPhone (${TARGET_WIDTH_IPHONE}x${TARGET_HEIGHT_IPHONE})`);

      // 2. iPad Versie
      const imgIpad = image.clone();
      imgIpad.cover(TARGET_WIDTH_IPAD, TARGET_HEIGHT_IPAD); // Of contain, als je zwarte randen wilt, maar cover is vaak mooier voor screenshots
      await imgIpad.writeAsync(path.join(__dirname, 'screenshots', shot.dest_ipad));
      console.log(`✅ ${shot.src} -> iPad (${TARGET_WIDTH_IPAD}x${TARGET_HEIGHT_IPAD})`);

    } catch (err) {
      console.error(`❌ Fout bij ${shot.src}:`, err);
    }
  }
}

resizeImages();
