import { SignedIn, SignedOut, useAuth, useSignIn } from '@clerk/clerk-expo';
import { Link, Redirect } from 'expo-router';
import { View, Text } from '@/components/Themed';
import { useState } from 'react';
import { StyleSheet, TextInput, Pressable } from 'react-native';

export default function SignInScreen() {
  const { isSignedIn } = useAuth();
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (isSignedIn) return <Redirect href="/(tabs)" />;

  async function onSubmit() {
    setError(null);
    if (!isLoaded) return;
    try {
      const res = await signIn.create({ identifier: email, password });
      await setActive({ session: res.createdSessionId });
    } catch (e: any) {
      setError(e?.errors?.[0]?.message || 'Sign in failed');
    }
  }

  return (
    <SignedOut>
      <View style={styles.container}>
        <Text style={styles.title}>Sign In</Text>
        {error && <Text style={styles.error}>{error}</Text>}
        <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
        <Pressable style={styles.primary} onPress={onSubmit}><Text style={styles.primaryText}>Sign In</Text></Pressable>
        <View style={{ height: 12 }} />
        <Link href="/(public)/sign-up">Create an account</Link>
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


