/**
 * Profile Screen
 * Nurse profile and settings
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { nurseApiClient } from '../../services/nurseApiClient';

export const ProfileScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { nurse } = useSelector((state: RootState) => state.auth);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await nurseApiClient.logout();
              dispatch(logout());
            } catch (error) {
              console.error('Logout error:', error);
              dispatch(logout());
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (!nurse) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No nurse profile found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {nurse.firstName[0]}{nurse.lastName[0]}
          </Text>
        </View>
        <Text style={styles.name}>{nurse.firstName} {nurse.lastName}</Text>
        <Text style={styles.email}>{nurse.email}</Text>
        {nurse.specialization && (
          <View style={styles.specializationBadge}>
            <Text style={styles.specializationText}>{nurse.specialization}</Text>
          </View>
        )}
      </View>

      {/* Credentials Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Credentials</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>HIN e-ID:</Text>
          <Text style={styles.infoValue}>{nurse.hinId}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>License Number:</Text>
          <Text style={styles.infoValue}>{nurse.licenseNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Facility:</Text>
          <Text style={styles.infoValue}>{nurse.facility}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Department:</Text>
          <Text style={styles.infoValue}>{nurse.department}</Text>
        </View>
      </View>

      {/* Security Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>MFA Status:</Text>
          <View style={[
            styles.statusBadge,
            nurse.mfaEnabled ? styles.enabledBadge : styles.disabledBadge,
          ]}>
            <Text style={styles.statusText}>
              {nurse.mfaEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Verification:</Text>
          <View style={[
            styles.statusBadge,
            nurse.verified ? styles.enabledBadge : styles.disabledBadge,
          ]}>
            <Text style={styles.statusText}>
              {nurse.verified ? 'Verified' : 'Pending'}
            </Text>
          </View>
        </View>
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Push Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Sound Alerts</Text>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
          />
        </View>
      </View>

      {/* Current Shift */}
      {nurse.shiftSchedule?.currentShift && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Shift</Text>
          <View style={styles.shiftCard}>
            <Text style={styles.shiftDepartment}>
              {nurse.shiftSchedule.currentShift.department}
            </Text>
            <Text style={styles.shiftTime}>
              {new Date(nurse.shiftSchedule.currentShift.startTime).toLocaleTimeString()} - {' '}
              {new Date(nurse.shiftSchedule.currentShift.endTime).toLocaleTimeString()}
            </Text>
            <Text style={styles.shiftPatients}>
              Assigned Patients: {nurse.shiftSchedule.currentShift.assignedPatients.length}
            </Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Change Password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Help & Support</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#FFF',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#DDE2E8',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3498DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FFF',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  specializationBadge: {
    backgroundColor: '#27AE60',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  specializationText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFF',
    padding: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7FA',
  },
  infoLabel: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C3E50',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  enabledBadge: {
    backgroundColor: '#27AE60',
  },
  disabledBadge: {
    backgroundColor: '#95A5A6',
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F7FA',
  },
  settingLabel: {
    fontSize: 16,
    color: '#2C3E50',
  },
  shiftCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDE2E8',
  },
  shiftDepartment: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  shiftTime: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  shiftPatients: {
    fontSize: 14,
    color: '#3498DB',
  },
  actionButton: {
    backgroundColor: '#FFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DDE2E8',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#3498DB',
    textAlign: 'center',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#E74C3C',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
    marginTop: 40,
  },
});

export default ProfileScreen;
