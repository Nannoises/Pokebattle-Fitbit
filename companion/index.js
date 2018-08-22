import * as messaging from "messaging";
import { device } from "peer";
import { settingsStorage } from "settings";
import { Image } from "image";
import { outbox } from "file-transfer"

settingsStorage.setItem("screenWidth", device.screen.width);
settingsStorage.setItem("screenHeight", device.screen.height);

messaging.peerSocket.onopen = () => {
  console.log("Ready");
  sendMessage();
}

messaging.peerSocket.onerror = (err) => {
  console.log(`Connection error: ${err.code} - ${err.message}`);
}

messaging.peerSocket.onmessage = (evt) => {
  console.log(JSON.stringify(evt.data));
}

function sendMessage() {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    // Send the data to peer as a message
    messaging.peerSocket.send({
      sampleData: 123456
    });
  }
}

// Source image on the internet
var srcImage = 'https://birdcloudbeta.herokuapp.com/getMostRecentFrontSprite?Name=Charizard';
srcImage = 'https://birdcloudbeta.herokuapp.com/sprites/xy/charizard-mega-y.png';

// Destination filename
let destFilename = "frontSprite.txi";

function sendImage() {  
    // Fetch the image from the internet   
    fetch(srcImage)
    .then(response => response.arrayBuffer())
    .then(buffer => Image.from(buffer, "image/png"))
    .then(image => image.export("image/vnd.fitbit.txi"))
    .then(buffer => outbox.enqueue(destFilename, buffer))
    .then(fileTransfer => {console.log('Enqueued ' + destFilename);});
};

sendImage();
