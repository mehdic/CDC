import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface PharmacyProfile {
  id: string;
  pharmacyId: string;
  name: string;
  description: string | null;
  address: {
    street?: string;
    city?: string;
    postalCode?: string;
    canton?: string;
    country?: string;
  } | null;
  phone: string | null;
  email: string | null;
  fax: string | null;
  whatsapp: string | null;
  website: string | null;
  services: any | null;
  published: boolean;
}

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4003';

export const PharmacyProfileManager: React.FC = () => {
  const [profile, setProfile] = useState<PharmacyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/pharmacy/page`);
      if (response.data.success) {
        const profileData = response.data.pharmacy;
        setProfile(profileData);
        setFormData({
          name: profileData.name || '',
          description: profileData.description || '',
          phone: profileData.phone || '',
          address: profileData.address ?
            `${profileData.address.street || ''}, ${profileData.address.city || ''}, ${profileData.address.postalCode || ''}`.trim() : '',
        });
      }
    } catch (error) {
      console.error('Failed to load pharmacy profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      setFormData({
        name: profile.name || '',
        description: profile.description || '',
        phone: profile.phone || '',
        address: profile.address ?
          `${profile.address.street || ''}, ${profile.address.city || ''}, ${profile.address.postalCode || ''}`.trim() : '',
      });
    }
  };

  const handleSave = async () => {
    try {
      const response = await axios.put(`${API_BASE}/pharmacy/page/update`, {
        name: formData.name,
        description: formData.description,
        phone: formData.phone,
        address: formData.address,
      });

      if (response.data.success) {
        setProfile(response.data.pharmacy);
        setEditing(false);

        // Show success toast
        const toast = document.createElement('div');
        toast.setAttribute('data-testid', 'success-toast');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded shadow-lg';
        toast.textContent = 'Profile updated successfully';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    }
  };

  const handlePublish = async () => {
    if (!confirm('Publish pharmacy page? It will be visible to patients.')) return;

    try {
      const response = await axios.post(`${API_BASE}/pharmacy/page/publish`);
      if (response.data.success) {
        setProfile(response.data.pharmacy);

        const confirmation = document.createElement('div');
        confirmation.setAttribute('data-testid', 'published-confirmation');
        confirmation.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded shadow-lg';
        confirmation.textContent = 'Pharmacy page published!';
        document.body.appendChild(confirmation);
        setTimeout(() => confirmation.remove(), 3000);
      }
    } catch (error) {
      console.error('Failed to publish:', error);
      alert('Failed to publish pharmacy page');
    }
  };

  const handleUnpublish = async () => {
    if (!confirm('Unpublish pharmacy page? It will no longer be visible to patients.')) return;

    try {
      const response = await axios.post(`${API_BASE}/pharmacy/page/unpublish`);
      if (response.data.success) {
        setProfile(response.data.pharmacy);

        const confirmation = document.createElement('div');
        confirmation.setAttribute('data-testid', 'unpublished-confirmation');
        confirmation.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded shadow-lg';
        confirmation.textContent = 'Pharmacy page unpublished';
        document.body.appendChild(confirmation);
        setTimeout(() => confirmation.remove(), 3000);
      }
    } catch (error) {
      console.error('Failed to unpublish:', error);
      alert('Failed to unpublish pharmacy page');
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Page Pharmacie</h1>
        <div className="flex gap-2">
          {profile?.published ? (
            <span data-testid="published-badge" className="bg-green-500 text-white px-4 py-2 rounded">
              Published
            </span>
          ) : (
            <span data-testid="unpublished-badge" className="bg-gray-400 text-white px-4 py-2 rounded">
              Unpublished
            </span>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Pharmacy Information</h2>
          {!editing ? (
            <button
              onClick={handleEdit}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              aria-label="Edit Info"
            >
              Modifier Info
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                aria-label="Save"
              >
                Enregistrer
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded px-3 py-2"
                aria-label="Name"
                required
              />
              {!formData.name && (
                <div data-testid="validation-error" className="text-red-500 text-sm mt-1">
                  Name is required
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={4}
                aria-label="Description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Téléphone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border rounded px-3 py-2"
                aria-label="Phone"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Adresse</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full border rounded px-3 py-2"
                aria-label="Address"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-500">Name</div>
              <div className="text-lg">{profile?.name || 'Not set'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Description</div>
              <div className="text-gray-700">{profile?.description || 'Not set'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Phone</div>
              <div>{profile?.phone || 'Not set'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">Address</div>
              <div>
                {profile?.address
                  ? `${profile.address.street || ''}, ${profile.address.city || ''}, ${profile.address.postalCode || ''}`
                  : 'Not set'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Operating Hours Section */}
      <div data-testid="operating-hours" className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Operating Hours</h2>
        <p className="text-gray-500">Configure your pharmacy hours (feature coming soon)</p>
      </div>

      {/* Delivery Zones Section */}
      <div data-testid="delivery-zones" className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Delivery Zones</h2>
        <p className="text-gray-500">Configure delivery zones (feature coming soon)</p>
      </div>

      {/* Product Catalog Section */}
      <div data-testid="product-catalog" className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Product Catalog</h2>
        <p className="text-gray-500">Manage product catalog (feature coming soon)</p>
      </div>

      {/* Photo Upload Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Photos</h2>
        <input type="file" accept="image/*" multiple className="mb-4" />
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" aria-label="Upload Photo">
          Télécharger Photo
        </button>
      </div>

      {/* Publish/Unpublish Actions */}
      <div className="flex justify-end gap-4">
        {profile?.published ? (
          <button
            onClick={handleUnpublish}
            className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600"
            aria-label="Unpublish"
          >
            Dépublier
          </button>
        ) : (
          <button
            onClick={handlePublish}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600"
            aria-label="Publish"
          >
            Publier
          </button>
        )}
      </div>
    </div>
  );
};

export default PharmacyProfileManager;
