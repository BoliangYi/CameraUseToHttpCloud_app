import React, { useState } from 'react';
import { Button, View, Text } from 'react-native';
import { auth, GoogleSignin } from './firebase.js'; // Import from firebase.js

const App2 = () => {
  const [user, setUser] = useState(null);

  const signInWithGoogle = async () => {
    try {
      // Get the user's ID token
      const { idToken } = await GoogleSignin.signIn();

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      const userCredential = await auth().signInWithCredential(googleCredential);
      console.error(userCredential);
      setUser(userCredential.user);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {user ? (
        <Text>Welcome, {user.displayName}</Text>
      ) : (
        <Button title="Sig an in with Google" onPress={signInWithGoogle} />
      )}
    </View>
  );
};

export default App2; 