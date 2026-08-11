import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { Search, Plus, Edit, AlertTriangle, ArrowUpDown, ClipboardList, Info } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
  location: string;
  isLowStock?: boolean;
}

interface StockMovement {
  id: number;
  quantityChanged: number;
  type: string;
  reason: string;
  createdAt: string;
  createdBy: { name: string; role: string };
}

interface InventoryViewProps {
  token: string;
  userRole: string;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ token, userRole }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Selected product details for movement logs panel
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [movementLogs, setMovementLogs] = useState<StockMovement[]>([]);
  const [isLogsLoading, setIsLogsLoading] = useState(false);

  // Add/Edit Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productFields, setProductFields] = useState({
    name: '',
    sku: '',
    category: '',
    unitPrice: '',
    currentStock: '0',
    minStockAlert: '10',
    location: ''
  });
  const [productFormError, setProductFormError] = useState('');
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Stock Adjustment Modal
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustmentFields, setAdjustmentFields] = useState({
    quantityChanged: '',
    isIncrement: true, // true for IN, false for OUT
    reason: ''
  });
  const [adjustmentError, setAdjustmentError] = useState('');
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);

  const canModify = ['ADMIN', 'WAREHOUSE'].includes(userRole);

  const fetchProducts = async (page = 1) => {
    setIsLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        q: search,
        category: categoryFilter,
        lowStock: lowStockFilter.toString()
      });

      const response = await fetch(`${API_BASE}/api/products?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to retrieve products');

      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || 'Server error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMovements = async (productId: number) => {
    setIsLogsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/products/${productId}/movements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to retrieve movements');
      setMovementLogs(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [search, categoryFilter, lowStockFilter]);

  useEffect(() => {
    if (selectedProduct) {
      fetchMovements(selectedProduct.id);
    } else {
      setMovementLogs([]);
    }
  }, [selectedProduct]);

  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductFields({
      name: '',
      sku: '',
      category: '',
      unitPrice: '',
      currentStock: '0',
      minStockAlert: '10',
      location: ''
    });
    setProductFormError('');
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProductFields({
      name: product.name,
      sku: product.sku,
      category: product.category,
      unitPrice: product.unitPrice.toString(),
      currentStock: product.currentStock.toString(), // will be readonly in form for safety
      minStockAlert: product.minStockAlert.toString(),
      location: product.location
    });
    setProductFormError('');
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, sku, category, unitPrice, currentStock, minStockAlert, location } = productFields;

    if (!name || !sku || !category || !unitPrice || !location) {
      setProductFormError('Please fill in all required fields');
      return;
    }

    setProductFormError('');
    setIsSubmittingProduct(true);

    try {
      const url = editingProduct
        ? `${API_BASE}/api/products/${editingProduct.id}`
        : `${API_BASE}/api/products`;
      const method = editingProduct ? 'PUT' : 'POST';

      const bodyData = editingProduct
        ? { name, sku, category, unitPrice, minStockAlert, location }
        : { name, sku, category, unitPrice, currentStock, minStockAlert, location };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit product');

      setIsProductModalOpen(false);
      fetchProducts(editingProduct ? pagination.page : 1);
      if (editingProduct && selectedProduct?.id === editingProduct.id) {
        setSelectedProduct({
          ...selectedProduct,
          name,
          sku,
          category,
          unitPrice: parseFloat(unitPrice),
          minStockAlert: parseInt(minStockAlert),
          location
        });
      }
    } catch (err: any) {
      setProductFormError(err.message || 'Server error');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const openAdjustmentModal = (product: Product) => {
    setAdjustingProduct(product);
    setAdjustmentFields({
      quantityChanged: '',
      isIncrement: true,
      reason: ''
    });
    setAdjustmentError('');
    setIsAdjustmentModalOpen(true);
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { quantityChanged, isIncrement, reason } = adjustmentFields;

    if (!quantityChanged || parseInt(quantityChanged) <= 0 || !reason) {
      setAdjustmentError('Please specify valid quantity and reason');
      return;
    }

    setAdjustmentError('');
    setIsSubmittingAdjustment(true);

    try {
      const changeVal = parseInt(quantityChanged) * (isIncrement ? 1 : -1);

      const response = await fetch(`${API_BASE}/api/products/${adjustingProduct?.id}/adjust-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          quantityChanged: changeVal,
          reason
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to adjust stock');

      setIsAdjustmentModalOpen(false);
      fetchProducts(pagination.page);
      if (selectedProduct?.id === adjustingProduct?.id) {
        // Refresh movements list and details
        setSelectedProduct(data);
      }
    } catch (err: any) {
      setAdjustmentError(err.message || 'Server error');
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="view-header">
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Inventory & Stock Management</h2>
          <p style={{ color: 'var(--text-muted)' }}>Track warehouse levels, locations, low-stock warnings, and historic stock movements.</p>
        </div>
        {canModify && (
          <button className="btn btn-primary" onClick={openAddProductModal}>
            <Plus size={18} />
            <span>Add Product</span>
          </button>
        )}
      </div>

      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="form-input"
            placeholder="Search catalog by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: '180px' }}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="Footwear">Footwear</option>
          <option value="Apparel">Apparel</option>
          <option value="Kitchenware">Kitchenware</option>
          <option value="Electronics">Electronics</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none', color: 'var(--text-main)' }}>
          <input
            type="checkbox"
            checked={lowStockFilter}
            onChange={(e) => setLowStockFilter(e.target.checked)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
          <span>Show low stock alert items only</span>
        </label>
      </div>

      {error && (
        <div className="alert-box alert-box-danger">
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selectedProduct ? '1.5fr 1fr' : '1fr', gap: '1.5rem', transition: 'all 0.3s' }}>
        <div>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading product catalog...
            </div>
          ) : products.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No catalog products matching filters found.
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>SKU & Product Name</th>
                      <th>Category</th>
                      <th>Unit Price</th>
                      <th style={{ textAlign: 'center' }}>Stock Level</th>
                      <th>Warehouse Location</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => {
                      const isLow = p.currentStock <= p.minStockAlert;
                      return (
                        <tr
                          key={p.id}
                          className={isLow ? 'low-stock-alert-row' : ''}
                          style={{
                            cursor: 'pointer',
                            backgroundColor: selectedProduct?.id === p.id ? 'var(--primary-light)' : 'inherit',
                            outline: isLow ? '1px dashed rgba(239, 68, 68, 0.2)' : 'none'
                          }}
                          onClick={() => setSelectedProduct(p)}
                        >
                          <td>
                            <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              {isLow && <AlertTriangle size={15} style={{ color: 'var(--error)' }} />}
                              <span>{p.name}</span>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.sku}</span>
                          </td>
                          <td>{p.category}</td>
                          <td>₹{p.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{
                              fontWeight: 700,
                              color: isLow ? 'var(--error)' : 'inherit',
                              display: 'block'
                            }}>
                              {p.currentStock}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              Min Alert: {p.minStockAlert}
                            </span>
                          </td>
                          <td>{p.location}</td>
                          <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ marginRight: '0.5rem' }}
                              onClick={() => setSelectedProduct(p)}
                            >
                              <Info size={14} />
                            </button>
                            {canModify && (
                              <>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  style={{ marginRight: '0.5rem' }}
                                  onClick={() => openAdjustmentModal(p)}
                                  title="Adjust Stock"
                                >
                                  <ArrowUpDown size={14} />
                                </button>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => openEditProductModal(p)}
                                  title="Edit Product"
                                >
                                  <Edit size={14} />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="pagination-wrapper">
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Showing <strong>{products.length}</strong> of <strong>{pagination.total}</strong> products
                </span>
                <div className="pagination-buttons">
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchProducts(pagination.page - 1)}
                  >
                    Prev
                  </button>
                  <span style={{ alignSelf: 'center', fontSize: '0.9rem', color: 'var(--text-main)', padding: '0 0.5rem' }}>
                    Page {pagination.page} of {pagination.totalPages || 1}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchProducts(pagination.page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Stock movement log details drawer */}
        {selectedProduct && (
          <div className="card" style={{ borderLeft: '4px solid var(--primary)', animation: 'slideInLeft 0.2s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>{selectedProduct.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'monospace' }}>SKU: {selectedProduct.sku}</p>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedProduct(null)}>Close</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              <div>
                <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Warehouse Location</strong>
                <span>{selectedProduct.location}</span>
              </div>
              <div>
                <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Current Stock</strong>
                <span style={{ fontWeight: 700, color: selectedProduct.currentStock <= selectedProduct.minStockAlert ? 'var(--error)' : 'inherit' }}>
                  {selectedProduct.currentStock} Units
                </span>
              </div>
              <div>
                <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Price per Unit</strong>
                <span>₹{selectedProduct.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div>
                <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase' }}>Alert Limit</strong>
                <span>{selectedProduct.minStockAlert} Units</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <h4 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <ClipboardList size={18} />
                <span>Stock Movement Ledger</span>
              </h4>

              {canModify && (
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', marginBottom: '1rem' }}
                  onClick={() => openAdjustmentModal(selectedProduct)}
                >
                  Post Stock Adjustment
                </button>
              )}

              {isLogsLoading ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading ledger movements...</p>
              ) : movementLogs.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No movement records found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                  {movementLogs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--border-radius-sm)',
                        backgroundColor: 'var(--bg-app)',
                        borderLeft: `3px solid ${log.type === 'IN' ? 'var(--success)' : 'var(--error)'}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600 }}>
                        <span style={{ color: log.type === 'IN' ? 'var(--success)' : 'var(--error)' }}>
                          {log.type === 'IN' ? '+' : '-'}{log.quantityChanged} units ({log.type})
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{log.reason}</p>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', textAlign: 'right' }}>
                        Logged by: {log.createdBy?.name || 'System'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem' }}>
                {editingProduct ? 'Edit Product Details' : 'Add New Product to Catalog'}
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsProductModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleProductSubmit}>
              <div className="modal-body">
                {productFormError && (
                  <div className="alert-box alert-box-danger">
                    <span>{productFormError}</span>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={productFields.name}
                    onChange={(e) => setProductFields({ ...productFields, name: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">SKU / Code *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={productFields.sku}
                      onChange={(e) => setProductFields({ ...productFields, sku: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select
                      className="form-select"
                      value={productFields.category}
                      onChange={(e) => setProductFields({ ...productFields, category: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      <option value="Footwear">Footwear</option>
                      <option value="Apparel">Apparel</option>
                      <option value="Kitchenware">Kitchenware</option>
                      <option value="Electronics">Electronics</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Unit Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={productFields.unitPrice}
                      onChange={(e) => setProductFields({ ...productFields, unitPrice: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Min Stock Alert *</label>
                    <input
                      type="number"
                      className="form-input"
                      value={productFields.minStockAlert}
                      onChange={(e) => setProductFields({ ...productFields, minStockAlert: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Warehouse Location *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Aisle 4, Shelf B"
                      value={productFields.location}
                      onChange={(e) => setProductFields({ ...productFields, location: e.target.value })}
                    />
                  </div>
                  {!editingProduct && (
                    <div className="form-group">
                      <label className="form-label">Initial Opening Stock *</label>
                      <input
                        type="number"
                        className="form-input"
                        value={productFields.currentStock}
                        onChange={(e) => setProductFields({ ...productFields, currentStock: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsProductModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingProduct}>
                  {editingProduct ? 'Save Changes' : 'Catalog Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {isAdjustmentModalOpen && adjustingProduct && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem' }}>Adjust Stock Levels</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsAdjustmentModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAdjustmentSubmit}>
              <div className="modal-body">
                {adjustmentError && (
                  <div className="alert-box alert-box-danger">
                    <span>{adjustmentError}</span>
                  </div>
                )}
                <div style={{ marginBottom: '1.25rem' }}>
                  <strong>Product:</strong> {adjustingProduct.name} <br />
                  <strong>Current Available Stock:</strong> {adjustingProduct.currentStock} units
                </div>

                <div className="form-group">
                  <label className="form-label">Adjustment Type</label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={adjustmentFields.isIncrement}
                        onChange={() => setAdjustmentFields({ ...adjustmentFields, isIncrement: true })}
                      />
                      <span>Receive Stock (Stock IN / Add)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        checked={!adjustmentFields.isIncrement}
                        onChange={() => setAdjustmentFields({ ...adjustmentFields, isIncrement: false })}
                      />
                      <span>Dispatch / Discard (Stock OUT / Remove)</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Adjustment Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={adjustmentFields.quantityChanged}
                    onChange={(e) => setAdjustmentFields({ ...adjustmentFields, quantityChanged: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reason for Adjustment *</label>
                  <select
                    className="form-select"
                    value={adjustmentFields.reason}
                    onChange={(e) => setAdjustmentFields({ ...adjustmentFields, reason: e.target.value })}
                  >
                    <option value="">Select Reason</option>
                    {adjustmentFields.isIncrement ? (
                      <>
                        <option value="Supplier shipment received">Supplier shipment received</option>
                        <option value="Stock return check-in">Stock return check-in</option>
                        <option value="Audit discrepancy corrected (+)">Audit discrepancy corrected (+)</option>
                      </>
                    ) : (
                      <>
                        <option value="Damaged items discard">Damaged items discard</option>
                        <option value="Internal usage requisition">Internal usage requisition</option>
                        <option value="Audit discrepancy corrected (-)">Audit discrepancy corrected (-)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAdjustmentModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isSubmittingAdjustment}>
                  Submit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
