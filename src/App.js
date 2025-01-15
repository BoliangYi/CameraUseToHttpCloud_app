import React from 'react';
import { View, Alert } from 'react-native';
import CameraComponent from '../components/CameraComponent';
import axios from 'axios';

const App = () => {
  const handleCapture = async (imageUri) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      });

      const response = await axios.post('https://us-central1-authentic-root-412818.cloudfunctions.net/function-2', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Image uploaded successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <CameraComponent onCapture={handleCapture} />
    </View>
  );
};

export default App;