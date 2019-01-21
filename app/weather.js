import * as messaging from "messaging";
import * as customText from "./customText.js";
import settings from "./settings.js";

// Request weather data from the companion
export function fetchWeather() {
  if(!settings.weatherApiKey || settings.weatherApiKey === ""){
    console.log("No API key stored. Forgoing fetchWeather.");
    return;
  }
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    // Send a command to the companion
    messaging.peerSocket.send({
      command: 'fetchWeather'
    });
  }
};

// Display the weather data received from the companion
export function processWeatherData(data) {
  //console.log(JSON.stringify(data));
  console.log("The temperature is: " + data.temperature);
  console.log("The sky is: " + data.sky);
  settings.temperature = Math.floor(data.temperature);
  customText.setEnemyLevel(settings.temperature);
};
