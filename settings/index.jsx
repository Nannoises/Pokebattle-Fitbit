function mySettings(props) {
  let screenWidth = props.settingsStorage.getItem("screenWidth");
  let screenHeight = props.settingsStorage.getItem("screenHeight");
  return (
    <Page>
      <Toggle settingsKey="randomMode" label="Random Pokemon Each Hour"/>      
      <TextInput label="OpenWeatherMap API Key" settingsKey="weatherApiKey" />
      <TextInput label="Weather ZIP" settingsKey="weatherZip" placeholder="Leave blank to use GPS."/>
      
      <ImagePicker
        title="Ally Image"
        label="Pick an ally image"
        settingsKey="ally-image"
        imageWidth="100"
        imageHeight="100"
        disabled={(props.settings.randomMode === "true")}
      />
      <ImagePicker
        title="Shiny Ally Image"
        label="Pick a shiny ally Image"
        settingsKey="shiny-ally-image"
        imageWidth="100"
        imageHeight="100"
        disabled={(props.settings.randomMode === "true")}
      />
      <TextInput label="Ally Name" settingsKey="allyName" placeholder="Ally Name" disabled={(props.settings.randomMode === "true")}/>
      <ImagePicker
        title="Enemy Image"
        label="Pick an enemy image"
        settingsKey="enemy-image"
        imageWidth="100"
        imageHeight="100"
        disabled={(props.settings.randomMode === "true")}
      />
      <ImagePicker
        title="Shiny Enemy Image"
        label="Pick a shiny enemy image"
        settingsKey="shiny-enemy-image"
        imageWidth="100"
        imageHeight="100"
        disabled={(props.settings.randomMode === "true")}
      />
      <TextInput label="Enemy Name" settingsKey="enemyName" placeholder="Enemy Name" disabled={(props.settings.randomMode === "true")}/>
      <Text>This watchface will always be free and for the love of Fitbit and Pokemon. If you really like it and want to show your support you can 
        <Link source="http://ko-fi.com/A2744LP"> Buy me a coffee.</Link>
      </Text>
    </Page>
  );
}

registerSettingsPage(mySettings);