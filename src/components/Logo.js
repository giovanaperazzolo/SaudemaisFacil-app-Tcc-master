// Logo.js
import React from 'react';
import { View, Image } from 'react-native';

export default function Logo({ width = 150, height = 150 }) {
  return (
    <View style={{ alignItems: 'center', margin: 20 }}>
      <Image source={require('../assets/img/logo.jpg')} style={{ width, height }} />
    </View>
  );
}
