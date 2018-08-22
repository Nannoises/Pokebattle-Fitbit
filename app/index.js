import clock from "clock";
import document from "document";
import { preferences } from "user-settings";
import * as util from "../common/utils";
import { inbox } from "file-transfer";
import fs from "fs";


// Update the clock every minute
clock.granularity = "minutes";

// Get a handle on the <text> element
const myLabel = document.getElementById("myLabel");
let root = document.getElementById('root');
const screenHeight = root.height;
const screenWidth = root.width;
let spriteElement = document.getElementById("sprite");

// Update the <text> element every tick with the current time
clock.ontick = (evt) => {
  let today = evt.date;
  let hours = today.getHours();
  if (preferences.clockDisplay === "12h") {
    // 12h format
    hours = hours % 12 || 12;
  } else {
    // 24h format
    hours = util.zeroPad(hours);
  }
  let mins = util.zeroPad(today.getMinutes());
  myLabel.text = `${hours}:${mins}`;
}

function getImages() {
  var fileName; 
  while (fileName = inbox.nextFile()) {
  // process each file
  console.log('/private/data/' + fileName + ' is now available');
  setFrontSprite(fileName);
 }
  
};

function setFrontSprite(fileName) {
  try{
    fs.statSync("/private/data/" + fileName);
  } 
  catch(exception){
    console.log("Unable to get stats on " + fileName + ". File likely does not exist. " + exception);
    return;
  }
  
  const metadata = new Uint32Array(2);
  const fp = fs.openSync("/private/data/" + fileName, "r");
  fs.readSync(fp, metadata, 0, 8, 24);
  fs.closeSync(fp);
  const [width, height] = metadata;
  //console.log(width, height);

  var scaledWidth = 2 * width;
  var scaledHeight = 2 * height;
  if(scaledWidth > screenWidth / 2){
    scaledWidth = 1.5 * width;
    scaledHeight = 1.5 * height;
  }
  var xOffset = screenWidth - scaledWidth;
  if(scaledWidth < screenWidth / 3){
    xOffset = screenWidth - (screenWidth / 3);
  }
  spriteElement.width = scaledWidth;
  spriteElement.height = scaledHeight;
  spriteElement.x = xOffset; 
  spriteElement.image = '/private/data/' + fileName;    
};

setFrontSprite('frontSprite.txi');
inbox.addEventListener("newfile", getImages);
getImages();

      

