// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDla2zilILl5X0sQ4fbhAO61uFCqCoVhZc",
    authDomain: "is-auth-dev.firebaseapp.com",
    projectId: "is-auth-dev",
    storageBucket: "is-auth-dev.appspot.com",
    messagingSenderId: "610580654354",
    appId: "1:610580654354:web:d7dc9982f52ece959c2bcb"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
