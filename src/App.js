import React, { useState } from 'react';
import { Layout, Menu, Button, message, Alert } from 'antd';
import './App.css';
import firebase from 'firebase/app'
import 'firebase/auth'
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import Logo from './Logo'
import { menuHeight, logoHeight, paddingTop } from './styles'
import { copyToClipboard } from './copyToClipboard'
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
    firebase.auth.FacebookAuthProvider.PROVIDER_ID,
    firebase.auth.GithubAuthProvider.PROVIDER_ID
  ]
};
const info = () => {
  message.info('Token copied');
}

const Description = ({ token }) => <div>
  <p>
    The API uses tokens provided through OAUTH2 Providers. To authenticate the API, copy the token and
    paste it into the "JWT  (apiKey)" box.
</p>
  <Button type="primary" icon="copy" onClick={() => {
    copyToClipboard(token)
    info()
  }}>Copy Token</Button>
</div>

const Explaination = ({ token }) => <Alert
  message="Authentication"
  description={<Description token={token} />}
  type="info"
  style={{ marginTop: 15 }}
/>


const DevHome = () => {
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
  const isSignedIn = !!user
  return <Layout className="layout" style={{ minHeight: "100vh" }}>
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
        //defaultSelectedKeys={['2']}
        style={{ lineHeight: menuHeight + 'px' }}
      >
        {isSignedIn && <Menu.Item key="1" onClick={() => firebase.auth().signOut()} style={{ float: 'right' }}>Log Out</Menu.Item>}
      </Menu>
    </Header>
    <Content style={{ padding: '0 50px' }}>
      {isSignedIn ? <><Explaination token={token} style={{ marginTop: 15 }} /><SwaggerUI
        url={`https://cdn.jsdelivr.net/gh/realoptions/option_price_faas@${process
          .env.REACT_APP_TAG || 'v67'}/docs/openapi_v2.yml`}
        docExpansion='list'
      /></> : <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()} />}
    </Content>
    <Footer style={{ textAlign: 'center' }}>Finside</Footer>
  </Layout>

}


export default DevHome;
