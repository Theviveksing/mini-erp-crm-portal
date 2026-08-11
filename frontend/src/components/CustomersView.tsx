import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { Search, Plus, Calendar, Edit, ClipboardList, Info } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber: string | null;
  customerType: string;
  address: string;
  status: string;
  followUpDate: string | null;
  notes: string | null;
}

interface FollowUpNote {
  id: number;
  note: string;
  createdBy: string;
  createdAt: string;
}

interface CustomerWithDetails extends Customer {
  followUps: FollowUpNote[];
}

interface CustomersViewProps {
  token: string;
  userRole: string;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ token, userRole }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Selected customer for detail drawer/modal
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<CustomerWithDetails | null>(null);
  const [newFollowUpNote, setNewFollowUpNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Add/Edit modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formFields, setFormFields] = useState({
    name: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    customerType: 'RETAIL',
    address: '',
    status: 'LEAD',
    followUpDate: '',
    notes: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const canModify = ['ADMIN', 'SALES'].includes(userRole);

  const fetchCustomers = async (page = 1) => {
    setIsLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        q: search,
        status: statusFilter,
        type: typeFilter
      });

      const response = await fetch(`${API_BASE}/api/customers?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to retrieve customers');

      setCustomers(data.customers);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || 'Server error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomerDetails = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to retrieve details');

      setSelectedCustomerDetails(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerDetails(selectedCustomerId);
    } else {
      setSelectedCustomerDetails(null);
    }
  }, [selectedCustomerId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFollowUpNote.trim() || !selectedCustomerId) return;

    setIsSubmittingNote(true);
    try {
      const response = await fetch(`${API_BASE}/api/customers/${selectedCustomerId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ note: newFollowUpNote })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add note');

      setNewFollowUpNote('');
      // Refresh customer details to show new note
      fetchCustomerDetails(selectedCustomerId);
      // Refresh the search list since notes column displays last note
      fetchCustomers(pagination.page);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormFields({
      name: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      customerType: 'RETAIL',
      address: '',
      status: 'LEAD',
      followUpDate: '',
      notes: ''
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormFields({
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email,
      businessName: customer.businessName,
      gstNumber: customer.gstNumber || '',
      customerType: customer.customerType,
      address: customer.address,
      status: customer.status,
      followUpDate: customer.followUpDate ? new Date(customer.followUpDate).toISOString().split('T')[0] : '',
      notes: customer.notes || ''
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, mobile, email, businessName, customerType, status, address } = formFields;

    if (!name || !mobile || !email || !businessName || !customerType || !status || !address) {
      setFormError('Please fill in all required fields');
      return;
    }

    setFormError('');
    setIsSubmittingForm(true);

    try {
      const url = editingCustomer
        ? `${API_BASE}/api/customers/${editingCustomer.id}`
        : `${API_BASE}/api/customers`;
      const method = editingCustomer ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formFields)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit form');

      setIsFormModalOpen(false);
      fetchCustomers(editingCustomer ? pagination.page : 1);
      if (editingCustomer && selectedCustomerId === editingCustomer.id) {
        fetchCustomerDetails(editingCustomer.id);
      }
    } catch (err: any) {
      setFormError(err.message || 'Server error');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="view-header">
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>CRM Customer Directory</h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage wholesale/retail customer leads, follow-ups, and contacts.</p>
        </div>
        {canModify && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            <span>Add Customer</span>
          </button>
        )}
      </div>

      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, business, email, or mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: '180px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="LEAD">Lead</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        <select
          className="form-select"
          style={{ width: '180px' }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="RETAIL">Retail</option>
          <option value="WHOLESALE">Wholesale</option>
          <option value="DISTRIBUTOR">Distributor</option>
        </select>
      </div>

      {error && (
        <div className="alert-box alert-box-danger">
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selectedCustomerDetails ? '1.5fr 1fr' : '1fr', gap: '1.5rem', transition: 'all 0.3s' }}>
        <div>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading customers list...
            </div>
          ) : customers.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No customers found. Try altering your filters or add a new record.
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Business / Name</th>
                      <th>Type</th>
                      <th>Contact Details</th>
                      <th>Status</th>
                      <th>Follow Up</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr
                        key={c.id}
                        style={{ cursor: 'pointer', backgroundColor: selectedCustomerId === c.id ? 'var(--primary-light)' : 'inherit' }}
                        onClick={() => setSelectedCustomerId(c.id)}
                      >
                        <td>
                          <div style={{ fontWeight: 600 }}>{c.businessName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.name}</div>
                        </td>
                        <td>
                          <span className={`badge ${c.customerType === 'DISTRIBUTOR' ? 'badge-info' : c.customerType === 'WHOLESALE' ? 'badge-success' : 'badge-warning'}`}>
                            {c.customerType}
                          </span>
                        </td>
                        <td>
                          <div>{c.mobile}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.email}</div>
                        </td>
                        <td>
                          <span className={`badge ${c.status === 'ACTIVE' ? 'badge-success' : c.status === 'LEAD' ? 'badge-warning' : 'badge-danger'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td>
                          {c.followUpDate ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                              <Calendar size={14} className="text-primary" />
                              <span>{new Date(c.followUpDate).toLocaleDateString()}</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>None</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ marginRight: '0.5rem' }}
                            onClick={() => setSelectedCustomerId(c.id)}
                          >
                            <Info size={14} />
                          </button>
                          {canModify && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => openEditModal(c)}
                            >
                              <Edit size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination-wrapper">
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Showing <strong>{customers.length}</strong> of <strong>{pagination.total}</strong> customers
                </span>
                <div className="pagination-buttons">
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchCustomers(pagination.page - 1)}
                  >
                    Prev
                  </button>
                  <span style={{ alignSelf: 'center', fontSize: '0.9rem', color: 'var(--text-main)', padding: '0 0.5rem' }}>
                    Page {pagination.page} of {pagination.totalPages || 1}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchCustomers(pagination.page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Detailed Drawer */}
        {selectedCustomerDetails && (
          <div className="card" style={{ borderLeft: '4px solid var(--primary)', animation: 'slideInLeft 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>{selectedCustomerDetails.businessName}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Customer ID: #{selectedCustomerDetails.id}</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedCustomerId(null)}>Close</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              <div>
                <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Contact Person</strong>
                <span>{selectedCustomerDetails.name}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Mobile</strong>
                  <span>{selectedCustomerDetails.mobile}</span>
                </div>
                <div>
                  <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Email</strong>
                  <span>{selectedCustomerDetails.email}</span>
                </div>
              </div>
              <div>
                <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>GST Number</strong>
                <span>{selectedCustomerDetails.gstNumber || 'N/A'}</span>
              </div>
              <div>
                <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Billing Address</strong>
                <span>{selectedCustomerDetails.address}</span>
              </div>
              <div>
                <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Last Notes</strong>
                <span style={{ fontStyle: 'italic' }}>{selectedCustomerDetails.notes || 'No notes added'}</span>
              </div>
            </div>

            {/* Follow-up Notes Timeline */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <h4 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <ClipboardList size={18} />
                <span>Follow-up History</span>
              </h4>

              {canModify && (
                <form onSubmit={handleAddNote} style={{ marginBottom: '1.5rem' }}>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Type follow-up note..."
                    value={newFollowUpNote}
                    onChange={(e) => setNewFollowUpNote(e.target.value)}
                    style={{ marginBottom: '0.5rem', resize: 'none' }}
                  />
                  <button type="submit" className="btn btn-primary btn-sm" disabled={isSubmittingNote} style={{ width: '100%' }}>
                    Add Follow-up Note
                  </button>
                </form>
              )}

              <div className="notes-timeline">
                {selectedCustomerDetails.followUps.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No notes logs recorded.</p>
                ) : (
                  selectedCustomerDetails.followUps.map((n) => (
                    <div key={n.id} className="note-item">
                      <div className="note-header">
                        <span>{n.createdBy}</span>
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="note-body">{n.note}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Form Modal */}
      {isFormModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem' }}>
                {editingCustomer ? 'Edit Customer Info' : 'Register New Customer'}
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsFormModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {formError && (
                  <div className="alert-box alert-box-danger" style={{ gridColumn: 'span 2' }}>
                    <span>{formError}</span>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Business Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formFields.businessName}
                    onChange={(e) => setFormFields({ ...formFields, businessName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formFields.name}
                    onChange={(e) => setFormFields({ ...formFields, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formFields.mobile}
                    onChange={(e) => setFormFields({ ...formFields, mobile: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formFields.email}
                    onChange={(e) => setFormFields({ ...formFields, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">GST Number (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formFields.gstNumber}
                    onChange={(e) => setFormFields({ ...formFields, gstNumber: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Type *</label>
                  <select
                    className="form-select"
                    value={formFields.customerType}
                    onChange={(e) => setFormFields({ ...formFields, customerType: e.target.value })}
                  >
                    <option value="RETAIL">Retail</option>
                    <option value="WHOLESALE">Wholesale</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Address *</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={formFields.address}
                    onChange={(e) => setFormFields({ ...formFields, address: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status *</label>
                  <select
                    className="form-select"
                    value={formFields.status}
                    onChange={(e) => setFormFields({ ...formFields, status: e.target.value })}
                  >
                    <option value="LEAD">Lead</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Follow-up Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formFields.followUpDate}
                    onChange={(e) => setFormFields({ ...formFields, followUpDate: e.target.value })}
                  />
                </div>
                {!editingCustomer && (
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Initial Notes / Context</label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      placeholder="Enter customer requirement context or follow up outline..."
                      value={formFields.notes}
                      onChange={(e) => setFormFields({ ...formFields, notes: e.target.value })}
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingForm}>
                  {editingCustomer ? 'Update Info' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
