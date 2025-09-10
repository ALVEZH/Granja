import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useLogin } from '../hooks/useLogin';
import Modal from 'react-native-modal';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login, loading } = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);

  // Estado para mostrar el modal de alerta personalizada
  const [modalAlerta, setModalAlerta] = useState({ visible: false, tipo: 'info', mensaje: '' });

  const toggleSecureText = () => setSecureText(!secureText);

  const mostrarAlerta = (tipo: 'exito' | 'error', mensaje: string, callback?: () => void) => {
    setModalAlerta({ visible: true, tipo, mensaje });
    if (callback) {
      setTimeout(() => {
        setModalAlerta({ visible: false, tipo: 'info', mensaje: '' });
        callback();
      }, 1500);
    }
  };

  const handleLogin = async () => {
  if (!email.trim() || !password.trim()) {
    mostrarAlerta('error', 'Completa todos los campos para continuar.');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    mostrarAlerta('error', 'El formato del correo electrónico es incorrecto.');
    return;
  }

  if (password.length < 3) {
    mostrarAlerta('error', 'La contraseña debe tener al menos 6 caracteres.');
    return;
  }

  try {
    const usuario = await login(email, password);

    if (!usuario) {
      mostrarAlerta('error', 'Correo o contraseña incorrectos.');
      return;
    }

    // Redirigir según rol
    if (usuario.Rol === 'admin') {
      // Usuario admin: abre menú hamburguesa
      mostrarAlerta('exito', 'Bienvenido, administrador.', () =>
        navigation.replace('MainApp', { screen: 'LotesScreen' }) // pantalla inicial admin
      );
    } else {
      // Usuario normal: abre stack normal
      mostrarAlerta('exito', 'Bienvenido.', () =>
        navigation.replace('SeleccionSeccion')
      );
    }

  } catch (error) {
    mostrarAlerta('error', 'No se pudo validar el usuario. Intenta más tarde.');
  }
};


  
  return (
    <SafeAreaView style={styles.container}>
      {/* Modal personalizado para alertas de login */}
      <Modal isVisible={modalAlerta.visible} onBackdropPress={() => setModalAlerta({ visible: false, tipo: 'info', mensaje: '' })}>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 28, alignItems: 'center', minWidth: 260 }}>
          {modalAlerta.tipo === 'exito' ? (
            <Ionicons name="checkmark-circle-outline" size={48} color="#1db954" style={{ marginBottom: 12 }} />
          ) : (
            <Ionicons name="close-circle-outline" size={48} color="#e53935" style={{ marginBottom: 12 }} />
          )}
          <Text style={{ fontWeight: 'bold', fontSize: 20, marginBottom: 10, color: '#2a3a4b', textAlign: 'center' }}>{modalAlerta.tipo === 'exito' ? '¡Éxito!' : 'Error'}</Text>
          <Text style={{ color: '#666', fontSize: 15, marginBottom: 8, textAlign: 'center' }}>{modalAlerta.mensaje}</Text>
          <TouchableOpacity
            style={{ backgroundColor: modalAlerta.tipo === 'exito' ? '#1db954' : '#e53935', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 10, minWidth: 120 }}
            onPress={() => setModalAlerta({ visible: false, tipo: 'info', mensaje: '' })}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>OK</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.title}>Bienvenido</Text>
            <Text style={styles.subtitle}>Inicia sesión para acceder</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                style={styles.input}
                placeholder="correo@ejemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={styles.inputPassword}
                  placeholder="••••••••"
                  secureTextEntry={secureText}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={toggleSecureText} style={styles.iconRight}>
                  <Ionicons name={secureText ? 'eye-off' : 'eye'} size={20} color="#555" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eaf1f9' },
  keyboard: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a202c',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#4a5568',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 14, color: '#4a5568', marginBottom: 6 },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#cbd5e0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputWithIcon: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputPassword: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#cbd5e0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingRight: 40,
    fontSize: 16,
  },
  iconRight: {
    position: 'absolute',
    right: 12,
    top: '30%',
  },
  button: {
    backgroundColor: '#749BC2',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    width: '50%',
    alignSelf: 'center',
    marginBottom: 20,
    shadowColor: '#5a67d8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 40,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  link: {
    color: '#4c51bf',
    textAlign: 'center',
    marginTop: 20,
    textDecorationLine: 'underline',
    fontSize: 15,
  },
});
