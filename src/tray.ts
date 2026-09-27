import path = require('path');

import { Tray, Menu, MenuItem, Notification } from 'electron';
import SimpleHeadphone from 'arctis-usb-finder/dist/interfaces/simple_headphone';
import Host from 'arctis-usb-finder/dist/utils/host';

import exportView from './headphone_view';
import debugMenu from './menu_items/debug';
import helpMenuItem from './menu_items/help';
import quitMenuItem from './menu_items/quit';
import HeadphoneManager from './headphone_manager';
import HandleThemes from './windows/handle_themes';
import iconPicker from './windows/icon_picker';

let mainTray: Tray;
let handleThemes: HandleThemes;
let lowBatteryNotified = false;
let criticalBatteryNotified = false;
const headphoneManager = new HeadphoneManager();

const LOW_BATTERY_THRESHOLD = 35;
const CRITICAL_BATTERY_THRESHOLD = 15;

const checkLowBattery = async (headphones: SimpleHeadphone[]) => {
  const lowHeadphone = headphones.find(
    (h) => h.isConnected && !h.isCharging && h.batteryPercent <= LOW_BATTERY_THRESHOLD
  );

  const criticalHeadphone = headphones.find(
    (h) => h.isConnected && !h.isCharging && h.batteryPercent <= CRITICAL_BATTERY_THRESHOLD
  );

  handleThemes.isLowBattery = Boolean(lowHeadphone);

  if (criticalHeadphone) {
    if (!criticalBatteryNotified) {
      new Notification({
        title: 'Headset battery critical',
        body: `${criticalHeadphone.modelName} is at ${criticalHeadphone.batteryPercent}% — plug it in now.`,
      }).show();
      criticalBatteryNotified = true;
    }
  } else {
    criticalBatteryNotified = false;
  }

  if (lowHeadphone) {
    if (!lowBatteryNotified) {
      new Notification({
        title: 'Headset battery low',
        body: `${lowHeadphone.modelName} is at ${lowHeadphone.batteryPercent}% — time to plug in the cable.`,
      }).show();
      lowBatteryNotified = true;
    }
  } else {
    lowBatteryNotified = false;
  }

  const isLightTheme = await handleThemes.isUsedSystemLightTheme();
  mainTray.setImage(iconPicker(isLightTheme, handleThemes.isLowBattery));
};

const buildTrayMenu = (force: boolean = false, debug: boolean = false) => {
  const headphones: SimpleHeadphone[] = headphoneManager.loadHeadphones(force);
  const menuItems = headphones.map((headphone) => exportView(mainTray, headphone));

  checkLowBattery(headphones);

  if (menuItems.length === 0) {
    menuItems.push(new MenuItem({ label: 'No headphones found', type: 'normal' }));
  }

  menuItems.push(new MenuItem({ label: '', type: 'separator' }));

  if (debug) {
    menuItems.push(debugMenu());
  }

  menuItems.push(helpMenuItem());
  menuItems.push(quitMenuItem());

  const contextMenu = Menu.buildFromTemplate(menuItems);
  mainTray.setContextMenu(contextMenu);
};

const icon = (): string => {
  const assetsDirectory = path.join(__dirname, '../assets');

  if (Host.isMac()) {
    return path.join(assetsDirectory, 'headphonesTemplate.png');
  } else {
    return path.join(assetsDirectory, 'headphonesTemplate@2x.png');
  }
};

const createTray = async () => {
  if (Host.isWin()) {
    handleThemes = new HandleThemes();
    mainTray = new Tray(iconPicker(await handleThemes.isUsedSystemLightTheme()));
    handleThemes.tray = mainTray;
  } else {
    mainTray = new Tray(icon());
  }

  const contextMenu = Menu.buildFromTemplate([
    { label: 'No Headphones USB devices plugged in', type: 'normal' },
  ]);
  mainTray.setToolTip('Arctis Headphones');
  mainTray.setContextMenu(contextMenu);

  mainTray.on('click', (event: { altKey: boolean; shiftKey: boolean }) => {
    const debug = event.altKey;
    const force = event.shiftKey;
    buildTrayMenu(force, debug);
  });

  buildTrayMenu();
};

// Refresh every five minutes
const minute = 300 * 1000;
setInterval(buildTrayMenu, minute);

// Force refresh every thirty minutes to detect any use.
const thirtyMinutes = 10 * 60 * 1000;
setInterval(() => buildTrayMenu(true), thirtyMinutes);

export default createTray;