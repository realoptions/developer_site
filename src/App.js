import React, { Component, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import firebase from 'firebase'
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
const config = require('./config.json')

// Initialize Firebase
firebase.initializeApp(config);

// Configure FirebaseUI.
const uiConfig = {
  // Popup signin flow rather than redirect flow.
  signInFlow: 'popup',
  // Redirect to /signedIn after sign in is successful. Alternatively you can provide a callbacks.signInSuccess function.
  //signInSuccessUrl: '/',
  callbacks: {
    // Avoid redirects after sign-in.
    signInSuccessWithAuthResult: () => false
  },
  // We will display Google and Facebook as auth providers.
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.FacebookAuthProvider.PROVIDER_ID,
    firebase.auth.GithubAuthProvider.PROVIDER_ID
  ]
};

const DevHome = ({ token }) => <p>Hello, <a onClick={() => firebase.auth().signOut()}>Sign-out</a></p>
const SignInScreen = () => {
  //const [isSignedIn, setIsSignedIn] = useState(false)
  const [user, setUser] = useState({})
  const [token, setToken] = useState("")
  console.log(token)
  firebase.auth().onAuthStateChanged(user => {
    user.getIdToken(true).then(setToken).catch(err => console.log(err))
    setUser(user)
  })

  console.log(user)
  return !!user ? <DevHome /> : (
    <div>
      <h1>My App</h1>
      <p>Please sign-in:</p>
      <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()} />
    </div>
  )
}

export default SignInScreen;
