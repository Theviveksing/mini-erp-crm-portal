import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { Search, Plus, Trash2, FileText, Download, Check, X, Printer, ShieldAlert } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  businessName: string;
  address: string;
  gstNumber: string | null;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  currentStock: number;
}

interface ChallanItem {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
}

interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  customerName: string;
  customerBusinessName: string;
  totalQuantity: number;
  status: string; // DRAFT, CONFIRMED, CANCELLED
  createdAt: string;
  createdBy: { name: string; role: string };
  products: (ChallanItem & { category: string; location: string })[];
}

interface ChallanViewProps {
  token: string;
  userRole: string;
}

export const ChallanView: React.FC<ChallanViewProps> = ({ token, userRole }) => {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Selected Challan details
  const [selectedChallan, setSelectedChallan] = useState<Challan | null>(null);

  // New Challan Creation State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardCustomers, setWizardCustomers] = useState<Customer[]>([]);
  const [wizardProducts, setWizardProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [wizardError, setWizardError] = useState('');
  const [isSubmittingWizard, setIsSubmittingWizard] = useState(false);

  const canModify = ['ADMIN', 'SALES'].includes(userRole);

  const fetchChallans = async (page = 1) => {
    setIsLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        status: statusFilter
      });

      const response = await fetch(`http://localhost:5000/api/challans?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to retrieve challans');

      setChallans(data.challans);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || 'Server error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChallanDetails = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/challans/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load details');
      
      // Map to same format as list response
      const details: Challan = {
        ...data,
        customerName: data.customer?.name || 'Unknown',
        customerBusinessName: data.customer?.businessName || 'Unknown',
      };
      setSelectedChallan(details);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchChallans(1);
  }, [statusFilter]);

  const loadWizardData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [custRes, prodRes] = await Promise.all([
        fetch('http://localhost:5000/api/customers?limit=100', { headers }),
        fetch('http://localhost:5000/api/products?limit=100', { headers })
      ]);

      if (custRes.ok) {
        const d = await custRes.json();
        setWizardCustomers(d.customers);
      }
      if (prodRes.ok) {
        const d = await prodRes.json();
        setWizardProducts(d.products);
      }
    } catch (e) {
      console.error('Error loading wizard database data:', e);
    }
  };

  const openWizard = () => {
    setSelectedCustomerId('');
    setSelectedItems([]);
    setWizardError('');
    setIsWizardOpen(true);
    loadWizardData();
  };

  const addItemToChallan = (product: Product) => {
    const existing = selectedItems.find(item => item.product.id === product.id);
    if (existing) {
      // Increment
      setSelectedItems(selectedItems.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setSelectedItems([...selectedItems, { product, quantity: 1 }]);
    }
  };

  const updateItemQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(productId);
      return;
    }
    setSelectedItems(selectedItems.map(item => 
      item.product.id === productId ? { ...item, quantity: qty } : item
    ));
  };

  const removeItem = (productId: string) => {
    setSelectedItems(selectedItems.filter(item => item.product.id !== productId));
  };

  const handleCreateChallan = async (status: 'DRAFT' | 'CONFIRMED') => {
    if (!selectedCustomerId) {
      setWizardError('Please select a customer');
      return;
    }
    if (selectedItems.length === 0) {
      setWizardError('Please add at least one product to the challan');
      return;
    }

    setWizardError('');
    setIsSubmittingWizard(true);

    try {
      const itemsPayload = selectedItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }));

      const response = await fetch('http://localhost:5000/api/challans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          items: itemsPayload,
          status
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit challan request');
      }

      setIsWizardOpen(false);
      fetchChallans(1);
    } catch (err: any) {
      setWizardError(err.message || 'Server error');
    } finally {
      setIsSubmittingWizard(false);
    }
  };

  const handleConfirmChallan = async (id: string) => {
    if (!window.confirm('Are you sure you want to CONFIRM this challan? Stock levels will be reduced.')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/challans/${id}/confirm`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to confirm challan');

      fetchChallans(pagination.page);
      if (selectedChallan?.id === id) {
        fetchChallanDetails(id);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCancelChallan = async (id: string) => {
    if (!window.confirm('Are you sure you want to CANCEL this challan? Stock will be returned if confirmed.')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/challans/${id}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to cancel challan');

      fetchChallans(pagination.page);
      if (selectedChallan?.id === id) {
        fetchChallanDetails(id);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // PDF Export Logic
  const handleExportPDF = (challan: Challan) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Color theme colors
    const primaryColor = [15, 23, 42]; // Slate 900
    const lightGray = [241, 245, 249]; // Slate 100

    // Header Details
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('SALES CHALLAN & INVOICE', 14, 20);

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('WHOLESALE DISTRIBUTION CORP', 14, 26);
    doc.text('Aisle 4, Central Warehouse Sector 5, Mumbai', 14, 31);
    doc.text('Contact: +91 98765 43210 | info@wholesaledist.com', 14, 36);

    // Challan metadata block
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Challan Info:', 140, 20);
    doc.setFont('Helvetica', 'normal');
    doc.text(`No: ${challan.challanNumber}`, 140, 26);
    doc.text(`Date: ${new Date(challan.createdAt).toLocaleDateString()}`, 140, 31);
    doc.text(`Status: ${challan.status}`, 140, 36);
    doc.text(`Issuer: ${challan.createdBy?.name || 'System'}`, 140, 41);

    doc.line(14, 46, 196, 46);

    // Customer section
    doc.setFont('Helvetica', 'bold');
    doc.text('Bill To (Customer):', 14, 53);
    doc.setFont('Helvetica', 'normal');
    doc.text(challan.customerBusinessName, 14, 59);
    doc.text(`Contact: ${challan.customerName}`, 14, 64);
    
    // Split address across lines if long
    const addressLines = doc.splitTextToSize(
      (challan as any).customer?.address || 'Billing address on file', 
      80
    );
    doc.text(addressLines, 14, 69);

    // Table Header
    let currentY = 90;
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(14, currentY, 182, 8, 'F');
    
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('SKU', 16, currentY + 5.5);
    doc.text('Product Description', 45, currentY + 5.5);
    doc.text('Unit Price', 120, currentY + 5.5);
    doc.text('Qty', 150, currentY + 5.5);
    doc.text('Total (INR)', 170, currentY + 5.5);

    // Table Body
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    let grandTotal = 0;
    challan.products.forEach((p, index) => {
      currentY += 8;
      
      // Zebra striping
      if (index % 2 === 1) {
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.rect(14, currentY, 182, 8, 'F');
      }

      const totalItemAmount = p.unitPrice * p.quantity;
      grandTotal += totalItemAmount;

      doc.text(p.sku, 16, currentY + 5.5);
      doc.text(p.name, 45, currentY + 5.5);
      doc.text(`Rs. ${p.unitPrice.toLocaleString('en-IN')}`, 120, currentY + 5.5);
      doc.text(p.quantity.toString(), 150, currentY + 5.5);
      doc.text(`Rs. ${totalItemAmount.toLocaleString('en-IN')}`, 170, currentY + 5.5);
    });

    currentY += 12;
    doc.line(14, currentY, 196, currentY);

    // Totals block
    currentY += 8;
    doc.setFont('Helvetica', 'bold');
    doc.text(`Total Ordered Quantity:`, 110, currentY);
    doc.text(`${challan.totalQuantity} units`, 170, currentY);
    
    currentY += 6;
    doc.text(`Grand Net Total:`, 110, currentY);
    doc.setFontSize(12);
    doc.text(`Rs. ${grandTotal.toLocaleString('en-IN')}`, 170, currentY);

    // Terms
    currentY += 15;
    doc.setFontSize(8);
    doc.setFont('Helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text('1. Received the above material in good condition and as per specification.', 14, currentY);
    doc.text('2. Discrepancies if any must be reported in writing within 24 hours of delivery.', 14, currentY + 4);
    
    // Signatures
    currentY += 18;
    doc.line(14, currentY, 60, currentY);
    doc.text("Warehouse Dispatch Auth", 14, currentY + 4);

    doc.line(140, currentY, 186, currentY);
    doc.text("Authorized Customer Signature", 140, currentY + 4);

    doc.save(`challan_${challan.challanNumber}.pdf`);
  };

  const filteredProducts = wizardProducts.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
    p.sku.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="view-header">
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Sales Challans & Dispatch</h2>
          <p style={{ color: 'var(--text-muted)' }}>Generate business challans, deduct inventory stocks, and print invoice documents.</p>
        </div>
        {canModify && (
          <button className="btn btn-primary" onClick={openWizard}>
            <Plus size={18} />
            <span>Generate Challan</span>
          </button>
        )}
      </div>

      <div className="search-filter-bar">
        <select
          className="form-select"
          style={{ width: '220px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {error && (
        <div className="alert-box alert-box-danger">
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selectedChallan ? '1.5fr 1fr' : '1fr', gap: '1.5rem', transition: 'all 0.3s' }}>
        <div>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading sales challans...
            </div>
          ) : challans.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No sales challans recorded. Generate a new challan to get started.
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Challan No.</th>
                      <th>Customer Name</th>
                      <th>Total Items</th>
                      <th>Status</th>
                      <th>Created Date</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {challans.map((c) => (
                      <tr
                        key={c.id}
                        style={{ cursor: 'pointer', backgroundColor: selectedChallan?.id === c.id ? 'var(--primary-light)' : 'inherit' }}
                        onClick={() => setSelectedChallan(c)}
                      >
                        <td style={{ fontWeight: 600 }}>{c.challanNumber}</td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{c.customerBusinessName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.customerName}</div>
                        </td>
                        <td>{c.totalQuantity} units</td>
                        <td>
                          <span className={`badge ${c.status === 'CONFIRMED' ? 'badge-success' : c.status === 'DRAFT' ? 'badge-warning' : 'badge-danger'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ marginRight: '0.5rem' }}
                            onClick={() => setSelectedChallan(c)}
                          >
                            <FileText size={14} />
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ marginRight: '0.5rem' }}
                            onClick={() => handleExportPDF(c)}
                            title="Download PDF Invoice"
                          >
                            <Download size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination-wrapper">
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Showing <strong>{challans.length}</strong> of <strong>{pagination.total}</strong> challans
                </span>
                <div className="pagination-buttons">
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchChallans(pagination.page - 1)}
                  >
                    Prev
                  </button>
                  <span style={{ alignSelf: 'center', fontSize: '0.9rem', color: 'var(--text-main)', padding: '0 0.5rem' }}>
                    Page {pagination.page} of {pagination.totalPages || 1}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchChallans(pagination.page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Selected Challan Details Panel */}
        {selectedChallan && (
          <div className="card" style={{ borderLeft: '4px solid var(--primary)', animation: 'slideInLeft 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>Challan: {selectedChallan.challanNumber}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Created on: {new Date(selectedChallan.createdAt).toLocaleString()}
                </p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedChallan(null)}>Close</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              <div>
                <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Customer</strong>
                <span>{selectedChallan.customerBusinessName} ({selectedChallan.customerName})</span>
              </div>
              <div>
                <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</strong>
                <span className={`badge ${selectedChallan.status === 'CONFIRMED' ? 'badge-success' : selectedChallan.status === 'DRAFT' ? 'badge-warning' : 'badge-danger'}`}>
                  {selectedChallan.status}
                </span>
              </div>
              <div>
                <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Created By</strong>
                <span>{selectedChallan.createdBy?.name} ({selectedChallan.createdBy?.role})</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Items Snapshot</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedChallan.products.map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>SKU: {p.sku} | Loc: {p.location || 'Aisle 1'}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                      <div>{p.quantity} Units @ ₹{p.unitPrice}</div>
                      <div style={{ fontWeight: 600 }}>₹{(p.quantity * p.unitPrice).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontWeight: 700, fontSize: '1rem' }}>
                <span>Total Amount:</span>
                <span>
                  ₹{selectedChallan.products.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => handleExportPDF(selectedChallan)} style={{ flex: 1 }}>
                <Printer size={15} />
                <span>Invoice PDF</span>
              </button>
              {canModify && selectedChallan.status === 'DRAFT' && (
                <button className="btn btn-primary btn-sm" onClick={() => handleConfirmChallan(selectedChallan.id)} style={{ flex: 1 }}>
                  <Check size={15} />
                  <span>Confirm Dispatch</span>
                </button>
              )}
              {canModify && selectedChallan.status !== 'CANCELLED' && (
                <button className="btn btn-danger btn-sm" onClick={() => handleCancelChallan(selectedChallan.id)} style={{ flex: 1 }}>
                  <X size={15} />
                  <span>Cancel Order</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Challan Creator Wizard Overlay */}
      {isWizardOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '1000px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem' }}>Generate Sales Challan Wizard</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsWizardOpen(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {wizardError && (
                <div className="alert-box alert-box-danger">
                  <ShieldAlert size={20} />
                  <span>{wizardError}</span>
                </div>
              )}

              <div className="challan-wizard">
                {/* Left side: products search and selection */}
                <div>
                  <div className="form-group">
                    <label className="form-label">Step 1: Select Customer *</label>
                    <select
                      className="form-select"
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                    >
                      <option value="">-- Select Billing Customer --</option>
                      {wizardCustomers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.businessName} ({c.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                    <label className="form-label">Step 2: Add Products to Challan</label>
                    
                    <div className="search-input-wrapper" style={{ marginBottom: '1rem' }}>
                      <Search className="search-icon" size={16} />
                      <input
                        type="text"
                        className="form-input form-input-sm"
                        placeholder="Search product catalog by name or SKU..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                      />
                    </div>

                    <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                      <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                        <thead>
                          <tr>
                            <th>SKU & Name</th>
                            <th>Unit Price</th>
                            <th>Live Stock</th>
                            <th style={{ textAlign: 'right' }}>Add</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.map(p => (
                            <tr key={p.id}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{p.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.sku}</div>
                              </td>
                              <td>₹{p.unitPrice}</td>
                              <td style={{ color: p.currentStock <= 5 ? 'var(--error)' : 'inherit', fontWeight: 600 }}>
                                {p.currentStock} Units
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => addItemToChallan(p)}
                                  disabled={p.currentStock <= 0}
                                >
                                  Add
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Right side: Items Cart */}
                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Challan Basket</h4>
                  
                  {selectedItems.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', padding: '2rem 0', textAlign: 'center' }}>
                      No items added yet. Click 'Add' on the left.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
                      {selectedItems.map(item => (
                        <div key={item.product.id} style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.85rem' }}>
                            <span>{item.product.name}</span>
                            <button
                              type="button"
                              onClick={() => removeItem(item.product.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Stock: {item.product.currentStock} units
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <input
                                type="number"
                                className="form-input"
                                style={{ width: '70px', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                                value={item.quantity}
                                onChange={(e) => updateItemQty(item.product.id, parseInt(e.target.value) || 0)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>Total quantity:</span>
                      <strong style={{ fontSize: '1rem' }}>
                        {selectedItems.reduce((acc, curr) => acc + curr.quantity, 0)} units
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                      <span>Total amount:</span>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>
                        ₹{selectedItems.reduce((acc, curr) => acc + (curr.quantity * curr.product.unitPrice), 0).toLocaleString('en-IN')}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={isSubmittingWizard || selectedItems.length === 0}
                        onClick={() => handleCreateChallan('CONFIRMED')}
                      >
                        Confirm Order & Dispatch
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ width: '100%' }}
                        disabled={isSubmittingWizard || selectedItems.length === 0}
                        onClick={() => handleCreateChallan('DRAFT')}
                      >
                        Save as Draft Challan
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsWizardOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
