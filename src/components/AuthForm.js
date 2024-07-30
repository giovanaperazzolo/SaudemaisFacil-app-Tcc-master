import React from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';

export default function AuthForm({ isNewUser, setLogin, login, setPassword, password, handleLogin, setFullName, fullName }) {
  return (
    <View style={styles.container}>
      {isNewUser && (
        <TextInput
          placeholder="Nome completo"
          style={styles.input}
          onChangeText={setFullName}
          value={fullName}
        />
      )}
      <TextInput
        placeholder="Login"
        style={styles.input}
        onChangeText={setLogin}
        value={login}
      />
      <TextInput
        placeholder="Senha"
        secureTextEntry={true}
        style={styles.input}
        onChangeText={setPassword}
        value={password}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
    padding: 10,
  },
});
