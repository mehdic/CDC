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
  services: string[] | null;
  published: boolean;
}

interface OperatingHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
  notes: string;
}

interface DeliveryZone {
  id?: string;
  name: string;
  postalCodes: string;
  deliveryFee: number;
  minOrder: number;
  maxDistanceKm: number;
}

interface Product {
  id?: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  category: string;
  description: string;
}

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4003';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Operating Hours Section Component
const OperatingHoursSection: React.FC = () => {
  const [hours, setHours] = useState<OperatingHour[]>(
    DAYS.map((_, index) => ({
      dayOfWeek: index,
      openTime: '09:00',
      closeTime: '18:00',
      isClosed: index === 0, // Sunday closed by default
      notes: '',
    }))
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHours();
  }, []);

  const loadHours = async () => {
    try {
      const response = await axios.get(`${API_BASE}/pharmacy/page/hours`);
      if (response.data.success && response.data.hours) {
        setHours(response.data.hours);
      }
    } catch (error) {
      console.error('Failed to load operating hours:', error);
    }
  };

  const handleHourChange = (index: number, field: keyof OperatingHour, value: string | number | boolean) => {
    const updated = [...hours];
    updated[index] = { ...updated[index], [field]: value };
    setHours(updated);
  };

  const saveHours = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE}/pharmacy/page/hours`, { hours });
      if (response.data.success) {
        const toast = document.createElement('div');
        toast.setAttribute('data-testid', 'success-toast');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded shadow-lg z-50';
        toast.textContent = 'Operating hours saved successfully';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      }
    } catch (error) {
      console.error('Failed to save operating hours:', error);
      alert('Failed to save operating hours');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="operating-hours" className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Operating Hours</h2>
      <div className="space-y-3">
        {DAYS.map((day, index) => (
          <div key={day} data-testid={`hours-${day.toLowerCase()}`} className="flex items-center gap-4 border-b pb-3">
            <div className="w-28">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={!hours[index].isClosed}
                  onChange={(e) => handleHourChange(index, 'isClosed', !e.target.checked)}
                  className="mr-2"
                />
                <span className="font-medium">{day}</span>
              </label>
            </div>
            {!hours[index].isClosed && (
              <>
                <div>
                  <label htmlFor={`open-${day}`} className="block text-sm text-gray-600 mb-1">Ouverture</label>
                  <input
                    id={`open-${day}`}
                    type="time"
                    value={hours[index].openTime}
                    onChange={(e) => handleHourChange(index, 'openTime', e.target.value)}
                    className="border rounded px-2 py-1"
                    aria-label="Ouverture"
                  />
                </div>
                <div>
                  <label htmlFor={`close-${day}`} className="block text-sm text-gray-600 mb-1">Fermeture</label>
                  <input
                    id={`close-${day}`}
                    type="time"
                    value={hours[index].closeTime}
                    onChange={(e) => handleHourChange(index, 'closeTime', e.target.value)}
                    className="border rounded px-2 py-1"
                    aria-label="Fermeture"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor={`notes-${day}`} className="block text-sm text-gray-600 mb-1">Notes</label>
                  <input
                    id={`notes-${day}`}
                    type="text"
                    value={hours[index].notes}
                    onChange={(e) => handleHourChange(index, 'notes', e.target.value)}
                    className="w-full border rounded px-2 py-1"
                    placeholder="Notes (optional)"
                  />
                </div>
              </>
            )}
            {hours[index].isClosed && (
              <span className="text-gray-500 italic">Fermé</span>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={saveHours}
        disabled={loading}
        className="mt-4 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        aria-label="Save"
        data-testid="save-hours"
      >
        {loading ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    </div>
  );
};

// Delivery Zones Section Component
const DeliveryZonesSection: React.FC = () => {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [postalCodeInput, setPostalCodeInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      const response = await axios.get(`${API_BASE}/pharmacy/page/delivery-zones`);
      if (response.data.success && response.data.zones) {
        setZones(response.data.zones);
      }
    } catch (error) {
      console.error('Failed to load delivery zones:', error);
    }
  };

  const addZone = async () => {
    if (!postalCodeInput.trim()) {
      alert('Please enter a postal code');
      return;
    }

    try {
      setLoading(true);
      // Send just the postal code to backend
      const response = await axios.post(`${API_BASE}/pharmacy/page/delivery-zones`, {
        postalCode: postalCodeInput.trim(),
      });
      if (response.data.success) {
        await loadZones();
        setPostalCodeInput('');

        const toast = document.createElement('div');
        toast.setAttribute('data-testid', 'success-toast');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded shadow-lg z-50';
        toast.textContent = 'Delivery zone added successfully';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      }
    } catch (error) {
      console.error('Failed to add delivery zone:', error);
      alert('Failed to add delivery zone');
    } finally {
      setLoading(false);
    }
  };

  const toggleZone = async (zonePostalCode: string, enabled: boolean) => {
    try {
      const response = await axios.put(
        `${API_BASE}/pharmacy/page/delivery-zones/${zonePostalCode}`,
        { enabled }
      );
      if (response.data.success) {
        await loadZones();
      }
    } catch (error) {
      console.error('Failed to update zone:', error);
      alert('Failed to update zone');
    }
  };

  return (
    <div data-testid="delivery-zones" className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Delivery Zones</h2>

      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Code Postal</label>
            <input
              type="text"
              value={postalCodeInput}
              onChange={(e) => setPostalCodeInput(e.target.value)}
              placeholder="e.g., 1200"
              className="w-full border rounded px-3 py-2"
              aria-label="Code Postal"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={addZone}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
              aria-label="Add"
            >
              Ajouter
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {zones.length === 0 && (
          <p className="text-gray-500 italic">No delivery zones configured yet</p>
        )}
        {zones.map((zone) => {
          const postalCode = typeof zone === 'string' ? zone : zone.postalCodes || zone.name;
          return (
            <div
              key={postalCode}
              data-testid={`zone-${postalCode}`}
              className="border rounded-lg p-3 flex items-center justify-between"
            >
              <span className="font-medium">{postalCode}</span>
              <input
                type="checkbox"
                defaultChecked={true}
                onChange={(e) => toggleZone(postalCode, e.target.checked)}
                className="w-4 h-4"
              />
            </div>
          );
        })}
      </div>

      <button
        onClick={async () => {
          try {
            const response = await axios.post(`${API_BASE}/pharmacy/page/delivery-zones/save`, {
              zones,
            });
            if (response.data.success) {
              const toast = document.createElement('div');
              toast.setAttribute('data-testid', 'success-toast');
              toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded shadow-lg z-50';
              toast.textContent = 'Delivery zones saved successfully';
              document.body.appendChild(toast);
              setTimeout(() => toast.remove(), 3000);
            }
          } catch (error) {
            console.error('Failed to save zones:', error);
          }
        }}
        className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        aria-label="Save"
        data-testid="save-delivery"
      >
        Enregistrer
      </button>
    </div>
  );
};

// Product Catalog Section Component
const ProductCatalogSection: React.FC = () => {
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/pharmacy/page/catalog`);
      if (response.data.success) {
        setCatalogProducts(response.data.products || []);
        setAvailableProducts(response.data.availableProducts || []);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const addProductToCatalog = async (productId: string) => {
    try {
      const response = await axios.post(`${API_BASE}/pharmacy/page/catalog`, {
        productId,
      });

      if (response.data.success) {
        await loadProducts();
        setDialogOpen(false);

        const toast = document.createElement('div');
        toast.setAttribute('data-testid', 'success-toast');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded shadow-lg z-50';
        toast.textContent = 'Product added successfully';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      }
    } catch (error) {
      console.error('Failed to add product:', error);
      alert('Failed to add product');
    }
  };

  const removeProductFromCatalog = async (productId: string) => {
    try {
      const response = await axios.delete(`${API_BASE}/pharmacy/page/catalog/${productId}`);
      if (response.data.success) {
        await loadProducts();

        const toast = document.createElement('div');
        toast.setAttribute('data-testid', 'success-toast');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded shadow-lg z-50';
        toast.textContent = 'Product removed successfully';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      }
    } catch (error) {
      console.error('Failed to remove product:', error);
      alert('Failed to remove product');
    }
  };

  return (
    <div data-testid="product-catalog" className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Product Catalog</h2>
        <button
          onClick={() => setDialogOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          aria-label="Add Product"
        >
          Ajouter Produit
        </button>
      </div>

      <div className="space-y-2">
        {catalogProducts.length === 0 && (
          <p className="text-gray-500 italic">No products in catalog yet</p>
        )}
        {catalogProducts.map((product) => (
          <div
            key={product.id}
            data-testid={`catalog-product-${product.id}`}
            className="border rounded-lg p-3 flex items-center justify-between"
          >
            <span className="font-medium">{product.name}</span>
            <button
              onClick={() => product.id && removeProductFromCatalog(product.id)}
              className="text-red-600 hover:text-red-900"
              data-testid="remove-button"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={async () => {
          try {
            const response = await axios.post(`${API_BASE}/pharmacy/page/catalog/save`, {
              products: catalogProducts,
            });
            if (response.data.success) {
              const toast = document.createElement('div');
              toast.setAttribute('data-testid', 'success-toast');
              toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded shadow-lg z-50';
              toast.textContent = 'Catalog saved successfully';
              document.body.appendChild(toast);
              setTimeout(() => toast.remove(), 3000);
            }
          } catch (error) {
            console.error('Failed to save catalog:', error);
          }
        }}
        className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        aria-label="Save"
        data-testid="save-catalog"
      >
        Enregistrer
      </button>

      {/* Product Selection Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-semibold mb-4">Select Products to Add</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {availableProducts.map((product) => (
                <div
                  key={product.id}
                  data-testid={`product-${product.id}`}
                  className="border rounded-lg p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => product.id && addProductToCatalog(product.id)}
                >
                  <span className="font-medium">{product.name}</span>
                  <span className="text-sm text-gray-500">CHF {product.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setDialogOpen(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main PharmacyProfileManager Component
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
          address: profileData.address
            ? `${profileData.address.street || ''}, ${profileData.address.city || ''}, ${profileData.address.postalCode || ''}`.trim()
            : '',
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
        address: profile.address
          ? `${profile.address.street || ''}, ${profile.address.city || ''}, ${profile.address.postalCode || ''}`.trim()
          : '',
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

  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);

  const handlePublish = async () => {
    setShowPublishDialog(false);

    try {
      const response = await axios.post(`${API_BASE}/pharmacy/page/publish`);
      if (response.data.success) {
        setProfile(response.data.pharmacy);

        const confirmation = document.createElement('div');
        confirmation.setAttribute('data-testid', 'published-confirmation');
        confirmation.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded shadow-lg z-50';
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
    setShowUnpublishDialog(false);

    try {
      const response = await axios.post(`${API_BASE}/pharmacy/page/unpublish`);
      if (response.data.success) {
        setProfile(response.data.pharmacy);

        const confirmation = document.createElement('div');
        confirmation.setAttribute('data-testid', 'unpublished-confirmation');
        confirmation.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded shadow-lg z-50';
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
                data-testid="save-info"
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
      <OperatingHoursSection />

      {/* Delivery Zones Section */}
      <DeliveryZonesSection />

      {/* Product Catalog Section */}
      <ProductCatalogSection />

      {/* Photo Upload Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Photos</h2>
        <input type="file" accept="image/*" multiple className="mb-4" />
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Télécharger Photo
        </button>
      </div>

      {/* Publish/Unpublish Actions */}
      <div className="flex justify-end gap-4">
        {profile?.published ? (
          <button
            onClick={() => setShowUnpublishDialog(true)}
            className="bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600"
          >
            Dépublier
          </button>
        ) : (
          <button
            onClick={() => setShowPublishDialog(true)}
            className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600"
          >
            Publier
          </button>
        )}
      </div>

      {/* Publish Confirmation Dialog */}
      {showPublishDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-xl font-semibold mb-4">Confirm Publication</h3>
            <p className="mb-6">Are you sure you want to publish your pharmacy page? It will be visible to patients.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPublishDialog(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Annuler
              </button>
              <button
                onClick={handlePublish}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                aria-label="Confirm"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unpublish Confirmation Dialog */}
      {showUnpublishDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-xl font-semibold mb-4">Confirm Unpublication</h3>
            <p className="mb-6">Are you sure you want to unpublish your pharmacy page? It will no longer be visible to patients.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowUnpublishDialog(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Annuler
              </button>
              <button
                onClick={handleUnpublish}
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                aria-label="Confirm"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyProfileManager;
