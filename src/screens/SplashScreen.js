import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import RNBootSplash from 'react-native-bootsplash';
import GIFImage from 'react-native-gif-image';



const SplashScreen = () => {
  useEffect(() => {
    const hideSplash = async () => {
      await RNBootSplash.hide({ fade: true });
    };
    hideSplash();
  }, []);

  return (
    <View style={styles.container}>
      <GIFImage
        source={require('./assets/Splash.gif')} // Substitua 'your-gif.gif' pelo nome do seu arquivo GIF
        style={styles.gif}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gif: {
    width: '100%',
    height: '100%',
  },
});

export default SplashScreen;
