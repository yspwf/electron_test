// const sharp = require('sharp');

// async function resizeImage40() {
//     try {
//         await sharp('C:/Users/Administrator/Documents/xwechat_files/wxid_hig2wvd0zva921_de4b/msg/file/2026-10/替换最新logo/logo_new.png')
//             .resize({ width: 40, height: 40 })
//             .toFile('C:/Users/Administrator/Documents/xwechat_files/wxid_hig2wvd0zva921_de4b/msg/file/2026-10/替换最新logo/logo.png');
//     } catch (error) {
//         console.log(error);
//     }
// }

// resizeImage40()


// async function resizeImage80() {
//     try {
//         await sharp('C:/Users/Administrator/Documents/xwechat_files/wxid_hig2wvd0zva921_de4b/msg/file/2026-10/替换最新logo/logo_new.png')
//             .resize({ width: 80, height: 80 })
//             .toFile('C:/Users/Administrator/Documents/xwechat_files/wxid_hig2wvd0zva921_de4b/msg/file/2026-10/替换最新logo/logo@2x.png');
//     } catch (error) {
//         console.log(error);
//     }
// }

// resizeImage80()


// async function resizeImage120() {
//     try {
//         await sharp('C:/Users/Administrator/Documents/xwechat_files/wxid_hig2wvd0zva921_de4b/msg/file/2026-10/替换最新logo/logo_new.png')
//             .resize({ width: 120, height: 120 })
//             .toFile('C:/Users/Administrator/Documents/xwechat_files/wxid_hig2wvd0zva921_de4b/msg/file/2026-10/替换最新logo/logo@3x.png');
//     } catch (error) {
//         console.log(error);
//     }
// }

// resizeImage120()


// async function resizeIco() {
//     try {
//         await sharp('C:/Users/Administrator/Documents/xwechat_files/wxid_hig2wvd0zva921_de4b/msg/file/2026-10/替换最新logo/logo_new.png')
//             .resize({ width: 256, height: 256 })
//             .toFile('C:/Users/Administrator/Documents/xwechat_files/wxid_hig2wvd0zva921_de4b/msg/file/2026-10/替换最新logo/logo_new.ico');
//     } catch (error) {
//         console.log(error);
//     }
// }

// resizeIco()


// async function resizeImage256() {
//     try {

// await sharp('C:/Users/Administrator/Documents/xwechat_files/wxid_hig2wvd0zva921_de4b/msg/file/2026-10/替换最新logo/logo_new.png')
//             .resize({ width: 256, height: 256 })
//             .toFile('C:/Users/Administrator/Documents/xwechat_files/wxid_hig2wvd0zva921_de4b/msg/file/2026-10/替换最新logo/logo-应用图标.png');
//             } catch (error) {
//         console.log(error);
//     }
// }

// resizeImage256()




// const sharp = require('sharp');
// const pngToIco = require('png-to-ico');

// async function generateIco(inputPath, outputPath) {
//   // 1. 用 sharp 生成多个尺寸的 PNG buffer
//   const sizes = [16, 32, 48, 64, 128, 256];
//   const pngBuffers = await Promise.all(
//     sizes.map(size =>
//       sharp(inputPath)
// .resize(size, size)
// .png()
// .toBuffer()
//     )
//   );

//   // 2. 用 png-to-ico 合并成 ICO
//   const icoBuffer = await pngToIco(pngBuffers);
//   require('fs').writeFileSync(outputPath, icoBuffer);
// }

// generateIco('C:/Users/Administrator/Documents/xwechat_files/wxid_hig2wvd0zva921_de4b/msg/file/2026-10/替换最新logo/logo_new.png', 'C:/Users/Administrator/Documents/xwechat_files/wxid_hig2wvd0zva921_de4b/msg/file/2026-10/替换最新logo/output.ico')


const sharp = require('sharp');
const _pngToIco = require('png-to-ico');
const pngToIco = _pngToIco.default || _pngToIco; // 关键：兼容两种导出
const fs = require('fs');

async function toIco(sourcePath, outputPath, sizes = [16, 32, 48, 64, 128, 256]) {
  const buffers = await Promise.all(
    sizes.map(size =>
      sharp(sourcePath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer()
    )
  );
  const icoBuffer = await pngToIco(buffers);
  fs.writeFileSync(outputPath, icoBuffer);
  console.log(`✓ ICO 已生成: ${outputPath}`);
}

toIco('C:/Users/Administrator/Documents/xwechat_files/wxid_hig2wvd0zva921_de4b/msg/file/2026-10/替换最新logo/logo_new.png', 'C:/Users/Administrator/Documents/xwechat_files/wxid_hig2wvd0zva921_de4b/msg/file/2026-10/替换最新logo/output.ico')