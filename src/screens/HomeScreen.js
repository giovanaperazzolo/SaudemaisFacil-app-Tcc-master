
// HomeScreen.js
import React, { useState,  } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Modal, Button } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Logo from '../components/Logo';

const HomeScreen = ({ navigation }) => {
  const handlePress = (screen) => {
    navigation.navigate(screen);
  };

  const Icon = ({ name, label, screen }) => (
    <TouchableOpacity style={styles.iconWrapper} onPress={() => handlePress(screen)}>
      <FontAwesome name={name} size={32} color="#2e7d32" />
      <Text style={styles.iconLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Logo width={200} height={160} />
      <View style={styles.iconGrid}>
        <Icon name="medkit" label="Medicamentos" screen="Medicamentos" />
        <Icon name="bell" label="Lembrete" screen="Lembretes" />
        <Icon name="user" label="Perfil" screen="Perfil" />
        <Icon name="stethoscope" label="Receitas" screen="Receitas" />
        <Icon name="heartbeat" label="Pressão / Diabetes" screen="Pressão / Diabetes" />

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    alignItems: 'center',
    paddingTop: 20,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  menuText: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  iconWrapper: {
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40%',
    margin: 10,
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconLabel: {
    marginTop: 8,
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  profileIcon: {
    width: '80%', // Ajustar a largura conforme necessário
  },
  text: {
    fontSize: 18,
    marginBottom: 20,
  },
});

export default HomeScreen;
