// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const env = window.ctxProcess.env();

// Your web app's Firebase configuration
const devProfileCloudConfig = {
  apiKey: "AIzaSyA8qCcCpP6wwQMbcm1jAKle234_s4Waslk",
  authDomain: "profile-cloud.firebaseapp.com",
  projectId: "profile-cloud",
  storageBucket: "profile-cloud.appspot.com",
  messagingSenderId: "420254436941",
  appId: "1:420254436941:web:a8ef30f1bad7d4c2085604",
  measurementId: "G-2CZKVLCGJJ",
};

const devCentralAuthConfig = {
  apiKey: "AIzaSyDla2zilILl5X0sQ4fbhAO61uFCqCoVhZc",
  authDomain: "is-auth-dev.firebaseapp.com",
  projectId: "is-auth-dev",
  storageBucket: "is-auth-dev.appspot.com",
  messagingSenderId: "610580654354",
  appId: "1:610580654354:web:d7dc9982f52ece959c2bcb"
};

const prodCentralAuthConfig = {}

const profileCloudConfig = env.NODE_ENV === 'production' ? prodProfileCloudConfig : devProfileCloudConfig;
const centralAuthConfig = env.NODE_ENV === 'production' ? prodCentralAuthConfig : devCentralAuthConfig;


export const profileCloudApp = initializeApp(profileCloudConfig, 'profile-cloud');
export const profileCloudAuth = getAuth(profileCloudApp);

export const centralApp = initializeApp(centralAuthConfig, 'central');
export const centralAuth = getAuth(centralApp);
