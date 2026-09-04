import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../lib/theme/theme';
import { useTheme as useThemeContext } from '../../lib/theme/theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { authApi } from '../../lib/api/auth';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, setThemeMode, setTextScale } = useThemeContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [nameError, setNameError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({ current: '', new: '', confirm: '' });

  const handleUpdateProfile = async () => {
    setNameError('');
    setPasswordErrors({ current: '', new: '', confirm: '' });
    
    if (!name) {
      setNameError('Name is required');
      return;
    }

    const wantsPasswordChange = currentPassword || newPassword || confirmPassword;
    if (wantsPasswordChange) {
      let hasError = false;
      if (!currentPassword) {
        setPasswordErrors(prev => ({ ...prev, current: 'Current password is required' }));
        hasError = true;
      }
      if (!newPassword) {
        setPasswordErrors(prev => ({ ...prev, new: 'New password is required' }));
        hasError = true;
      } else if (newPassword.length < 8) {
        setPasswordErrors(prev => ({ ...prev, new: 'Password must be at least 8 characters' }));
        hasError = true;
      }
      if (newPassword !== confirmPassword) {
        setPasswordErrors(prev => ({ ...prev, confirm: 'Passwords do not match' }));
        hasError = true;
      }
      if (hasError) return;
    }

    setIsSubmitting(true);
    try {
      await authApi.updateProfile({ name });
      if (wantsPasswordChange) {
        await authApi.changePassword({ current_password: currentPassword, new_password: newPassword });
      }
      setIsEditing(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', wantsPasswordChange ? 'Profile and password updated successfully' : 'Profile updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await authApi.deleteAccount();
              await logout();
              router.replace('/(auth)/login');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text, fontSize: theme.typography.sizes['2xl'] }]}>
            Profile
          </Text>
        </View>

        <Card style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
              Email
            </Text>
            <Text style={[styles.value, { color: theme.colors.text, fontSize: theme.typography.sizes.md }]}>
              {user?.email}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
              Role
            </Text>
            <Text style={[styles.value, { color: theme.colors.text, fontSize: theme.typography.sizes.md }]}>
              {user?.role}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
              Verified
            </Text>
            <Text style={[styles.value, { color: user?.is_verified ? theme.colors.success : theme.colors.warning, fontSize: theme.typography.sizes.md }]}>
              {user?.is_verified ? 'Yes' : 'No'}
            </Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: theme.typography.sizes.lg }]}>
            Personal Information
          </Text>

          {isEditing ? (
            <>
              <Input
                label="Full Name"
                value={name}
                onChangeText={setName}
                error={nameError}
              />
              <Input
                label="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                error={passwordErrors.current}
              />
              <Input
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                error={passwordErrors.new}
              />
              <Input
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                error={passwordErrors.confirm}
              />
              <View style={styles.buttonRow}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setIsEditing(false);
                    setName(user?.name || '');
                    setNameError('');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordErrors({ current: '', new: '', confirm: '' });
                  }}
                  variant="outline"
                  style={styles.cancelButton}
                />
                <Button
                  title="Save"
                  onPress={handleUpdateProfile}
                  loading={isSubmitting}
                  style={styles.saveButton}
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
                  Name
                </Text>
                <Text style={[styles.value, { color: theme.colors.text, fontSize: theme.typography.sizes.md }]}>
                  {user?.name}
                </Text>
              </View>
              <Button
                title="Edit Profile"
                onPress={() => setIsEditing(true)}
                variant="outline"
                style={styles.editButton}
              />
            </>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: theme.typography.sizes.lg }]}>
            Appearance
          </Text>

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
              Theme
            </Text>
            <View style={styles.themeButtons}>
              {(['light', 'dark', 'system'] as const).map((mode) => (
                <Button
                  key={mode}
                  title={mode.charAt(0).toUpperCase() + mode.slice(1)}
                  onPress={() => setThemeMode(mode)}
                  variant={theme.mode === mode ? 'primary' : 'outline'}
                  size="small"
                  style={styles.themeButton}
                />
              ))}
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.label, { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.sm }]}>
              Text Size
            </Text>
            <View style={styles.textScaleButtons}>
              {([0.8, 1.0, 1.2] as const).map((scale) => (
                <Button
                  key={scale}
                  title={`${scale}x`}
                  onPress={() => setTextScale(scale)}
                  variant={theme.typography.scale === scale ? 'primary' : 'outline'}
                  size="small"
                  style={styles.themeButton}
                />
              ))}
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, fontSize: theme.typography.sizes.lg }]}>
            Account Actions
          </Text>

          <Button
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            style={styles.actionButton}
          />

          <Button
            title="Delete Account"
            onPress={handleDeleteAccount}
            variant="danger"
            style={styles.deleteButton}
          />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontWeight: 'bold',
  },
  card: {
    margin: 24,
    marginTop: 0,
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 4,
  },
  value: {
    fontWeight: '500',
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  editButton: {
    marginTop: 16,
  },
  themeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  textScaleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    flex: 1,
  },
  actionButton: {
    marginBottom: 12,
  },
  deleteButton: {
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  subSectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
});
