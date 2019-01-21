// Import the messaging module
import * as messaging from "messaging";
import { geolocation } from "geolocation";
import { settingsStorage } from "settings";

var ENDPOINT = "https://api.openweathermap.org/data/2.5/weather?units=imperial&";
var API_KEY = undefined;

// Fetch the weather from OpenWeather
export function fetchWeather() {
  var settingItem = settingsStorage.getItem("weatherApiKey");
  var API_KEY_Obj = settingItem == undefined ? undefined : JSON.parse(settingItem);
  API_KEY = API_KEY_Obj == undefined ? undefined : API_KEY_Obj.name;
  if(API_KEY == undefined || API_KEY == ""){
    console.log("No API key set. Cannot retrieve weather.");
    //Send defaults since we no longer can get weather.
    var weather = {
      key: "weather",
      temperature: 100,
      sky: "Clear"
    }
    // Send the weather data to the device
    returnWeatherData(weather);
    return;
  }
  settingItem = settingsStorage.getItem("weatherZip");
  var zipObj = settingItem == undefined ? undefined : JSON.parse(settingItem);
  var zip = zipObj == undefined ? undefined : zipObj.name;
  var useZip = zip != undefined && zip != "";
  if(useZip){
    queryOpenWeather(ENDPOINT + "zip=" + zip);
  }
  else {
    getGeoLocation();
  }
};

function queryOpenWeather(url){
  console.log("Fetching: " + url + "&APPID=" + API_KEY);
  fetch(url + "&APPID=" + API_KEY)
  .then(function (response) {
      response.json()
      .then(function(data) {
        console.log(JSON.stringify(data));
        if(data["cod"] != 200){
          console.log("Error response from openWeatherMap API.");
          return;
        }
        var weather = {
          key: "weather",
          temperature: data["main"]["temp"],
          sky: data["weather"][0]["main"]
        }
        // Send the weather data to the device
        returnWeatherData(weather);
      });
  })
  .catch(function (err) {
    console.log("Error fetching weather: " + err);
  }); 
};

// Send the weather data to the device
function returnWeatherData(data) {
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    //console.log("returning weather data: " + JSON.stringify(data));
    // Send a command to the device
    messaging.peerSocket.send(data);
  } else {
    console.log("Error: Connection is not open");
  }
};

function getGeoLocation(){
  geolocation.getCurrentPosition(
    function(position) {
      console.log(position.coords.latitude + ", " + position.coords.longitude);
      queryOpenWeather(ENDPOINT + "lat=" + position.coords.latitude + "&lon=" + position.coords.longitude);
    },
    function(error) {
      console.log("Failed to retrieve GPS location. Error: " + JSON.stringify(error));
    },
    {
      maximumAge: 1000 * 60 * 60 * 6 //6 hours.
    }
  );
};