import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, message, Alert } from 'antd';
import './App.css';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, FacebookAuthProvider, GithubAuthProvider, User } from "firebase/auth";
import { CopyOutlined as Copy } from '@ant-design/icons';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import Logo from './Logo.tsx'
import { menuHeight, logoHeight, paddingTop } from './styles'
import { copyToClipboard } from './copyToClipboard'
const apiSpec = require('./swagger_spec.json')
const config = require('./config.json')
const { Header, Content, Footer } = Layout
// Initialize Firebase
const firebase = initializeApp({ ...config, apiKey: process.env.REACT_APP_FirebaseAPIKey });
const auth = getAuth(firebase)
// Configure FirebaseUI.
const uiConfig = {
  // Popup signin flow rather than redirect flow.
  signInFlow: 'popup',
  callbacks: {
    // Avoid redirects after sign-in.
    signInSuccessWithAuthResult: () => false
  },
  signInOptions: [
    GoogleAuthProvider.PROVIDER_ID,
    FacebookAuthProvider.PROVIDER_ID,
    GithubAuthProvider.PROVIDER_ID
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
  <Button type="primary" icon={<Copy />} onClick={() => {
    copyToClipboard(token)
    info()
  }}>Copy Token</Button>
</div>

const explanationStyle = { marginTop: 15 }
const Explanation = ({ token }) => <Alert
  message="Authentication"
  description={<Description token={token} />}
  type="info"
  style={explanationStyle}
/>


const DevHome = () => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState("")

  useEffect(() => {
    const unregisterAuthObserver = onAuthStateChanged(auth, user => {
      if (user) {
        user.getIdToken(true).then(setToken).catch(err => console.log(err))
      }
      else {
        setToken("")
      }
      setUser(user)
    });
    return () => unregisterAuthObserver(); // Make sure we un-register Firebase observers when the component unmounts.
  }, [])
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
        style={{ lineHeight: menuHeight + 'px' }}
      >
        {isSignedIn && <Menu.Item key="1" onClick={() => signOut(auth)} style={{ float: 'right' }}>Log Out</Menu.Item>}
      </Menu>
    </Header>
    <Content style={{ padding: '0 50px' }}>
      {isSignedIn ? <>
        <Explanation token={token} />
        <SwaggerUI
          spec={apiSpec}
          supportedSubmitMethods={["get", "put", "post", "delete"]}
          docExpansion='list'
        />
      </> : <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={auth} />}
    </Content>
    <Footer style={{ textAlign: 'center' }}>Finside</Footer>
  </Layout>

}


export default DevHome;
