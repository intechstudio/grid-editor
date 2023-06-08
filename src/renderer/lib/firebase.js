// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const buildVariables = window.ctxProcess.buildVariables();

const devCentralAuthConfig = {
  apiKey: "AIzaSyDla2zilILl5X0sQ4fbhAO61uFCqCoVhZc",
  authDomain: "is-auth-dev.firebaseapp.com",
  projectId: "is-auth-dev",
  storageBucket: "is-auth-dev.appspot.com",
  messagingSenderId: "610580654354",
  appId: "1:610580654354:web:d7dc9982f52ece959c2bcb",
};

const prodCentralAuthConfig = {
  apiKey: "AIzaSyDoGeGnoBdSBQZ6oG-t3nEq8Ol_jEejFw8",
  authDomain: "is-api-auth.firebaseapp.com",
  projectId: "is-api-auth",
  storageBucket: "is-api-auth.appspot.com",
  messagingSenderId: "611038678816",
  appId: "1:611038678816:web:5d8fab312b614702539145",
};

const centralAuthConfig =
  buildVariables.BUILD_ENV === "production" ? prodCentralAuthConfig : devCentralAuthConfig;

export const centralApp = initializeApp(centralAuthConfig, "central");
export const centralAuth = getAuth(centralApp);
