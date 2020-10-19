import document from "document";
const root = document.getElementById('root');
const screenHeight = root.height;
const screenWidth = root.width;
const allyNameStartingPoint = screenWidth * 0.44;
const enemyNameStartingPoint = screenWidth * 0.02;
var slimCharacters = ["colon", "apo", "bang"];

function setText(elementPrefix, name, checkSpecialSpacing, startingPoint)
{
  if(!name || !elementPrefix)
    return;
  
  var element;
  var currentPosition = startingPoint || 0;
  for(var i=0;(element = document.getElementById(elementPrefix + i)) !== null;i++){
    if(startingPoint){
      element.x = currentPosition;
    }  
    if(name[i] === ' '){
      element.style.display = 'none';
      currentPosition += screenWidth * 0.02; //Slimmer spaces;
    }
    else if(name.length <= i){
      element.style.display = 'none';
    }
    else{
      element.style.display = 'inline';
      var sanitizedLetterName = santizeLetterName(name[i]);
      if(checkSpecialSpacing ){
        if(slimCharacters.indexOf(sanitizedLetterName) > -1){
          element.width = .02 * screenWidth; //2%
          currentPosition += screenWidth * 0.03; //3% spacing after slim characters;
        }
        else {
          element.width = .05 * screenWidth; //5%
          currentPosition += screenWidth * 0.06; //Standard 6% spacing;
        }      
      }
      element.image = `font/${sanitizedLetterName}.png`;
    }
  }
}

function santizeLetterName(letterName)
{
  switch(letterName)
    {
      case 'é':
        return 'e201';
      case '-':
        return 'hyp';
      case '?':
        return 'question';
      case '!':
        return 'bang';
      case ';':
        return 'semicolon';
      case ':':
        return 'colon';
      case '.':
        return 'dot';
      case '&':
        return 'amp';
      case "'":
        return 'apo';
      case "♂":
        return 'male';        
      case "♀":
        return 'female';
      default:        
        return letterName;
    }
}

export function setAllyLevel(level){
  setText('allyLevelChar', 'lv' + level, false);
};
export function setEnemyLevel(level){
  setText('enemyLevelChar', 'lv' + level, false);  
};
export function setAllyName(name){
  setText('allyNameChar', name, true, allyNameStartingPoint);
};
export function setEnemyName(name){
  setText('enemyNameChar', name, true, enemyNameStartingPoint);  
};
export function setDate(date){
  var dayString = date.toString().substring(0, 10).replace(' ', '').replace(' ', '');
  setText('dateChar', dayString, false);
};
