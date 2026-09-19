import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Geolocation from 'react-native-geolocation-service';
import NetInfo from '@react-native-community/netinfo';

const BeaconPoint = ({ userId = "USER_123" }) => {
  const [isBeaconActive, setIsBeaconActive] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastLocation, setLastLocation] = useState(null);

  useEffect(() => {
    // 1. ENABLE OFFLINE PERSISTENCE
    // This allows Firebase to store data locally when there is no internet
    firestore().settings({ persistence: true });

    // 2. MONITOR NETWORK STATUS
    const unsubscribeNet = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
    });

    return () => unsubscribeNet();
  }, []);

  // 3. THE BEACON LOGIC (Triggered by SOS or ML alert)
  const triggerBeacon = () => {
    setIsBeaconActive(true);
    Alert.alert("Beacon Activated", "Tracking location and alerting authorities.");

    // Get the user's current GPS location
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLastLocation({ latitude, longitude });

        // Save to Firebase (Will save locally if offline, syncs when online)
        firestore()
          .collection('RescueBeacons')
          .doc(userId)
          .set({
            latitude: latitude,
            longitude: longitude,
            status: 'NEEDS_RESCUE',
            timestamp: firestore.FieldValue.serverTimestamp(),
          })
          .then(() => {
            console.log('Location saved successfully!');
          })
          .catch(error => {
            console.error("Error saving location: ", error);
          });
      },
      (error) => {
        console.log(error.code, error.message);
        Alert.alert("Error", "Could not get location. Please enable GPS.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const deactivateBeacon = () => {
    setIsBeaconActive(false);
    // Optional: Update status in database to 'RESCUED' or 'SAFE'
    firestore().collection('RescueBeacons').doc(userId).update({
      status: 'SAFE'
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Beacon Point Node</Text>
      
      {/* Network Status Indicator */}
      <View style={[styles.statusBadge, { backgroundColor: isOnline ? '#4CAF50' : '#F44336' }]}>
        <Text style={styles.statusText}>
          {isOnline ? '🟢 Online - Syncing to Server' : '🔴 Offline - Saving Locally'}
        </Text>
      </View>

      {/* Location Display for testing */}
      {lastLocation && (
        <Text style={styles.locationText}>
          Last Known: {lastLocation.latitude.toFixed(4)}, {lastLocation.longitude.toFixed(4)}
        </Text>
      )}

      {/* Manual Trigger (Usually triggered by SOS button) */}
      {!isBeaconActive ? (
        <TouchableOpacity style={styles.sosButton} onPress={triggerBeacon}>
          <Text style={styles.buttonText}>ACTIVATE BEACON</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.safeButton} onPress={deactivateBeacon}>
          <Text style={styles.buttonText}>MARK AS SAFE</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    margin: 10,
    elevation: 3, 
    shadowColor: '#000', 
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statusBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 15,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  locationText: {
    marginBottom: 15,
    color: '#555',
  },
  sosButton: {
    backgroundColor: '#D32F2F',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  safeButton: {
    backgroundColor: '#388E3C',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default BeaconPoint;
