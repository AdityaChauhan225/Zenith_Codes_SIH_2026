# Beacon Point (Offline-First Tracker)

## Overview
This module handles the hyper-local tracking and alerting mechanism for the Flash Flood Prediction System. Since mobile networks frequently go down during natural disasters (floods, landslides), this component is designed with an **Offline-First, Store-and-Forward architecture**.

## How It Integrates with the Team
* **Triggered By:** The ML prediction model (Varshit & Aditya) or the SOS Button (Aditi).
* **Data Flow:** Tracks coordinates -> Stores locally if offline -> Syncs to Firebase when online.
* **Map Integration:** The offline coordinates can be fed directly into the Offline Maps module (Sidhiksha).
* **User Identity:** Tied directly to the user sessions from the Login module (Swapnil).

## Tech Stack
* **React Native**
* **Firebase Firestore** (Utilizing built-in Offline Persistence)
* **Geolocation Service** (`react-native-geolocation-service`)
* **Network Status** (`@react-native-community/netinfo`)

## Setup Instructions
1. Run `npm install @react-native-firebase/app @react-native-firebase/firestore react-native-geolocation-service @react-native-community/netinfo`
2. Drop `BeaconPoint.jsx` into your `components/` folder.
