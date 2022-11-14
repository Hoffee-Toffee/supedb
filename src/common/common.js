// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCRrxXRbbyCbDh06oFKoDwZgd4Ucd0nXyk",
    authDomain: "supe-db.firebaseapp.com",
    projectId: "supe-db",
    storageBucket: "supe-db.appspot.com",
    messagingSenderId: "414925832647",
    appId: "1:414925832647:web:04e6b82a8fc2dd48bf99e2",
    measurementId: "G-FCEP73WM0G"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Run 'start' function when the auth state loads/changes
auth.onAuthStateChanged(start);