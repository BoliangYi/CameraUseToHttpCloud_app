import React from 'react';
import { View } from 'react-native';
import CameraComponent from '../../components/CameraComponent';

export default function TabOneScreen() {
  return (
    <View style={{ flex: 1 }}>
      <CameraComponent onCapture={(uri) => console.log('Captured:', uri)} />
    </View>
  );
}
