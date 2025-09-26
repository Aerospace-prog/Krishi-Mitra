import { SignedIn, SignedOut, useAuth, useSignUp } from '@clerk/clerk-expo';
import { Redirect } from 'expo-router';
import { View, Text } from '@/components/Themed';
import { useState } from 'react';
import { StyleSheet, TextInput, Pressable } from 'react-native';

export default function SignUpScreen() {
  const { isSignedIn } = useAuth();
  const { signUp, setActive, isLoaded } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (isSignedIn) return <Redirect href="/(tabs)" />;

  async function onSubmit() {
    setError(null);
    if (!isLoaded) return;
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    } catch (e: any) {
      setError(e?.errors?.[0]?.message || 'Sign up failed');
    }
  }

  // For brevity, skip code entry screen; in a full app add code verification flow.

  return (
    <SignedOut>
      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        {error && <Text style={styles.error}>{error}</Text>}
        <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
        <Pressable style={styles.primary} onPress={onSubmit}><Text style={styles.primaryText}>Sign Up</Text></Pressable>
      </View>
    </SignedOut>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: '800' },
  input: { width: '90%', padding: 12, borderWidth: 1, borderRadius: 8, borderColor: '#ccc' },
  primary: { backgroundColor: '#2e7d32', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  primaryText: { color: '#fff', fontWeight: '700' },
  error: { color: '#c62828' },
});


