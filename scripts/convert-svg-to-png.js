const { convertFile } = require('convert-svg-to-png');
const path = require('path');

(async () => {
  try {
    const inputFile = path.join(__dirname, '../src/logo.svg');
    const outputFile = path.join(__dirname, '../logo.png');
    
    await convertFile(inputFile, {
      outputFilePath: outputFile,
      width: 128,
      height: 128
    });
    
    console.log('Successfully converted SVG to PNG');
  } catch (error) {
    console.error('Error converting SVG to PNG:', error);
  }
})(); 