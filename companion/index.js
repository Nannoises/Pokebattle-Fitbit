import * as messaging from "messaging";
import { device } from "peer";
import { settingsStorage } from "settings";
import { Image } from "image";
import { outbox } from "file-transfer";
import * as weather from "./weather.js";

const NUMBER_OF_POKEMON = 807;
const PokemonServiceDomain = "https://birdcloudbeta.herokuapp.com";
var customSpriteCounter = settingsStorage.getItem("customSpriteCounter");
if(!customSpriteCounter || customSpriteCounter < 1){
  customSpriteCounter = 1; 
}
console.log("Custom sprite counter: " + customSpriteCounter);

settingsStorage.onchange = function(evt) {
  if(evt.key === "ally-image"){
    compressAndTransferImage('backSpriteCustom' + customSpriteCounter, evt.newValue);
    settingsStorage.setItem("customSpriteCounter", ++customSpriteCounter);
  }
  else if(evt.key === "shiny-ally-image"){
    compressAndTransferImage('shinyBackSpriteCustom' + customSpriteCounter, evt.newValue);  
    settingsStorage.setItem("customSpriteCounter", ++customSpriteCounter);
  }
  else if(evt.key === "enemy-image"){
    compressAndTransferImage('frontSpriteCustom' + customSpriteCounter, evt.newValue);
    settingsStorage.setItem("customSpriteCounter", ++customSpriteCounter);
  }
  else if(evt.key === "shiny-enemy-image"){
    compressAndTransferImage('shinyFrontSpriteCustom' + customSpriteCounter, evt.newValue);
    settingsStorage.setItem("customSpriteCounter", ++customSpriteCounter);
  }
  else if(evt.key === "allyName"){
    var name = JSON.parse(evt.newValue).name;
    sendMessage({key: "allyName", newValue: name});
  }
  else if(evt.key === "enemyName"){
    var name = JSON.parse(evt.newValue).name;
    sendMessage({key: "enemyName", newValue: name});
  }
  else if(evt.key === "weatherZip" || evt.key === "weatherApiKey"){
    weather.fetchWeather();
    if(evt.key === "weatherApiKey"){
      sendMessage({key:"weatherApiKey", newValue: JSON.parse(evt.newValue).name});
    }
  }  
  else if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
      console.log("Settings change event: " + JSON.stringify(evt));
      if(evt.key === "randomMode"){
        //Clear manual settings
        settingsStorage.removeItem("shiny-ally-image");
        settingsStorage.removeItem("ally-image");
        settingsStorage.removeItem("shiny-enemy-image");
        settingsStorage.removeItem("enemy-image");
      }
      sendMessage(evt);
  }
}

settingsStorage.setItem("screenWidth", device.screen.width);
settingsStorage.setItem("screenHeight", device.screen.height);

messaging.peerSocket.onopen = () => {
  console.log("Messaging connection ready");
}

messaging.peerSocket.onerror = (err) => {
  console.log(`Connection error: ${err.code} - ${err.message}`);
}

messaging.peerSocket.onmessage = (evt) => {
  console.log("Message recieved: " + JSON.stringify(evt.data));
  switch(evt.data.command){
    case "newRandomPokemon":
      fetchNewRandomPokemon(evt.data.stepGoalMet);
      break;
    case "updateSettings":
      updateSettings(evt.data.settings);
      break;
    case "getShinySprites":
      getShinyBackSprite(evt.data.allyNumber);
      getShinyFrontSprite(evt.data.enemyNumber);
      break;
    case "fetchWeather":
      weather.fetchWeather();      
      break;
  }
};

function compressAndTransferImage(spriteName, settingsValue) {
  const imageData = JSON.parse(settingsValue);
  console.log(imageData.imageUri);
  Image.from(imageData.imageUri)    
    .then(image => image.export("image/vnd.fitbit.txi"))
    .then(buffer => outbox.enqueue(spriteName + '.txi', buffer))
    .then(fileTransfer => {
      console.log("Enqueued " + spriteName + '.txi');
    });
};

function updateSettings(settings){
  settingsStorage.setItem("randomMode", settings.randomMode);
};

function sendMessage(message) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    console.log("Sending message: " + JSON.stringify(message));
    // Send the data to peer as a message
    messaging.peerSocket.send(message);
  }
}

