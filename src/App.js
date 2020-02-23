import React, { useState } from 'react';
import { Layout, Menu, Input } from 'antd';
import './App.css';
import firebase from 'firebase/app'
import 'firebase/auth'
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import Logo from './Logo'
import { menuHeight, logoHeight, paddingTop } from './styles'
const config = require('./config.json')

const { Header, Content, Footer } = Layout
// Initialize Firebase
console.log(process.env.REACT_APP_FirebaseAPIKey)
console.log(process.env)
firebase.initializeApp({ ...config, apiKey: process.env.REACT_APP_FirebaseAPIKey });

// Configure FirebaseUI.
const uiConfig = {
  // Popup signin flow rather than redirect flow.
  signInFlow: 'popup',
  callbacks: {
    // Avoid redirects after sign-in.
    signInSuccessWithAuthResult: () => false
  },
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.GithubAuthProvider.PROVIDER_ID
  ]
};

const DevHome = ({ child }) => <Layout className="layout">
  <Header>
    <div className="logo" style={{ paddingTop }}>
      <Logo
        className="logo-primary"
        height={logoHeight}
        width={logoHeight}
      />
    </div>
    <Menu
      theme="dark"
      mode="horizontal"
      defaultSelectedKeys={['2']}
      style={{ lineHeight: menuHeight + 'px' }}
    >
      <Menu.Item key="1">nav 1</Menu.Item>
      <Menu.Item key="2">nav 2</Menu.Item>
      <Menu.Item key="3">nav 3</Menu.Item>
    </Menu>
  </Header>
  <Content style={{ padding: '0 50px' }}>
    {child()}
  </Content>
  <Footer style={{ textAlign: 'center' }}>Finside</Footer>
</Layout>


const SignInScreen = () => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState("")
  console.log(token)
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      user.getIdToken(true).then(setToken).catch(err => console.log(err))
    }
    else {
      setToken("")
    }
    setUser(user)

  })

  console.log(user)
  return <DevHome
    child={() => !!user ? <><Input.Password value={token} /><SwaggerUI
      url={`https://cdn.jsdelivr.net/gh/realoptions/option_price_faas@${process
        .env.REACT_APP_TAG || 'v67'}/docs/openapi_v2.yml`}
    /></> : <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()} />}
  />
}

export default SignInScreen;
