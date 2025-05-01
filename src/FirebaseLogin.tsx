import React from 'react'
import { GoogleLoginButton, FacebookLoginButton, GithubLoginButton } from 'react-social-login-buttons'
import { GoogleAuthProvider, FacebookAuthProvider, GithubAuthProvider, signInWithPopup, Auth } from 'firebase/auth'
import { Col, Row } from 'antd';
const googleProvider = new GoogleAuthProvider()
const facebookProvider = new FacebookAuthProvider()
const githubProvider = new GithubAuthProvider()

export const LoginButton = ({ auth }: { auth: Auth }) => {
    return <>
        <Row>
            <Col xs={0} md={6}></Col>
            <Col xs={24} md={12}>
                <GoogleLoginButton
                    onClick={() => {
                        signInWithPopup(auth, googleProvider)
                    }}
                />
            </Col>
        </Row >
        <Row>
            <Col xs={0} md={6}></Col>
            <Col xs={24} md={12}>
                <FacebookLoginButton
                    onClick={() => {
                        signInWithPopup(auth, facebookProvider)
                    }}
                />
            </Col>
        </Row >
        <Row>
            <Col xs={0} md={6}></Col>
            <Col xs={24} md={12}>
                <GithubLoginButton
                    onClick={() => {
                        signInWithPopup(auth, githubProvider)
                    }}
                />
            </Col>
        </Row >
    </>
}
export default LoginButton