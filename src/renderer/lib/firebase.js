// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA8qCcCpP6wwQMbcm1jAKle234_s4Waslk",
    authDomain: "profile-cloud.firebaseapp.com",
    projectId: "profile-cloud",
    storageBucket: "profile-cloud.appspot.com",
    messagingSenderId: "420254436941",
    appId: "1:420254436941:web:a8ef30f1bad7d4c2085604",
    measurementId: "G-2CZKVLCGJJ"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
