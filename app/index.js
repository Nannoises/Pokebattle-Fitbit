import clock from "clock";
import document from "document";
import { preferences } from "user-settings";
import * as util from "../common/utils";
import { inbox } from "file-transfer";
import fs from "fs";
import { me } from "appbit";
import * as messaging from "messaging";
import { goals } from "user-activity";
import { today } from "user-activity";
import * as battery from "./battery.js";
import settings from "./settings.js";
import * as weather from "./weather.js";
import * as customText from "./customText.js";

// Constant elements
const myLabel = document.getElementById("myLabel");
const root = document.getElementById('root');
const screenHeight = root.height;
const screenWidth = root.width;
const frontSpriteElement = document.getElementById("frontSprite");
const backSpriteElement = document.getElementById("backSprite");
const allyNameElement = document.getElementById("allyName");
const enemyNameElement = document.getElementById("enemyName");


//BEGIN Clock
// Update the clock every minute
// Update the <text> element every tick with the current time
clock.granularity = "minutes";
clock.ontick = (evt) => {
  let today = evt.date;
  let hours = today.getHours();
  if (preferences.clockDisplay === "12h") {
    // 12h format
    hours = hours % 12 || 12;
  }   
  hours = util.zeroPad(hours); 
  var hoursTensDigit = Math.floor(hours / 10);
  var hoursOnesDigit = hours - (10 * hoursTensDigit);
  var firstDigitElement = document.getElementById('timeDigit0');
  firstDigitElement.image = `font/${hoursTensDigit}.png`;
  var secondDigitElement = document.getElementById('timeDigit1');
  secondDigitElement.image = `font/${hoursOnesDigit}.png`;
  
  let mins = util.zeroPad(today.getMinutes());
  var minutesTensDigit = Math.floor(mins / 10);
  var minutesOnesDigit = mins - (minutesTensDigit * 10);
  var thirdDigitElement = document.getElementById('timeDigit2');
  thirdDigitElement.image = `font/${minutesTensDigit}.png`;
  var fourthDigitElement = document.getElementById('timeDigit3');
  fourthDigitElement.image = `font/${minutesOnesDigit}.png`;

  battery.checkBatteryLevel();
  checkStepGoal();

  //Each hour not yet checked.
  if(settings.lastRandomHour < getEpochHour(today)){
    if(settings.randomMode == "true"){
      requestNewRandomPokemon();
    }
    else{
      settings.lastRandomHour = getEpochHour(today);      
    }
    weather.fetchWeather();
    customText.setDate(today);
  }
};

function getEpochHour(date){
  return Math.floor(date.getTime() / 1000 / 60 / 60);
};

//END Clock

//BEGIN StepGoal

function checkStepGoal(){
  if(settings.stepGoalMet == "false" && isStepGoalMet()){
    if(settings.randomMode == "true"){
      requestShinySprites(); 
    }
    else{
      setFrontSprite(settings.shinyFrontSpriteFileName);
      setBackSprite(settings.shinyBackSpriteFileName);
    }
    settings.stepGoalMet = "true";
  }
  else if(settings.stepGoalMet == "true" && !isStepGoalMet()){
    if(settings.randomMode != "true"){
      setFrontSprite(settings.frontSpriteFileName);
      setBackSprite(settings.backSpriteFileName);
    }
    settings.stepGoalMet = "false";
  }
  var percentComplete = Math.round(100 * today.adjusted.steps / goals.steps);
  if(percentComplete > 100)
    percentComplete = 100;
  customText.setAllyLevel(percentComplete);
};

function isStepGoalMet(){
  //console.log('Local steps: ' + today.local.steps);
  //console.log('Goal steps: ' + goals.steps);
  return today.adjusted.steps > goals.steps;
};

//END StepGoal

