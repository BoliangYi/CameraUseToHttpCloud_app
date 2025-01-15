import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import CameraComponent from '@/components/CameraComponent';

export default function CameraScreen() {
  const handleCapture = (uri: string) => {
    console.log('Captured image URI:', uri);
    Alert.alert('Image Captured', `Image saved to ${uri}`);
    // You can add additional logic here, such as uploading the image or navigating to another screen
  };

  return (
    <View style={styles.container}>
      <CameraComponent onCapture={handleCapture} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 