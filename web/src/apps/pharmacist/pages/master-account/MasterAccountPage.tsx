/**
 * Master Account Management Page
 *
 * Main page for managing master pharmacy account:
 * - User management (sub-pharmacists, assistants)
 * - Pharmacy locations
 * - MFA setup
 * - Audit logs
 * - Account settings
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Button,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { UserList } from '../../components/user-management/UserList';
import { AddUserDialog } from '../../components/user-management/AddUserDialog';
import { LocationsList } from '../../components/user-management/LocationsList';
import { AuditLogTable } from '../../components/user-management/AuditLogTable';
import { AccountSettings } from '../../components/user-management/AccountSettings';
import { MFASetupDialog } from '../../components/user-management/MFASetupDialog';

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
      id={`master-account-tabpanel-${index}`}
      aria-labelledby={`master-account-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const MasterAccountPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [mfaSetupDialogOpen, setMFASetupDialogOpen] = useState(false);

  useEffect(() => {
    // Fetch initial data
    fetchUsers();
    fetchLocations();
    fetchAuditLogs();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/account/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch('/account/locations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setLocations(data.locations || []);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch('/account/audit-log', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setAuditLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddUser = async (userData: any) => {
    try {
      const response = await fetch('/account/users/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      if (data.success) {
        await fetchUsers();
        setAddUserDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to add user:', error);
    }
  };

  const handleUpdatePermissions = async (userId: string, permissions: string[]) => {
    try {
      const response = await fetch(`/account/users/${userId}/permissions`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions }),
      });
      const data = await response.json();
      if (data.success) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Failed to update permissions:', error);
    }
  };

  const handleSaveSettings = async (settings: any) => {
    try {
      const response = await fetch('/account/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (data.success) {
        // Show success message
        console.log('Settings saved successfully');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const handleSetupMFA = () => {
    setMFASetupDialogOpen(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Compte Principal
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleSetupMFA}
            data-testid="mfa-setup-button"
          >
            Configurer MFA
          </Button>
          {tabValue === 0 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddUserDialogOpen(true)}
              data-testid="add-user-button"
            >
              Ajouter Utilisateur
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="master account tabs">
          <Tab label="Utilisateurs" id="master-account-tab-0" />
          <Tab label="Emplacements" id="master-account-tab-1" />
          <Tab label="Journal d'audit" id="master-account-tab-2" />
          <Tab label="Paramètres" id="master-account-tab-3" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <UserList
          users={users}
          onUpdatePermissions={handleUpdatePermissions}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <LocationsList locations={locations} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <AuditLogTable logs={auditLogs} />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <AccountSettings onSave={handleSaveSettings} />
      </TabPanel>

      {/* Dialogs */}
      <AddUserDialog
        open={addUserDialogOpen}
        onClose={() => setAddUserDialogOpen(false)}
        onAdd={handleAddUser}
      />

      <MFASetupDialog
        open={mfaSetupDialogOpen}
        onClose={() => setMFASetupDialogOpen(false)}
      />
    </Container>
  );
};

export default MasterAccountPage;
