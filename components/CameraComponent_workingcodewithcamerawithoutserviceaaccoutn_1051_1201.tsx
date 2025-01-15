import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';
import * as ImageManipulator from 'expo-image-manipulator';
import { AUTH_TOKEN } from '@/constants/config';
import Slider from '@react-native-community/slider';

export default function CameraComponent({ onCapture }: { onCapture: (uri: string) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const tempDir = FileSystem.cacheDirectory + 'temp_images/';
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [token, setToken] = useState(AUTH_TOKEN);
  const [zoom, setZoom] = useState(0.68);
  const [maxZoom, setMaxZoom] = useState(4);
  const [cameraReady, setCameraReady] = useState(false);
  const [captureQuality, setCaptureQuality] = useState(1);

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

  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        if (!permission) {
          await requestPermission();
        }
        
        if (permission?.granted) {
          console.log('Camera Permission Granted');
          setCameraReady(true);
        } else {
          console.log('Camera Permission Not Granted');
          setCameraReady(false);
        }
      } catch (error) {
        console.error('Error checking camera permission:', error);
        setCameraReady(false);
      }
    };

    checkCameraPermission();
  }, [permission]);

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
        const photo = await cameraRef.current.takePictureAsync({ quality: captureQuality });
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
          }, 1200);
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

          console.log('Sending request with token:', token);
          console.log('Number of files:', photoFiles.length);

          try {
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

            console.log('Response status:', response.status);
            console.log('Response data:', response.data);

            if (response.status === 200) {
              setNotificationMessage('Images sent successfully!');
            } else {
              setNotificationMessage('Failed to send images.');
            }
          } catch (axiosError) {
            console.error('Axios Error Details:', {
              message: axiosError.message,
              response: axiosError.response?.data,
              status: axiosError.response?.status,
              headers: axiosError.response?.headers
            });
            setNotificationMessage(`Send failed: ${axiosError.message}`);
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

  console.log('Camera Ready:', cameraReady);
  console.log('Zoom:', zoom);
  console.log('Capture Quality:', captureQuality);

  return (
    <View style={styles.container}>
      {permission?.granted && (
        <CameraView
          style={styles.camera}
          ref={cameraRef}
          zoom={zoom}
        />
      )}
      <View style={styles.controlsContainer}>
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
        {cameraReady && (
          <View style={styles.slidersContainer}>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>Zoom: {zoom.toFixed(0.68)}</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={zoom}
                onValueChange={(value) => {
                  console.log('Zoom Slider Changed:', value);
                  setZoom(value);
                }}
              />
            </View>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>Quality: {captureQuality.toFixed(1)}</Text>
              <Slider
                style={styles.slider}
                minimumValue={0.1}
                maximumValue={1}
                step={0.1}
                value={captureQuality}
                onValueChange={(value) => {
                  console.log('Quality Slider Changed:', value);
                  setCaptureQuality(value);
                }}
              />
            </View>
          </View>
        )}
        {notificationVisible && (
          <View style={styles.notificationContainer}>
            <Text style={styles.notificationText}>{notificationMessage}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 0.7,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
  },
  button: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
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
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    height: 50,
  },
  sliderLabel: {
    marginRight: 10,
    fontSize: 16,
  },
  slider: {
    flex: 1,
  },
  zoomSliderContainer: {
    height: 50,
    padding: 10,
  },
  controlsContainer: {
    flex: 0.3,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
  },
  slidersContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    width: '100%',
  },
  sliderRow: {
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  sliderLabel: {
    color: 'white',
    marginRight: 10,
    width: '20%',
  },
  slider: {
    width: '80%',
    height: 40,
  },
});