import { battery } from "power";
import document from "document";
const root = document.getElementById('root');
const screenHeight = root.height;
const screenWidth = root.width;

export function checkBatteryLevel(){
  console.log("Battery level: "  + Math.floor(battery.chargeLevel) + "%");  
  var allyHealthElement = document.getElementById("allyHealthContainer");
  var maxWidth = screenWidth * 0.29;
  allyHealthElement.width = maxWidth * battery.chargeLevel / 100;
  if(battery.chargeLevel < 20){
    allyHealthElement.style.fill = "tomato";
  }
  else if(battery.chargeLevel < 50){
    allyHealthElement.style.fill = "yellow";
  }
  else{
    allyHealthElement.style.fill = "lime";
  }
};

