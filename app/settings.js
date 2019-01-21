import { me } from "appbit";
import fs from "fs";
const SETTINGS_TYPE = "cbor";
const SETTINGS_FILE = "settings.cbor";

function loadSettings() {
  try {
    return fs.readFileSync(SETTINGS_FILE, SETTINGS_TYPE);
  } catch (ex) {
    // Defaults
    return {
      randomMode: "true",
      frontSpriteFileName: "",
      backSpriteFileName: "",
      shinyFrontSpriteFileName: "",
      shinyBackSpriteFileName: "",
      stepGoalMet: "false",
      lastRandomHour: -1,
      temperature: 100
    }
  }
};

var settings = loadSettings();
console.log("Settings loaded: " + JSON.stringify(settings));

function saveSettings() {
  fs.writeFileSync(SETTINGS_FILE, settings, SETTINGS_TYPE);
  console.log("Settings saved.");
};

// Register for the unload event
me.onunload = saveSettings;

export default settings;