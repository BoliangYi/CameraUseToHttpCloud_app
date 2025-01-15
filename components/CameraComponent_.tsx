import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import * as ImageManipulator from 'expo-image-manipulator';
import { AUTH_TOKEN } from '@/constants/config';

export default function CameraComponent({ onCapture }: { onCapture: (uri: string) => void }) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const tempDir = FileSystem.cacheDirectory + 'temp_images/';
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [token, setToken] = useState(AUTH_TOKEN);
  useEffect(() => {
    const checkExistingPhotos = async () => {
      try {
        const dirInfo = await FileSystem.getInfoAsync(tempDir);
        if (dirInfo.exists) {
          const files = await FileSystem.readDirectoryAsync(tempDir);
          const photoFiles = files.filter(file => file.startsWith('temp_photo_') && file.endsWith('.jpg'));
          if (photoFiles.length > 0) {
            const lastPhotoNumber = photoFiles.reduce((max, file) => {
              const match = file.match(/temp_photo_(\d+)\.jpg/);
              if (match) {
                return Math.max(max, parseInt(match[1], 10));
              }
              return max;
            }, 0);
            setPhotoCount(lastPhotoNumber + 1);
          }
        }
      } catch (error) {
        console.error('Error checking existing photos:', error);
      }
    };

    checkExistingPhotos();
  }, []);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo) {
          await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
          const tempUri = tempDir + `temp_photo_${photoCount}.jpg`;
          const manipResult = await ImageManipulator.manipulateAsync(
            photo.uri,
            [{ resize: { width: 800 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
          );
          await FileSystem.moveAsync({ from: manipResult.uri, to: tempUri });
          setPhotoCount(photoCount + 1);
          onCapture(tempUri);
          setNotificationMessage(`Image saved to ${tempUri}`);
          setNotificationVisible(true);
          setTimeout(() => {
            setNotificationVisible(false);
          }, 2000);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
      }
    }
  };

  const clearPictures = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(tempDir);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(tempDir);
        setPhotoCount(0);
        setNotificationMessage('All images removed');
        setNotificationVisible(true);
        setTimeout(() => {
          setNotificationVisible(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error clearing pictures:', error);
    }
  };

  const sendPictures = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(tempDir);
      if (dirInfo.exists) {
        const files = await FileSystem.readDirectoryAsync(tempDir);
        const photoFiles = files.filter(file => file.startsWith('temp_photo_') && file.endsWith('.jpg'));

        if (photoFiles.length > 0) {
          const formData = new FormData();
          for (const file of photoFiles) {
            const fileUri = tempDir + file;
            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            if (fileInfo.exists) {
              formData.append('files', {
                uri: fileUri,
                type: 'image/jpeg',
                name: file,
              });
            }
          }

          const response = await axios.post(
            'https://us-central1-authentic-root-412818.cloudfunctions.net/function-2',
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`,
              },
            }
          );

          if (response.status === 200) {
            setNotificationMessage('Images sent successfully!');
          } else {
            setNotificationMessage('Failed to send images.');
          }
        } else {
          setNotificationMessage('No images to send.');
        }
        setNotificationVisible(true);
        setTimeout(() => {
          setNotificationVisible(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error sending pictures:', error);
      setNotificationMessage('Error sending images.');
      setNotificationVisible(true);
      setTimeout(() => {
        setNotificationVisible(false);
      }, 2000);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={takePicture}>
            <Text style={styles.text}>Take Picture</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={clearPictures}>
            <Text style={styles.text}>Clear Pictures</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={sendPictures}>
            <Text style={styles.text}>Send Pictures</Text>
          </TouchableOpacity>
        </View>
        {notificationVisible && (
          <View style={styles.notificationContainer}>
            <Text style={styles.notificationText}>{notificationMessage}</Text>
          </View>
        )}
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 40,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  notificationContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  notificationText: {
    color: 'white',
  },
});
