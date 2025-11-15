/**
 * Master Account Management Page
 * Pharmacist master account management for users, permissions, roles, audit logs, etc.
 */

import React, { useState, useEffect } from 'react';
import userService, { User, Role, AuditLog, Location, AccountSettings } from '@shared/services/userService';
import './MasterAccountPage.css';

/**
 * Success toast component
 */
const SuccessToast: React.FC<{ message: string; visible: boolean }> = ({
  message,
  visible,
}) => {
  if (!visible) return null;

  return (
    <div
      data-testid="success-toast"
      className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded"
    >
      {message}
    </div>
  );
};

/**
 * User list component
 */
const UserList: React.FC<{
  users: User[];
  onSelectUser: (user: User) => void;
  onPermissionsClick: (user: User) => void;
}> = ({ users, onSelectUser, onPermissionsClick: onPermissionsClick }) => {
  return (
    <div data-testid="user-list" className="user-list">
      <h3 className="text-lg font-semibold mb-4">Utilisateurs / Users</h3>
      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            data-testid={`user-${user.id}`}
            className="user-item p-3 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
            onClick={() => onSelectUser(user)}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  data-testid="role-badge"
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                >
                  {user.role}
                </span>
                <button
                  data-testid={`edit-permissions-${user.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPermissionsClick(user);
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300"
                >
                  Permissions
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Add user dialog component
 */
const AddUserDialog: React.FC<{
  onUserAdded: () => void;
  roles: Role[];
}> = ({ onUserAdded, roles: _roles }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'assistant',
    permissions: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddUser = async () => {
    try {
      setLoading(true);
      setError('');

      await userService.createUser(formData);

      // Reset form
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        role: 'assistant',
        permissions: [],
      });
      setOpen(false);
      onUserAdded();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const availablePermissions = [
    'prescriptions',
    'inventory',
    'consultations',
    'deliveries',
    'analytics',
    'marketing',
  ];

  return (
    <div>
      {!open ? (
        <button
          data-testid="add-user-button"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => setOpen(true)}
        >
          Ajouter utilisateur / Add User
        </button>
      ) : (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">Ajouter un nouvel utilisateur / Add New User</h2>
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="user@pharmacy.ch"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Prénom / First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nom / Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Rôle / Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="assistant">Assistant</option>
                  <option value="pharmacist">Pharmacist</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Permissions
                </label>
                <div className="space-y-2">
                  {availablePermissions.map((perm) => (
                    <label key={perm} className="flex items-center">
                      <input
                        type="checkbox"
                        data-testid={`permission-${perm}`}
                        checked={formData.permissions.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              permissions: [...formData.permissions, perm],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              permissions: formData.permissions.filter(
                                (p) => p !== perm
                              ),
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm capitalize">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleAddUser}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? 'Création...' : 'Créer / Create'}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                >
                  Fermer / Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Permissions dialog component
 */
const PermissionsDialog: React.FC<{
  user: User | null;
  onClose: () => void;
  onSave: (userId: string, permissions: string[]) => void;
}> = ({ user, onClose, onSave }) => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setPermissions(user.permissions || []);
    }
  }, [user]);

  const availablePermissions = [
    'prescriptions',
    'inventory',
    'consultations',
    'deliveries',
    'analytics',
    'marketing',
  ];

  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);
      await onSave(user.id, permissions);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">
          Modifier permissions / Edit Permissions for {user.firstName}{' '}
          {user.lastName}
        </h2>

        <div className="space-y-3 mb-6">
          {availablePermissions.map((perm) => (
            <label key={perm} className="flex items-center">
              <input
                type="checkbox"
                data-testid={`permission-${perm}`}
                checked={permissions.includes(perm)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setPermissions([...permissions, perm]);
                  } else {
                    setPermissions(permissions.filter((p) => p !== perm));
                  }
                }}
                className="mr-2"
              />
              <span className="text-sm capitalize">{perm}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer / Save'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            Fermer / Close
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Audit log component
 */
const AuditLogTab: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState('');

  const loadAuditLog = async () => {
    try {
      setLoading(true);
      const filters = selectedUser ? { user: selectedUser } : undefined;
      const data = await userService.getAuditLog(filters);
      setLogs(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load audit log';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Filtrer par utilisateur / Filter by User
        </label>
        <select
          data-testid="filter-by-user"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded"
        >
          <option value="">Tous les utilisateurs / All Users</option>
        </select>
      </div>

      {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table
          data-testid="audit-log-table"
          className="w-full border-collapse border border-gray-300"
        >
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Action</th>
              <th className="border border-gray-300 p-2 text-left">User</th>
              <th className="border border-gray-300 p-2 text-left">Date</th>
              <th className="border border-gray-300 p-2 text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-2">{log.action}</td>
                <td className="border border-gray-300 p-2">{log.user}</td>
                <td className="border border-gray-300 p-2">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="border border-gray-300 p-2">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

/**
 * Locations tab component
 */
const LocationsTab: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const data = await userService.getLocations();
      setLocations(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load locations';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="p-3 bg-red-100 text-red-700 rounded mb-4">{error}</div>}

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div data-testid="locations-list" className="space-y-3">
          {locations.map((location) => (
            <div
              key={location.id}
              className="p-4 border border-gray-200 rounded"
            >
              <h4 className="font-semibold">{location.name}</h4>
              <p className="text-sm text-gray-600">{location.address}</p>
              {location.phone && (
                <p className="text-sm text-gray-600">{location.phone}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Settings tab component
 */
const SettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<AccountSettings>({
    pharmacyName: '',
    phone: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      await userService.updateSettings(settings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-md">
      {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      <div>
        <label className="block text-sm font-medium mb-1">
          Nom de la pharmacie / Pharmacy Name
        </label>
        <input
          type="text"
          value={settings.pharmacyName || ''}
          onChange={(e) =>
            setSettings({ ...settings, pharmacyName: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Téléphone / Phone</label>
        <input
          type="tel"
          value={settings.phone || ''}
          onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={settings.email || ''}
          onChange={(e) => setSettings({ ...settings, email: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Enregistrement...' : 'Enregistrer / Save'}
      </button>
    </div>
  );
};

/**
 * MFA Setup Component
 */
const MFASetup: React.FC = () => {
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetupMFA = async () => {
    try {
      setLoading(true);
      const result = await userService.setupMFA();
      setQrCode(result.qrCodeUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to setup MFA';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      {qrCode ? (
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Scannez ce code QR avec votre application d&apos;authentification
          </p>
          <img
            data-testid="mfa-qr-code"
            src={qrCode}
            alt="MFA QR Code"
            className="w-64 h-64 border-2 border-gray-300 p-2"
          />
        </div>
      ) : (
        <button
          onClick={handleSetupMFA}
          disabled={loading}
          data-testid="setup-mfa-button"
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? 'Configuration...' : 'Configurer MFA / Setup MFA'}
        </button>
      )}
    </div>
  );
};

/**
 * Master Account Page Component
 */
const MasterAccountPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [usersData, rolesData] = await Promise.all([
        userService.getUsers(),
        userService.getRoles(),
      ]);

      setUsers(usersData);
      setRoles(rolesData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    await loadData();
    setSuccessMessage('User added successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handlePermissionsSave = async (userId: string, permissions: string[]) => {
    try {
      await userService.updatePermissions(userId, permissions);
      setSuccessMessage('Permissions updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      await loadData();
      setSelectedUser(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update permissions';
      setError(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">
        Compte Principal / Master Account
      </h1>
      <p className="text-gray-600 mb-6">
        Gérez les utilisateurs, permissions, et paramètres de votre pharmacie
      </p>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded mb-6">{error}</div>
      )}

      <SuccessToast visible={!!successMessage} message={successMessage} />

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Utilisateurs / Users</h2>
          <div className="flex justify-end mb-4">
            <AddUserDialog onUserAdded={handleAddUser} roles={roles} />
          </div>
          <UserList
            users={users}
            onSelectUser={(user) => setSelectedUser(user)}
            onPermissionsClick={(user) => setSelectedUser(user)}
          />
        </div>

        <div className="border-t pt-6">
          <h2 className="text-2xl font-semibold mb-4">Emplacements / Locations</h2>
          <LocationsTab />
        </div>

        <div className="border-t pt-6">
          <h2 className="text-2xl font-semibold mb-4">Journal d&apos;Audit / Audit Log</h2>
          <AuditLogTab />
        </div>

        <div className="border-t pt-6">
          <h2 className="text-2xl font-semibold mb-4">Paramètres / Settings</h2>
          <SettingsTab />
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-4">
              Authentification Multi-Facteurs / MFA
            </h3>
            <MFASetup />
          </div>
        </div>
      </div>

      <PermissionsDialog
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onSave={handlePermissionsSave}
      />
    </div>
  );
};

export default MasterAccountPage;