// Source image on the internet
/*
var mostRecentCharizardFront = 'https://birdcloudbeta.herokuapp.com/getMostRecentFrontSprite?Name=Charizard';
var charizardFront = 'https://birdcloudbeta.herokuapp.com/sprites/xy/charizard-mega-y.png';
var charmanderBack = 'https://birdcloudbeta.herokuapp.com/getMostRecentBackSprite?Name=Charmander';
var rayquazaBack = 'https://birdcloudbeta.herokuapp.com/getMostRecentBackSprite?Name=Rayquaza';
var mostRecentCharizardBack = 'https://birdcloudbeta.herokuapp.com/getMostRecentBackSprite?Name=Charizard';
var unprocessedCharizard = 'https://birdcloudbeta.herokuapp.com/sprites/community-gba/charizard-mega-y.png';
var byIndexTest = 'https://birdcloudbeta.herokuapp.com/getMostRecentFrontSprite?Index=152';
*/

function fetchSprite(url, spriteName, callBack) {  
    // Fetch the image from the internet
    console.log("Fetching " + url);
    fetch(url)
    .then(response => response.arrayBuffer())
    .then(buffer => Image.from(buffer, "image/png"))
    .then(image => image.export("image/vnd.fitbit.txi"))
    .then(buffer => outbox.enqueue(spriteName, buffer))
    .then(fileTransfer => {console.log('Enqueued ' + spriteName);})
    .then(() => {      
      if(callBack && typeof(callBack) == 'function'){
        callBack();
      }
    });
};

function fetchName(key, index){
  var url = PokemonServiceDomain + `/pokemonName?Index=${index}`;
  console.log("Fetching" + url);
  fetch(url)
  .then(response => response.text())
  .then(text => {
      settingsStorage.setItem(key, text);
      sendMessage({"key": key, "newValue" : text });
  });
};

function fetchNameCallBack(index, callBack) {
  var url = PokemonServiceDomain + `/pokemonName?Index=${index}`;
  console.log("Fetching" + url);
  fetch(url)
  .then(response => response.text())
  .then(text => {
      if(callBack && typeof(callBack) == 'function'){
        callBack();
      }
  });
};

function fetchNewRandomPokemon(stepGoalMet){
  var randomPoke1 = Math.floor(Math.random() * (NUMBER_OF_POKEMON));
  var randomPoke2 = Math.floor(Math.random() * (NUMBER_OF_POKEMON));
  var allySpriteUrl = PokemonServiceDomain + "/getMostRecentBackSprite?SkipFormat=1&Index=" + randomPoke1;
  var enemySpriteUrl = PokemonServiceDomain + "/getMostRecentFrontSprite?SkipFormat=1&Index=" + randomPoke2;
  var allyShinySpriteUrl = PokemonServiceDomain + "/getMostRecentBackSpriteShiny?SkipFormat=1&Index=" + randomPoke1;
  var enemyShinySpriteUrl = PokemonServiceDomain + "/getMostRecentFrontSpriteShiny?SkipFormat=1&Index=" + randomPoke2;
  
  if(stepGoalMet && stepGoalMet.toString() == "true"){
      fetchSprite(allyShinySpriteUrl, `shinyBackSprite${randomPoke1}.txi`, () => {
        fetchName("allyName", randomPoke1);
        fetchSprite(enemyShinySpriteUrl, `shinyFrontSprite${randomPoke2}.txi`, () =>{
          fetchName("enemyName", randomPoke2);
          /* Only fetch needed sprites, regular sprites will be fetched next day.
          fetchSprite(allySpriteUrl, `backSprite${randomPoke1}.txi`, () =>{
            fetchSprite(enemySpriteUrl, `frontSprite${randomPoke2}.txi`);          
          });
          */
        }); 
      });
  }
  else{
    fetchSprite(allySpriteUrl, `backSprite${randomPoke1}.txi`, () =>{
      fetchName("allyName", randomPoke1);
      fetchSprite(enemySpriteUrl, `frontSprite${randomPoke2}.txi`, () =>{
        fetchName("enemyName", randomPoke2);
        /* Only fetch regular sprites, shiny will be fetched on step goal completion.
        fetchSprite(allyShinySpriteUrl, `shinyBackSprite${randomPoke1}.txi`, () => {
          fetchSprite(enemyShinySpriteUrl, `shinyFrontSprite${randomPoke2}.txi`); 
        });
        */
      });          
    });
  }
};

function getShinyBackSprite(pokemonNumber){
  var allyShinySpriteUrl = PokemonServiceDomain + "/getMostRecentBackSpriteShiny?SkipFormat=1&Index=" + pokemonNumber;
  fetchSprite(allyShinySpriteUrl, `shinyBackSprite${pokemonNumber}.txi`);
};

function getShinyFrontSprite(pokemonNumber){
  var enemyShinySpriteUrl = PokemonServiceDomain + "/getMostRecentFrontSpriteShiny?SkipFormat=1&Index=" + pokemonNumber;
  fetchSprite(enemyShinySpriteUrl, `shinyFrontSprite${pokemonNumber}.txi`);
};
