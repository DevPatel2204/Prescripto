// src/pages/PharmacyPage.js
import { useState, useEffect, useCallback } from 'react';
// Optional: Import a CSS file for styling
import './PharmacyPage.css';

// --- Configuration ---
// Adjust the base URL to where your backend is running
const API_BASE_URL = 'http://localhost:4000/api/pharmacies'; // Or your actual backend URL

// --- API Interaction Logic ---
const handleApiResponse = async (response) => {
    if (!response.ok) {
        // Try to parse error message from backend, fallback to status text
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        // Backend might send error in { msg: '...' } or { message: '...' }
        throw new Error(errorData.msg || errorData.message || `HTTP error! status: ${response.status}`);
    }
    // Handle 204 No Content (often returned on successful DELETE)
    if (response.status === 204) {
        return null;
    }
    return response.json(); // Parse JSON body for other successful responses
};

const api = {
    getAllPharmacies: async (params = {}) => {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${API_BASE_URL}?${query}`);
        return handleApiResponse(response);
    },
    createPharmacy: async (pharmacyData) => {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' /* Add Auth if needed */ },
            body: JSON.stringify(pharmacyData),
        });
        return handleApiResponse(response);
    },
    updatePharmacy: async (id, pharmacyData) => {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' /* Add Auth if needed */ },
            body: JSON.stringify(pharmacyData),
        });
        return handleApiResponse(response);
    },
    deletePharmacy: async (id) => {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE',
            headers: { /* Add Auth if needed */ },
        });
        // DELETE might return 200 OK with message or 204 No Content
         if (!response.ok && response.status !== 204) {
             const errorData = await response.json().catch(() => ({ message: response.statusText }));
             throw new Error(errorData.msg || errorData.message || `HTTP error! status: ${response.status}`);
         }
        return response.status === 204 ? null : await response.json().catch(() => null); // Handle potential empty body on 200 OK
    },
};

// --- Sub-Component: PharmacyList ---
// eslint-disable-next-line react/prop-types
function PharmacyList({ pharmacies, onEdit, onDelete }) {
    // eslint-disable-next-line react/prop-types
    if (!pharmacies || pharmacies.length === 0) {
        return <p>No active pharmacies found. Use the button above to add one.</p>;
    }

    return (
        <table className="pharmacy-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>City</th>
                    <th>Phone</th>
                    <th>License No.</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {/* eslint-disable-next-line react/prop-types */}
                {pharmacies.map((pharmacy) => (
                    <tr key={pharmacy._id}>
                        <td>{pharmacy.name}</td>
                        <td>{pharmacy.address?.city || 'N/A'}</td>
                        <td>{pharmacy.phoneNumber}</td>
                        <td>{pharmacy.licenseNumber}</td>
                        <td>
                            <button onClick={() => onEdit(pharmacy)} className="btn btn-edit">
                                Edit
                            </button>
                            <button onClick={() => onDelete(pharmacy._id)} className="btn btn-delete">
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}


// --- Sub-Component: PharmacyForm ---
const initialFormData = {
    name: '',
    address: { street: '', city: '', state: '', zipCode: '', country: 'USA' },
    phoneNumber: '',
    email: '',
    website: '',
    licenseNumber: '',
    servicesOffered: [],
    openingHours: [],
    isActive: true,
};

// eslint-disable-next-line react/prop-types
function PharmacyForm({ initialData = null, onSubmit, onCancel, isEditing = false }) {
    const [formData, setFormData] = useState(initialFormData);
    const [servicesInput, setServicesInput] = useState('');

    useEffect(() => {
        if (initialData) {
             // Deep merge to handle nested objects and defaults correctly
            const mergedData = {
                ...initialFormData,
                ...initialData,
                address: {
                    ...initialFormData.address,
                    ...(initialData.address || {}),
                },
                // Ensure arrays are arrays, even if initialData is missing them
                openingHours: Array.isArray(initialData.openingHours) ? initialData.openingHours : [],
                servicesOffered: Array.isArray(initialData.servicesOffered) ? initialData.servicesOffered : [],
            };
            setFormData(mergedData);
            setServicesInput((mergedData.servicesOffered || []).join(', '));
        } else {
            setFormData(initialFormData); // Reset to default for adding
            setServicesInput('');
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            address: { ...prev.address, [name]: value },
        }));
    };

    const handleServicesChange = (e) => {
        const rawValue = e.target.value;
        setServicesInput(rawValue);
        setFormData(prev => ({
            ...prev,
            servicesOffered: rawValue.split(',').map(s => s.trim()).filter(Boolean),
        }));
    };

     const handleAddOpeningHour = () => {
        setFormData(prev => ({
            ...prev,
            openingHours: [...prev.openingHours, { dayOfWeek: 1, openTime: '09:00', closeTime: '17:00' }] // Default to Monday 9-5
        }));
    };

    const handleOpeningHourChange = (index, field, value) => {
        setFormData(prev => {
            const updatedHours = prev.openingHours.map((hour, i) =>
                i === index ? { ...hour, [field]: value } : hour
            );
            return { ...prev, openingHours: updatedHours };
        });
    };

    const handleRemoveOpeningHour = (index) => {
         setFormData(prev => ({
             ...prev,
             openingHours: prev.openingHours.filter((_, i) => i !== index)
         }));
     };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Basic validation check (can be expanded)
        if (!formData.name || !formData.licenseNumber || !formData.phoneNumber || !formData.address.street) {
            alert('Please fill in all required fields (*)');
            return;
        }
        onSubmit(formData);
    };

    // Form JSX (similar to previous example, condensed for brevity)
    return (
        <form onSubmit={handleSubmit} className="pharmacy-form">
             <h2>{isEditing ? 'Edit Pharmacy' : 'Add New Pharmacy'}</h2>
             {/* --- General Info --- */}
             <div className="form-group">
                 <label>Name *</label> <input type="text" name="name" value={formData.name} onChange={handleChange} required />
             </div>
             <div className="form-group">
                 <label>Phone *</label> <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required />
             </div>
              <div className="form-group">
                 <label>License *</label> <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} required />
             </div>
              <div className="form-group">
                 <label>Email</label> <input type="email" name="email" value={formData.email} onChange={handleChange} />
             </div>
              <div className="form-group">
                 <label>Website</label> <input type="url" name="website" value={formData.website} onChange={handleChange} />
             </div>

             {/* --- Address --- */}
             <fieldset className="form-group">
                <legend>Address *</legend>
                <label>Street</label> <input type="text" name="street" value={formData.address.street} onChange={handleAddressChange} required />
                <label>City</label> <input type="text" name="city" value={formData.address.city} onChange={handleAddressChange} required />
                <label>State</label> <input type="text" name="state" value={formData.address.state} onChange={handleAddressChange} required />
                <label>Zip</label> <input type="text" name="zipCode" value={formData.address.zipCode} onChange={handleAddressChange} required />
                <label>Country</label> <input type="text" name="country" value={formData.address.country} onChange={handleAddressChange} required />
             </fieldset>

             {/* --- Services --- */}
             <div className="form-group">
                 <label>Services (comma-separated)</label>
                 <input type="text" value={servicesInput} onChange={handleServicesChange} placeholder="Prescriptions, Vaccinations, OTC"/>
             </div>

             {/* --- Opening Hours --- */}
             <fieldset className="form-group">
                <legend>Opening Hours</legend>
                 {formData.openingHours.map((hour, index) => (
                    <div key={index} className="opening-hour-row">
                         <select value={hour.dayOfWeek} onChange={(e) => handleOpeningHourChange(index, 'dayOfWeek', parseInt(e.target.value))} >
                             <option value={0}>Sun</option> <option value={1}>Mon</option> <option value={2}>Tue</option>
                             <option value={3}>Wed</option> <option value={4}>Thu</option> <option value={5}>Fri</option> <option value={6}>Sat</option>
                         </select>
                         <input type="time" value={hour.openTime} onChange={(e) => handleOpeningHourChange(index, 'openTime', e.target.value)} required />
                         <span>to</span>
                         <input type="time" value={hour.closeTime} onChange={(e) => handleOpeningHourChange(index, 'closeTime', e.target.value)} required />
                         <button type="button" onClick={() => handleRemoveOpeningHour(index)} className="remove-hour-btn">X</button>
                    </div>
                 ))}
                 <button type="button" onClick={handleAddOpeningHour} className="add-hour-btn">+ Add Hour</button>
             </fieldset>

             {/* --- Actions --- */}
             <div className="form-actions">
                 <button type="submit" className="btn btn-primary">{isEditing ? 'Update' : 'Add'}</button>
                 <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
             </div>
        </form>
    );
}

// --- Main Page Component ---
function PharmacyPage() {
    const [pharmacies, setPharmacies] = useState([]);
    const [selectedPharmacy, setSelectedPharmacy] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list', 'add', 'edit'
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchPharmacies = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Fetch only active pharmacies for the main list view maybe?
            // Adjust params if needed: const data = await api.getAllPharmacies({ isActive: true });
            const data = await api.getAllPharmacies();
            setPharmacies(data || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch pharmacies.');
            setPharmacies([]); // Clear pharmacies on error
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPharmacies();
    }, [fetchPharmacies]);

    const handleAddNew = () => {
        setSelectedPharmacy(null);
        setError(null); // Clear previous errors
        setViewMode('add');
    };

    const handleEdit = (pharmacy) => {
        setSelectedPharmacy(pharmacy);
         setError(null); // Clear previous errors
        setViewMode('edit');
    };

    const handleCancel = () => {
        setSelectedPharmacy(null);
        setError(null);
        setViewMode('list');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this pharmacy? This action might be permanent.')) {
            return;
        }
        setIsLoading(true); // Indicate activity
        setError(null);
        try {
            await api.deletePharmacy(id);
            await fetchPharmacies(); // Refresh list after delete
            setViewMode('list'); // Ensure view is list
        } catch (err) {
            setError(err.message || 'Failed to delete pharmacy.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = async (formData) => {
        setIsLoading(true);
        setError(null);
        try {
            if (viewMode === 'edit' && selectedPharmacy?._id) {
                await api.updatePharmacy(selectedPharmacy._id, formData);
            } else {
                await api.createPharmacy(formData);
            }
            await fetchPharmacies(); // Refresh list
            setViewMode('list');
            setSelectedPharmacy(null);
        } catch (err) {
            // Keep form open, display error near form
            setError(err.message || `Failed to ${viewMode} pharmacy.`);
        } finally {
            setIsLoading(false);
        }
    };

    // Render Logic
    return (
        <div className="pharmacy-page-container">
            <h1>Pharmacy Management</h1>

            {isLoading && <p className="loading-message">Loading...</p>}

             {/* General errors shown only in list view */}
            {error && viewMode === 'list' && <p className="error-message">{error}</p>}

            {viewMode === 'list' && (
                <>
                    <button onClick={handleAddNew} className="btn btn-primary add-new-btn">
                        + Add New Pharmacy
                    </button>
                    <PharmacyList
                        pharmacies={pharmacies}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </>
            )}

            {(viewMode === 'add' || viewMode === 'edit') && (
                <>
                     {/* Form-specific errors */}
                     {error && <p className="error-message form-error">{error}</p>}
                     <PharmacyForm
                        initialData={selectedPharmacy}
                        onSubmit={handleFormSubmit}
                        onCancel={handleCancel}
                        isEditing={viewMode === 'edit'}
                      />
                </>
            )}
        </div>
    );
}

export default PharmacyPage;

/* --- Example CSS (Ideally move to PharmacyPage.css and import) ---

.pharmacy-page-container {
  padding: 20px;
  max-width: 950px;
  margin: 20px auto;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pharmacy-page-container h1 {
  text-align: center;
  margin-bottom: 25px;
  color: #333;
}

.loading-message,
.error-message {
  text-align: center;
  padding: 12px;
  margin: 15px 0;
  border-radius: 4px;
  font-weight: bold;
}

.loading-message {
  color: #4682B4; // SteelBlue
  background-color: #f0f8ff; // AliceBlue
}

.error-message {
  color: #d8000c; // Red
  background-color: #ffd2d2;
  border: 1px solid #d8000c;
}
.form-error {
    margin-bottom: 15px;
    text-align: left;
}

.add-new-btn {
  display: block;
  margin-bottom: 20px;
  margin-left: auto; // Push button to the right if container allows
  margin-right: 0;
}

// General Button Styling
.btn {
  padding: 9px 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.95em;
  margin: 0 5px;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}
.btn:hover {
    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
}

.btn-primary { background-color: #007bff; color: white; }
.btn-primary:hover { background-color: #0056b3; }
.btn-secondary { background-color: #6c757d; color: white; }
.btn-secondary:hover { background-color: #5a6268; }
.btn-edit { background-color: #ffc107; color: #333; }
.btn-edit:hover { background-color: #e0a800; }
.btn-delete { background-color: #dc3545; color: white; }
.btn-delete:hover { background-color: #c82333; }


// PharmacyList Styles
.pharmacy-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.pharmacy-table th, .pharmacy-table td {
  border: 1px solid #ddd;
  padding: 12px 15px; /* More padding */
//   text-align: left;
//   vertical-align: middle;
// }
// .pharmacy-table th {
//   background-color: #f8f9fa;
//   font-weight: 600; /* Slightly bolder */
//   color: #495057;
// }
// .pharmacy-table tbody tr:nth-child(even) { background-color: #fdfdfd; }
// .pharmacy-table tbody tr:hover { background-color: #f1f1f1; }
// .pharmacy-table td .btn { padding: 5px 10px; font-size: 0.85em; }


// // PharmacyForm Styles
// .pharmacy-form {
//   background-color: #fff;
//   padding: 30px;
//   border-radius: 5px;
//   border: 1px solid #e0e0e0;
//   margin-top: 20px;
//   box-shadow: 0 1px 3px rgba(0,0,0,0.05);
// }
// .pharmacy-form h2 { margin-top: 0; margin-bottom: 25px; text-align: center; color: #333; }
// .form-group, .pharmacy-form fieldset { margin-bottom: 20px; }
// .pharmacy-form label { display: block; margin-bottom: 6px; font-weight: 600; color: #555; font-size: 0.9em; }
// .pharmacy-form input[type="text"], .pharmacy-form input[type="tel"], .pharmacy-form input[type="email"], .pharmacy-form input[type="url"], .pharmacy-form input[type="time"], .pharmacy-form select {
//   width: 100%;
//   padding: 10px 12px;
//   border: 1px solid #ccc;
//   border-radius: 4px;
//   box-sizing: border-box;
//   font-size: 1em;
// }
// .pharmacy-form input:focus, .pharmacy-form select:focus { border-color: #80bdff; outline: none; box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25); }
// .pharmacy-form fieldset { border: 1px solid #ddd; padding: 20px; border-radius: 4px; background-color: #fafafa; }
// .pharmacy-form legend { padding: 0 10px; font-weight: 600; color: #333; font-size: 1.05em; margin-left: -10px; } // Adjust alignment
// .opening-hour-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; } // Allow wrapping
// .opening-hour-row select { flex: 1 1 100px; min-width: 90px; }
// .opening-hour-row input[type="time"] { flex: 1 1 100px; min-width: 100px; padding: 8px; }
// .opening-hour-row span { margin: 0 5px; }
// .remove-hour-btn, .add-hour-btn { padding: 5px 10px; font-size: 0.9em; cursor: pointer; border-radius: 4px; }
// .remove-hour-btn { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; margin-left: auto; } // Push right
// .add-hour-btn { margin-top: 10px; background-color: #e2e6ea; border: 1px solid #dae0e5; }
// .form-actions { margin-top: 30px; text-align: right; border-top: 1px solid #eee; padding-top: 20px; }
// .form-actions .btn { margin-left: 10px; padding: 10px 20px; font-size: 1em; }

// */