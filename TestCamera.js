import React from 'react';
import { View } from 'react-native';
import { Camera } from 'expo-camera';

const TestCamera = () => {
  return (
    <View style={{ flex: 1 }}>
      <Camera style={{ flex: 1 }} type={Camera.Constants.Type.back} />
    </View>
  );
};

export default TestCamera; 