//BEGIN Messaging
// Listen for the onmessage event
messaging.peerSocket.onmessage = evt => {
  console.log("Recieved message: " + JSON.stringify(evt));
  switch(evt.data.key){
    case "randomMode":
      settings.randomMode = evt.data.newValue;
      if(evt.data.newValue == "true"){
        requestNewRandomPokemon();
      }
      break;
    case "allyName":
      settings.allyName = evt.data.newValue;
      settings.randomAllyNameHour = settings.lastRandomHour;
      customText.setAllyName(settings.allyName);
      break;
    case "enemyName":
      settings.enemyName = evt.data.newValue;
      settings.randomEnemyNameHour = settings.lastRandomHour;
      customText.setEnemyName(settings.enemyName);
      break;
    case "weather":
      weather.processWeatherData(evt.data);
      break;
    case "weatherApiKey":
      settings.weatherApiKey = evt.data.newValue;
      break;
  }
};

function requestShinySprites(){
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    console.log("Requesting shiny sprites.");
    messaging.peerSocket.send({ 
      command: "getShinySprites",
      allyNumber: settings.backSpriteFileName.match(/[\d]+/)[0],
      enemyNumber: settings.frontSpriteFileName.match(/[\d]+/)[0]
    });
  }  
};

function requestNewRandomPokemon(){
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    console.log("Requesting new random pokemon");
    messaging.peerSocket.send({ 
      command: "newRandomPokemon",
      stepGoalMet: isStepGoalMet()
    });
    settings.lastRandomHour = getEpochHour(new Date()); //TODO set after new pokemon are retrieved?
    console.log("Set lastRandomHour to " + settings.lastRandomHour);
  }
};

function setCompanionSettings(){
  var data = {
    command: "updateSettings",
    settings: settings
  };
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send(data);
  }
};

//Connection to phone is ready. Can perform init operations that require communication.
messaging.peerSocket.onopen = () => {
  console.log("Messaging connection ready");
  setCompanionSettings();
  if(settings.randomMode == "true" && settings.frontSpriteFileName === ""){
    requestNewRandomPokemon();
  }
  //weather.fetchWeather(); Shouldn't need to fetch on init.
}
//END Messaging

//BEGIN Sprite retrieval and display
function getImages() {
  var fileName; 
  while (fileName = inbox.nextFile()) {
    console.log('/private/data/' + fileName + ' is now available');
    if(fileName.indexOf("front") > -1){
      if(settings.frontSpriteFileName != fileName){
        deleteFile(settings.frontSpriteFileName);
        settings.frontSpriteFileName = fileName;
      }
      if(!isStepGoalMet())
        setFrontSprite(fileName);
    }
    else if(fileName.indexOf("back") > -1){
      if(settings.backSpriteFileName != fileName){
        deleteFile(settings.backSpriteFileName);
        settings.backSpriteFileName = fileName;
      }     
      if(!isStepGoalMet())
        setBackSprite(fileName);
    }
    else if(fileName.indexOf("shinyFront") > -1){
      if(settings.shinyFrontSpriteFileName != fileName){
        deleteFile(settings.shinyFrontSpriteFileName);
        settings.shinyFrontSpriteFileName = fileName;
      }
      if(isStepGoalMet())
        setFrontSprite(fileName);
    }
    else if(fileName.indexOf("shinyBack") > -1){
      if(settings.shinyBackSpriteFileName != fileName){
        deleteFile(settings.shinyBackSpriteFileName);
        settings.shinyBackSpriteFileName = fileName;
      }
      if(isStepGoalMet())
        setBackSprite(fileName);
    }
    else{
      console.log("Unexpected file " + fileName + " recieved.");
    }
  }
};

function getImageDimensions(fileName){
  var metadata = new Uint32Array(2);
  var fp = fs.openSync("/private/data/" + fileName, "r");
  fs.readSync(fp, metadata, 0, 8, 24);
  fs.closeSync(fp);
  return metadata;
}

function swapSprites(currentSpriteFileName, newSpriteFileName){
  if(currentSpriteFileName && currentSpriteFileName != "" && currentSpriteFileName != newSpriteFileName){
    deleteFile(currentSpriteFileName);
  }
  currentSpriteFileName = newSpriteFileName;
};

