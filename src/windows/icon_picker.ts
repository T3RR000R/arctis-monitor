import path = require('path');

const iconPicker = (lightTheme: boolean, lowBattery: boolean = false) => {
  const assetsDirectory = path.join(__dirname, '../../assets');
  console.log('DEBUG icon path chosen:', lowBattery ? 'RED' : (lightTheme ? 'normal' : 'white')); const fs = require('fs'); console.log('DEBUG red icon exists on disk?', fs.existsSync(path.join(assetsDirectory, 'icon_red.ico')));

  if (lowBattery) {
    return path.join(assetsDirectory, 'icon_red.ico');
  }

  if (lightTheme) {
    return path.join(assetsDirectory, 'icon.ico');
  } else {
    return path.join(assetsDirectory, 'icon_white.ico');
  }
};

export default iconPicker;