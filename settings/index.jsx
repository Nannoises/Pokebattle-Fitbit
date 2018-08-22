import Background from 'background.png';
function mySettings(props) {
  let screenWidth = props.settingsStorage.getItem("screenWidth");
  let screenHeight = props.settingsStorage.getItem("screenHeight");
  let backgroundImg = 'resources/colorBackground.png';
  let sectionStyle = {
    backgroundImage: 'url(${Background})'
  };
  
  return (
    <Page style={ sectionStyle }>
      <Text>Test</Text>
        <ImagePicker
          title="Background Image"
          description="Pick an image to use as your background."
          label="Pick a Background Image"
          sublabel="Background image picker"
          settingsKey="background-image"
          imageWidth={ screenWidth }
          imageHeight={ screenHeight }
        />
    </Page>
  );
}

registerSettingsPage(mySettings);