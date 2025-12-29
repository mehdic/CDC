/**
 * Settings Page
 * User settings, preferences, security, and account management
 */

import React, { useState } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Delete as DeleteIcon,
  VpnKey as VpnKeyIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const Settings: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [tabValue, setTabValue] = useState(0);
  const [mfaDialogOpen, setMfaDialogOpen] = useState(false);

  // Profile settings
  const [profile, setProfile] = useState({
    firstName: 'Dr. Martin',
    lastName: 'Dupont',
    email: 'martin.dupont@metapharm.ch',
    phone: '+41 79 123 45 67',
    language: 'fr',
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    prescriptionAlerts: true,
    inventoryAlerts: true,
    deliveryUpdates: true,
    marketingEmails: false,
  });

  // Security settings
  const [security, setSecurity] = useState({
    mfaEnabled: false,
    sessionTimeout: 30,
    loginAlerts: true,
  });

  const handleSaveProfile = () => {
    // TODO: API call to save profile
    enqueueSnackbar('Profile settings saved successfully', { variant: 'success' });
  };

  const handleSaveNotifications = () => {
    // TODO: API call to save notification preferences
    enqueueSnackbar('Notification settings saved successfully', { variant: 'success' });
  };

  const handleSaveSecurity = () => {
    // TODO: API call to save security settings
    enqueueSnackbar('Security settings saved successfully', { variant: 'success' });
  };

  const handleEnableMFA = () => {
    setMfaDialogOpen(true);
  };

  const handleChangePassword = () => {
    // TODO: Navigate to password change flow
    enqueueSnackbar('Password change flow coming soon', { variant: 'info' });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 'bold' }}>
          <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage your account, preferences, and security settings
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          aria-label="settings tabs"
        >
          <Tab
            icon={<PersonIcon />}
            iconPosition="start"
            label="Profile"
            id="settings-tab-0"
          />
          <Tab
            icon={<NotificationsIcon />}
            iconPosition="start"
            label="Notifications"
            id="settings-tab-1"
          />
          <Tab
            icon={<SecurityIcon />}
            iconPosition="start"
            label="Security"
            id="settings-tab-2"
          />
          <Tab
            icon={<LanguageIcon />}
            iconPosition="start"
            label="Preferences"
            id="settings-tab-3"
          />
        </Tabs>
      </Paper>

      {/* Profile Tab */}
      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>

            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={profile.language}
                    label="Language"
                    onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                  >
                    <MenuItem value="fr">Français</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="de">Deutsch</MenuItem>
                    <MenuItem value="it">Italiano</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Button variant="contained" onClick={handleSaveProfile}>
                  Save Profile
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Notifications Tab */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Notification Preferences
            </Typography>

            <List>
              <ListItem>
                <ListItemText
                  primary="Email Notifications"
                  secondary="Receive notifications via email"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={notifications.emailNotifications}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        emailNotifications: e.target.checked,
                      })
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>

              <Divider />

              <ListItem>
                <ListItemText
                  primary="SMS Notifications"
                  secondary="Receive notifications via SMS"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={notifications.smsNotifications}
                    onChange={(e) =>
                      setNotifications({ ...notifications, smsNotifications: e.target.checked })
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>

              <Divider />

              <ListItem>
                <ListItemText
                  primary="Push Notifications"
                  secondary="Receive push notifications on your device"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={notifications.pushNotifications}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        pushNotifications: e.target.checked,
                      })
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>

              <Divider />

              <ListItem>
                <ListItemText
                  primary="Prescription Alerts"
                  secondary="Alerts for new prescriptions"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={notifications.prescriptionAlerts}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        prescriptionAlerts: e.target.checked,
                      })
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>

              <Divider />

              <ListItem>
                <ListItemText
                  primary="Inventory Alerts"
                  secondary="Low stock and expiration alerts"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={notifications.inventoryAlerts}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        inventoryAlerts: e.target.checked,
                      })
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>

              <Divider />

              <ListItem>
                <ListItemText
                  primary="Delivery Updates"
                  secondary="Updates on delivery status"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={notifications.deliveryUpdates}
                    onChange={(e) =>
                      setNotifications({ ...notifications, deliveryUpdates: e.target.checked })
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>

              <Divider />

              <ListItem>
                <ListItemText
                  primary="Marketing Emails"
                  secondary="Promotional emails and updates"
                />
                <ListItemSecondaryAction>
                  <Switch
                    checked={notifications.marketingEmails}
                    onChange={(e) =>
                      setNotifications({ ...notifications, marketingEmails: e.target.checked })
                    }
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>

            <Box sx={{ mt: 3 }}>
              <Button variant="contained" onClick={handleSaveNotifications}>
                Save Notification Settings
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Security Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <ShieldIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Multi-Factor Authentication (MFA)
                </Typography>

                <Alert severity={security.mfaEnabled ? 'success' : 'warning'} sx={{ my: 2 }}>
                  {security.mfaEnabled
                    ? 'MFA is enabled for your account. Your account is protected with an additional layer of security.'
                    : 'MFA is not enabled. We strongly recommend enabling MFA to protect your account.'}
                </Alert>

                <Button
                  variant={security.mfaEnabled ? 'outlined' : 'contained'}
                  color={security.mfaEnabled ? 'error' : 'primary'}
                  onClick={handleEnableMFA}
                  startIcon={<VpnKeyIcon />}
                >
                  {security.mfaEnabled ? 'Disable MFA' : 'Enable MFA'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Password Settings
                </Typography>

                <Box sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Last changed: 45 days ago
                  </Typography>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    For security, we recommend changing your password every 90 days.
                  </Alert>
                </Box>

                <Button variant="contained" onClick={handleChangePassword} startIcon={<VpnKeyIcon />}>
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Session Settings
                </Typography>

                <FormControl fullWidth sx={{ my: 2 }}>
                  <InputLabel>Session Timeout</InputLabel>
                  <Select
                    value={security.sessionTimeout}
                    label="Session Timeout"
                    onChange={(e) =>
                      setSecurity({ ...security, sessionTimeout: Number(e.target.value) })
                    }
                  >
                    <MenuItem value={15}>15 minutes</MenuItem>
                    <MenuItem value={30}>30 minutes</MenuItem>
                    <MenuItem value={60}>1 hour</MenuItem>
                    <MenuItem value={120}>2 hours</MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch
                      checked={security.loginAlerts}
                      onChange={(e) =>
                        setSecurity({ ...security, loginAlerts: e.target.checked })
                      }
                    />
                  }
                  label="Send email alerts for new logins"
                />

                <Box sx={{ mt: 3 }}>
                  <Button variant="contained" onClick={handleSaveSecurity}>
                    Save Security Settings
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="error">
                  Danger Zone
                </Typography>

                <Alert severity="error" sx={{ my: 2 }}>
                  Deleting your account is permanent and cannot be undone. All your data will be
                  permanently removed.
                </Alert>

                <Button variant="outlined" color="error" startIcon={<DeleteIcon />}>
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Preferences Tab */}
      <TabPanel value={tabValue} index={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Application Preferences
            </Typography>

            <Alert severity="info" sx={{ my: 2 }}>
              Additional preference settings coming soon, including theme customization, date/time
              formats, and display options.
            </Alert>

            <FormControl fullWidth sx={{ mt: 3 }}>
              <InputLabel>Language</InputLabel>
              <Select value={profile.language} label="Language" disabled>
                <MenuItem value="fr">Français</MenuItem>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="de">Deutsch</MenuItem>
                <MenuItem value="it">Italiano</MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>
      </TabPanel>

      {/* MFA Setup Dialog */}
      <Dialog open={mfaDialogOpen} onClose={() => setMfaDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <VpnKeyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          {security.mfaEnabled ? 'Disable' : 'Enable'} Multi-Factor Authentication
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            {security.mfaEnabled
              ? 'Disabling MFA will make your account less secure. Are you sure you want to continue?'
              : 'MFA adds an extra layer of security to your account. You will need to scan a QR code with your authenticator app.'}
          </Alert>

          {!security.mfaEnabled && (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body2" gutterBottom>
                Scan this QR code with your authenticator app:
              </Typography>
              <Box
                sx={{
                  width: 200,
                  height: 200,
                  bgcolor: 'grey.200',
                  mx: 'auto',
                  my: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  [QR Code Placeholder]
                </Typography>
              </Box>
              <TextField
                fullWidth
                label="Verification Code"
                placeholder="Enter 6-digit code"
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMfaDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={security.mfaEnabled ? 'error' : 'primary'}
            onClick={() => {
              setSecurity({ ...security, mfaEnabled: !security.mfaEnabled });
              setMfaDialogOpen(false);
              enqueueSnackbar(
                `MFA ${security.mfaEnabled ? 'disabled' : 'enabled'} successfully`,
                { variant: 'success' }
              );
            }}
          >
            {security.mfaEnabled ? 'Disable' : 'Enable'} MFA
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Settings;
