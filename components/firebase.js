import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBSox-VmJBWLNCKP0FxhdPNMoTcgVZWWuQ",
  authDomain: "expo-5110c.firebaseapp.com",
  projectId: "expo-5110c",
  storageBucket: "expo-5110c.firebasestorage.app",
  messagingSenderId: "654442639877",
  appId: "1:654442639877:android:912064aa45d62f24bbe26c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '654442639877-pbj8mrrkvud948uh9bfcbbd87otjsv6s.apps.googleusercontent.com', // Correct Web Client ID
});

export { auth, GoogleSignin };

