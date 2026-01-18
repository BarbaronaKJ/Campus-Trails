import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Animated, StyleSheet, Alert, TextInput, KeyboardAvoidingView, Platform, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome as Icon } from '@expo/vector-icons';
import { styles } from '../styles';
import { login, register, forgotPassword, resetPassword } from '../services/api';

/**
 * Authentication Modal Component
 * Full-screen modal with three tabs: Login, Register, Forgot Password
 */
const AuthModal = ({
  rendered,
  authTab,
  setAuthTab,
  authModalSlideAnim,
  isAuthModalVisible,
  setAuthModalVisible,
  username,
  setUsername,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  regUsername,
  setRegUsername,
  regEmail,
  setRegEmail,
  regPassword,
  setRegPassword,
  regConfirmPassword,
  setRegConfirmPassword,
  showRegPassword,
  setShowRegPassword,
  showRegConfirmPassword,
  setShowRegConfirmPassword,
  regSecretQuestion,
  setRegSecretQuestion,
  regSecretAnswer,
  setRegSecretAnswer,
  forgotSecretQuestion,
  setForgotSecretQuestion,
  forgotSecretAnswer,
  setForgotSecretAnswer,
  forgotNewPassword,
  setForgotNewPassword,
  forgotConfirmPassword,
  setForgotConfirmPassword,
  showForgotPassword,
  setShowForgotPassword,
  showForgotConfirmPassword,
  setShowForgotConfirmPassword,
  showSecretQuestionPicker,
  setShowSecretQuestionPicker,
  secretQuestions,
  setIsLoggedIn,
  setAuthToken,
  setCurrentUser,
  setUserProfile,
  setSavedPins,
  setFeedbackHistory,
  validatePassword,
  validateUsername,
  styles: customStyles
}) => {
  const authStyles = customStyles || styles;

  // Handle Login
  const handleLogin = async () => {
    try {
      if (!username || !password) {
        Alert.alert('Error', 'Please enter username/email and password');
        return;
      }

      const { user, token } = await login(username, password);
      
      // Store token and user data
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));
      await AsyncStorage.removeItem('wasLoggedOut'); // Clear logout flag
      
      // Update state
      setAuthToken(token);
      setCurrentUser(user);
      setIsLoggedIn(true);
      setUserProfile({
        username: user.username || '',
        email: user.email || '',
        profilePicture: user.profilePicture || null,
      });
      
      // Update saved pins and feedback from user activity
      if (user.activity) {
        setSavedPins(user.activity.savedPins || []);
        setFeedbackHistory(user.activity.feedbackHistory || []);
      }
      
      // Clear form and close modal
      setUsername('');
      setPassword('');
      setAuthModalVisible(false);
      
      Alert.alert('Success', 'Login successful!');
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Invalid username/email or password');
    }
  };

  // Handle Register
  const handleRegister = async () => {
    try {
      // Validation
      if (!regUsername || !regEmail || !regPassword || !regConfirmPassword) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      if (regPassword !== regConfirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }

      const usernameError = validateUsername(regUsername);
      if (usernameError) {
        Alert.alert('Error', usernameError);
        return;
      }

      const passwordError = validatePassword(regPassword);
      if (passwordError) {
        Alert.alert('Error', passwordError);
        return;
      }

      if (!regSecretQuestion || !regSecretAnswer) {
        Alert.alert('Error', 'Please select a secret question and provide an answer');
        return;
      }

      // Register user
      const result = await register(regUsername, regEmail, regPassword, regSecretQuestion, regSecretAnswer);
      const { user, token } = result;
      
      // Store token and user data
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));
      await AsyncStorage.removeItem('wasLoggedOut');
      
      // Update state
      setAuthToken(token);
      setCurrentUser(user);
      setIsLoggedIn(true);
      setUserProfile({
        username: user.username || '',
        email: user.email || '',
        profilePicture: user.profilePicture || null,
      });
      
      // Clear form and close modal
      setRegUsername('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegSecretQuestion('');
      setRegSecretAnswer('');
      setAuthModalVisible(false);
      
      Alert.alert('Success', 'Registration successful! You are now logged in.');
    } catch (error) {
      Alert.alert('Registration Failed', error.message || 'Registration failed. Please try again.');
    }
  };

  // Handle Forgot Password - Step 1: Get secret question
  const handleForgotPasswordStep1 = async () => {
    try {
      if (!regEmail) {
        Alert.alert('Error', 'Please enter your email address');
        return;
      }

      const result = await forgotPassword(regEmail);
      
      if (result.success && result.secretQuestion) {
        setForgotSecretQuestion(result.secretQuestion);
        Alert.alert('Success', result.message || 'Please answer your secret question');
      } else {
        Alert.alert('Error', result.message || 'Unable to reset password. Please contact support.');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to process password reset request');
    }
  };

  // Handle Forgot Password - Step 2: Reset password
  const handleForgotPasswordStep2 = async () => {
    try {
      if (!forgotSecretAnswer || !forgotNewPassword || !forgotConfirmPassword) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      if (forgotNewPassword !== forgotConfirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }

      const passwordError = validatePassword(forgotNewPassword);
      if (passwordError) {
        Alert.alert('Error', passwordError);
        return;
      }

      // Reset password
      await resetPassword(regEmail, forgotSecretAnswer, forgotNewPassword);
      
      // Clear form and switch to login tab
      setRegEmail('');
      setForgotSecretQuestion('');
      setForgotSecretAnswer('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      setAuthTab('login');
      
      Alert.alert('Success', 'Password has been reset successfully. You can now login with your new password.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to reset password');
    }
  };

  return (
    <Modal
      visible={rendered}
      transparent={true}
      animationType="none"
      onRequestClose={() => setAuthModalVisible(false)}
    >
      {rendered && (
        <Animated.View 
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#f5f5f5',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              overflow: 'hidden',
              transform: [{ translateY: authModalSlideAnim }],
              opacity: authModalSlideAnim.interpolate({
                inputRange: [0, 150, 300],
                outputRange: [1, 0.5, 0],
              }),
            }
          ]}
        >
          {/* Header */}
          <View style={authStyles.pinsModalHeader}>
            <Text style={[authStyles.pinsModalCampusTitle, { textAlign: 'center' }]}>
              {authTab === 'login' ? 'Login' : authTab === 'register' ? 'Register' : 'Forgot Password'}
            </Text>
            <TouchableOpacity 
              onPress={() => {
                // If on forgot password tab, go back to login
                if (authTab === 'forgot') {
                  setAuthTab('login');
                } else {
                  setAuthModalVisible(false);
                }
              }}
              style={{
                position: 'absolute',
                right: 20,
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="times" size={20} color="#333" />
            </TouchableOpacity>
          </View>
    
          {/* Tab Row - Only show Login and Register */}
          {authTab !== 'forgot' && (
            <>
              <View style={[authStyles.authTabRow, { backgroundColor: 'white', paddingHorizontal: 0, paddingBottom: 0 }]}>
                <TouchableOpacity 
                  onPress={() => setAuthTab('login')} 
                  style={[authStyles.authTabButton, authTab === 'login' && authStyles.authTabActive]}
                >
                  <Text style={authTab === 'login' ? authStyles.authTabActiveText : authStyles.authTabInactiveText}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setAuthTab('register')} 
                  style={[authStyles.authTabButton, authTab === 'register' && authStyles.authTabActive]}
                >
                  <Text style={authTab === 'register' ? authStyles.authTabActiveText : authStyles.authTabInactiveText}>Register</Text>
                </TouchableOpacity>
              </View>
              <View style={authStyles.lineDark}></View>
            </>
          )}
    
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView 
              style={{ flex: 1, paddingTop: 15 }}
              contentContainerStyle={{ paddingBottom: 20, alignItems: 'center' }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={authStyles.authContentWrapper}>
                
                {/* Logo - Show on Login and Register tabs */}
                {(authTab === 'login' || authTab === 'register') && (
                  <View style={authStyles.authLogoContainer}>
                    <Image 
                      source={require('../assets/logo-no-bg.png')} 
                      style={authStyles.authLogoImage}
                      resizeMode="contain"
                    />
                  </View>
                )}
                
                {/* Login Tab */}
                {authTab === 'login' && (
                  <View style={authStyles.authFormContainer}>
                    <View style={authStyles.authInputContainer}>
                      <Text style={authStyles.authInputLabel}>Username or Email</Text>
                      <TextInput
                        style={authStyles.authInput}
                        placeholder="Enter username or email"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholderTextColor="#999"
                      />
                    </View>
    
                    <View style={authStyles.authInputContainer}>
                      <Text style={authStyles.authInputLabel}>Password</Text>
                      <View style={authStyles.authPasswordContainer}>
                        <TextInput
                          style={[authStyles.authInput, { flex: 1, paddingRight: 40 }]}
                          placeholder="Enter password"
                          secureTextEntry={!showPassword}
                          value={password}
                          onChangeText={setPassword}
                          placeholderTextColor="#999"
                        />
                        <TouchableOpacity 
                          onPress={() => setShowPassword(!showPassword)} 
                          style={authStyles.authPasswordToggle}
                        >
                          <Icon name={showPassword ? 'eye' : 'eye-slash'} size={16} color="#666" />
                        </TouchableOpacity>
                      </View>
                    </View>
    
                    <TouchableOpacity 
                      style={[authStyles.authButton, { marginTop: 10 }]}
                      onPress={handleLogin}
                    >
                      <Text style={authStyles.authButtonText}>Login</Text>
                    </TouchableOpacity>
    
                    <View style={[authStyles.loginLinksContainer, { justifyContent: 'center' }]}>
                      <TouchableOpacity onPress={() => setAuthTab('forgot')}>
                        <Text style={authStyles.loginLink}>Forgot Password?</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
    
                {/* Register Tab */}
                {authTab === 'register' && (
                  <View style={authStyles.authFormContainer}>
                    <View style={authStyles.authInputContainer}>
                      <Text style={authStyles.authInputLabel}>Username</Text>
                      <TextInput
                        style={authStyles.authInput}
                        placeholder="Enter username (min 3 characters)"
                        value={regUsername}
                        onChangeText={setRegUsername}
                        autoCapitalize="none"
                        placeholderTextColor="#999"
                      />
                    </View>
    
                    <View style={authStyles.authInputContainer}>
                      <Text style={authStyles.authInputLabel}>Email</Text>
                      <TextInput
                        style={authStyles.authInput}
                        placeholder="Enter email address"
                        value={regEmail}
                        onChangeText={setRegEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholderTextColor="#999"
                      />
                    </View>
    
                    <View style={authStyles.authInputContainer}>
                      <Text style={authStyles.authInputLabel}>Password</Text>
                      <View style={authStyles.authPasswordContainer}>
                        <TextInput
                          style={[authStyles.authInput, { flex: 1, paddingRight: 40 }]}
                          placeholder="Enter password (min 6 chars, 1 capital, 1 symbol)"
                          secureTextEntry={!showRegPassword}
                          value={regPassword}
                          onChangeText={setRegPassword}
                          placeholderTextColor="#999"
                        />
                        <TouchableOpacity 
                          onPress={() => setShowRegPassword(!showRegPassword)} 
                          style={authStyles.authPasswordToggle}
                        >
                          <Icon name={showRegPassword ? 'eye' : 'eye-slash'} size={16} color="#666" />
                        </TouchableOpacity>
                      </View>
                    </View>
    
                    <View style={authStyles.authInputContainer}>
                      <Text style={authStyles.authInputLabel}>Confirm Password</Text>
                      <View style={authStyles.authPasswordContainer}>
                        <TextInput
                          style={[authStyles.authInput, { flex: 1, paddingRight: 40 }]}
                          placeholder="Confirm password"
                          secureTextEntry={!showRegConfirmPassword}
                          value={regConfirmPassword}
                          onChangeText={setRegConfirmPassword}
                          placeholderTextColor="#999"
                        />
                        <TouchableOpacity 
                          onPress={() => setShowRegConfirmPassword(!showRegConfirmPassword)} 
                          style={authStyles.authPasswordToggle}
                        >
                          <Icon name={showRegConfirmPassword ? 'eye' : 'eye-slash'} size={16} color="#666" />
                        </TouchableOpacity>
                      </View>
                    </View>
    
                    <View style={authStyles.authInputContainer}>
                      <Text style={authStyles.authInputLabel}>Secret Question</Text>
                      <TouchableOpacity
                        style={[authStyles.authInput, { justifyContent: 'center' }]}
                        onPress={() => setShowSecretQuestionPicker(!showSecretQuestionPicker)}
                      >
                        <Text style={{ color: regSecretQuestion ? '#333' : '#999' }}>
                          {regSecretQuestion || 'Select a secret question'}
                        </Text>
                      </TouchableOpacity>
                      {showSecretQuestionPicker && (
                        <ScrollView style={{ maxHeight: 150, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 6, marginTop: 4, backgroundColor: '#fff' }}>
                          {secretQuestions.map((question, idx) => (
                            <TouchableOpacity
                              key={idx}
                              style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}
                              onPress={() => {
                                setRegSecretQuestion(question);
                                setShowSecretQuestionPicker(false);
                              }}
                            >
                              <Text style={{ color: '#333', fontSize: 14 }}>{question}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
    
                    <View style={authStyles.authInputContainer}>
                      <Text style={authStyles.authInputLabel}>Secret Answer</Text>
                      <TextInput
                        style={authStyles.authInput}
                        placeholder="Enter secret answer (min 2 characters)"
                        value={regSecretAnswer}
                        onChangeText={setRegSecretAnswer}
                        placeholderTextColor="#999"
                      />
                    </View>
    
                    <TouchableOpacity 
                      style={[authStyles.authButton, { marginTop: 10 }]}
                      onPress={handleRegister}
                    >
                      <Text style={authStyles.authButtonText}>Register</Text>
                    </TouchableOpacity>
    
                    <View style={[authStyles.loginLinksContainer, { justifyContent: 'center' }]}>
                      <TouchableOpacity onPress={() => setAuthTab('login')}>
                        <Text style={authStyles.loginLink}>Already have an account? Login</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
    
                {/* Forgot Password Tab */}
                {authTab === 'forgot' && (
                  <View style={authStyles.authFormContainer}>
                    <View style={authStyles.authInputContainer}>
                      <Text style={authStyles.authInputLabel}>Email</Text>
                      <TextInput
                        style={authStyles.authInput}
                        placeholder="Enter your email address"
                        value={regEmail}
                        onChangeText={setRegEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholderTextColor="#999"
                      />
                    </View>
    
                    {!forgotSecretQuestion && (
                      <TouchableOpacity 
                        style={[authStyles.authButton, { marginTop: 10 }]}
                        onPress={handleForgotPasswordStep1}
                      >
                        <Text style={authStyles.authButtonText}>Get Secret Question</Text>
                      </TouchableOpacity>
                    )}
    
                    {forgotSecretQuestion && (
                      <>
                        <View style={authStyles.authInputContainer}>
                          <Text style={authStyles.authInputLabel}>Secret Question</Text>
                          <Text style={{ padding: 12, backgroundColor: '#f8f9fa', borderRadius: 6, color: '#333', marginBottom: 8 }}>
                            {forgotSecretQuestion}
                          </Text>
                        </View>
    
                        <View style={authStyles.authInputContainer}>
                          <Text style={authStyles.authInputLabel}>Secret Answer</Text>
                          <TextInput
                            style={authStyles.authInput}
                            placeholder="Enter your secret answer"
                            value={forgotSecretAnswer}
                            onChangeText={setForgotSecretAnswer}
                            placeholderTextColor="#999"
                          />
                        </View>
    
                        <View style={authStyles.authInputContainer}>
                          <Text style={authStyles.authInputLabel}>New Password</Text>
                          <View style={authStyles.authPasswordContainer}>
                            <TextInput
                              style={[authStyles.authInput, { flex: 1, paddingRight: 40 }]}
                              placeholder="Enter new password"
                              secureTextEntry={!showForgotPassword}
                              value={forgotNewPassword}
                              onChangeText={setForgotNewPassword}
                              placeholderTextColor="#999"
                            />
                            <TouchableOpacity 
                              onPress={() => setShowForgotPassword(!showForgotPassword)} 
                              style={authStyles.authPasswordToggle}
                            >
                              <Icon name={showForgotPassword ? 'eye' : 'eye-slash'} size={16} color="#666" />
                            </TouchableOpacity>
                          </View>
                        </View>
    
                        <View style={authStyles.authInputContainer}>
                          <Text style={authStyles.authInputLabel}>Confirm New Password</Text>
                          <View style={authStyles.authPasswordContainer}>
                            <TextInput
                              style={[authStyles.authInput, { flex: 1, paddingRight: 40 }]}
                              placeholder="Confirm new password"
                              secureTextEntry={!showForgotConfirmPassword}
                              value={forgotConfirmPassword}
                              onChangeText={setForgotConfirmPassword}
                              placeholderTextColor="#999"
                            />
                            <TouchableOpacity 
                              onPress={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)} 
                              style={authStyles.authPasswordToggle}
                            >
                              <Icon name={showForgotConfirmPassword ? 'eye' : 'eye-slash'} size={16} color="#666" />
                            </TouchableOpacity>
                          </View>
                        </View>
    
                        <TouchableOpacity 
                          style={[authStyles.authButton, { marginTop: 10 }]}
                          onPress={handleForgotPasswordStep2}
                        >
                          <Text style={authStyles.authButtonText}>Reset Password</Text>
                        </TouchableOpacity>
                      </>
                    )}
    
                    <View style={[authStyles.loginLinksContainer, { justifyContent: 'center' }]}>
                      <TouchableOpacity onPress={() => setAuthTab('login')}>
                        <Text style={authStyles.loginLink}>Back to Login</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      )}
    </Modal>
  );
};

export default AuthModal;