function setBackSprite(fileName) {
  if(!fileName || fileExists(fileName) === false){
    return;
  }
  var isCustomFile = fileName.indexOf('Custom') > -1;
  console.log("screen height: " + screenHeight);
  var [width, height] = getImageDimensions(fileName);    
  var scaledWidth = 2 * width;
  var scaledHeight = 2 * height;
  
  if(isCustomFile){
    const heightScale = 1.5;
    const widthScale = 2.5;
    if(scaledWidth > screenWidth / widthScale){
      scaledHeight = scaledHeight * ((screenWidth / widthScale) / scaledWidth);
      scaledWidth = screenWidth / widthScale;
    }
    if(scaledHeight > screenHeight / heightScale){
      scaledWidth = scaledWidth * ((screenHeight / heightScale) / scaledHeight);
      scaledHeight = screenHeight / heightScale;
    }
    backSpriteElement.y = screenHeight - scaledHeight - (screenHeight * 0.236); //71 for versa
  }
  else{
    var yOffset = 63;
    backSpriteElement.y = screenHeight - scaledHeight - yOffset; 
  }
  var xOffset = 0;
  xOffset = ((screenWidth / 2) - (scaledWidth * 1.2)) / 2;
  if(xOffset < 0){
    xOffset = 0;
  }
  backSpriteElement.width = scaledWidth;
  backSpriteElement.height = scaledHeight;
  backSpriteElement.x = xOffset; //TODO make these dynamic 
  backSpriteElement.image = '/private/data/' + fileName;
  console.log("Back sprite set.");
};

function fileExists(fileName) {
  try{
    return fs.statSync("/private/data/" + fileName);
  } 
  catch(exception){
    console.log("Unable to get stats on " + fileName + ". File likely does not exist. " + exception);
    return false;
  }
};

function deleteFile(fileName) {
  try{
    fs.unlinkSync(fileName);
    console.log("Deleted " + fileName);
  }
  catch(err){
    console.log("Warning! Failed to delete file: " + fileName + " " + err);
  }
};

function setFrontSprite(fileName) {
  if(!fileName || !fileExists(fileName)){
    return;
  }  
  var [width, height] = getImageDimensions(fileName);
  var scaledWidth = 2 * width;
  var scaledHeight = 2 * height;
  if(scaledWidth > screenWidth / 2){
    scaledWidth = 1.5 * width;
    scaledHeight = 1.5 * height;
  }
  //If image is still too large it is likely custom.
  if(scaledWidth > screenWidth / 2.5){
    scaledHeight = scaledHeight * ((screenWidth / 2.5) / scaledWidth);
    scaledWidth = screenWidth / 2.5;
  }
  if(scaledHeight > screenHeight / 2.5){
    scaledWidth = scaledWidth * ((screenHeight / 2.5) / scaledHeight);
    scaledHeight = screenHeight / 2.5;
  }
  var xOffset = screenWidth - scaledWidth;
  if(scaledWidth < screenWidth / 2.5){
    xOffset = screenWidth - (screenWidth / 2.5);
  }

  frontSpriteElement.width = scaledWidth;
  frontSpriteElement.height = scaledHeight;
  frontSpriteElement.x = xOffset;
  var yOffSet = (screenHeight / 2.5) - scaledHeight;
  frontSpriteElement.y = yOffSet;
  frontSpriteElement.image = '/private/data/' + fileName;
  console.log("Front sprite set.");
};

if(isStepGoalMet()){
  setFrontSprite(settings.shinyFrontSpriteFileName);
  setBackSprite(settings.shinyBackSpriteFileName);
  settings.stepGoalMet = "true";
} 
else{
  setFrontSprite(settings.frontSpriteFileName);
  setBackSprite(settings.backSpriteFileName);  
  settings.stepGoalMet = "false";
}
inbox.addEventListener("newfile", getImages);
getImages();
//END Sprite retrieval and display


//Init
customText.setAllyName(settings.allyName);
customText.setEnemyName(settings.enemyName);
customText.setDate(new Date());
checkStepGoal();
customText.setEnemyLevel(settings.temperature);

