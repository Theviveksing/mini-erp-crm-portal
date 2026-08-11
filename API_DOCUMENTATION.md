# Mini ERP + CRM Portal — REST API Documentation

Welcome to the REST API documentation for the **Mini ERP & CRM Operations Portal**.

**Base URL**: `http://localhost:5000/api`  
**Interactive Swagger Docs Endpoint**: `http://localhost:5000/api-docs`  
**Authentication**: All protected endpoints require a JWT Bearer Token passed in the HTTP Request Header:
```http
Authorization: Bearer <YOUR_JWT_TOKEN>
```

---

## Table of Contents
1. [Authentication APIs](#1-authentication-apis)
2. [Customer CRM APIs](#2-customer-crm-apis)
3. [Product Inventory APIs](#3-product-inventory-apis)
4. [Sales Challan APIs](#4-sales-challan-apis)
5. [System Health Check](#5-system-health-check)

---

## 1. Authentication APIs

### 1.1 User Sign In
Authenticate user credentials and receive a 24-hour signed JWT token.

* **HTTP Method**: `POST`
* **Endpoint**: `/api/auth/login`
* **Access**: Public
* **Request Body**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```
* **Success Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "name": "Aditya Admin",
    "role": "ADMIN"
  }
}
```
* **Error Response (401 Unauthorized)**:
```json
{
  "error": "Invalid username or password"
}
```

---

### 1.2 User Registration
Register a new employee account with a specific role.

* **HTTP Method**: `POST`
* **Endpoint**: `/api/auth/register`
* **Access**: Public
* **Request Body**:
```json
{
  "username": "johndoe",
  "password": "password123",
  "name": "John Doe",
  "role": "SALES"
}
```
* **Allowed Roles**: `ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`
* **Success Response (201 Created)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 5,
    "username": "johndoe",
    "name": "John Doe",
    "role": "SALES"
  }
}
```

---

### 1.3 Get Active Profile
Retrieve token payload for the currently authenticated user.

* **HTTP Method**: `GET`
* **Endpoint**: `/api/auth/me`
* **Access**: Authenticated (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`)
* **Success Response (200 OK)**:
```json
{
  "id": 1,
  "username": "admin",
  "name": "Aditya Admin",
  "role": "ADMIN"
}
```

---

### 1.4 Update User Profile Name
Update the profile display name of the authenticated user.

* **HTTP Method**: `PUT`
* **Endpoint**: `/api/auth/profile`
* **Access**: Authenticated
* **Request Body**:
```json
{
  "name": "Aditya S. Admin"
}
```
* **Success Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "name": "Aditya S. Admin",
    "role": "ADMIN"
  }
}
```

---

## 2. Customer CRM APIs

### 2.1 List Customers
Retrieve paginated customer records with optional search and filter parameters.

* **HTTP Method**: `GET`
* **Endpoint**: `/api/customers`
* **Access**: Authenticated (`ADMIN`, `SALES`, `ACCOUNTS`)
* **Query Parameters**:
  * `page` *(number, default: 1)* — Page number
  * `limit` *(number, default: 10)* — Page size
  * `search` *(string)* — Search by name, business, email, or mobile
  * `status` *(string: LEAD | ACTIVE | INACTIVE)* — Filter status
  * `customerType` *(string: RETAIL | WHOLESALE | DISTRIBUTOR)* — Filter type
* **Success Response (200 OK)**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Reliance Retail Ltd",
      "mobile": "9876543210",
      "email": "procurement@relianceretail.com",
      "businessName": "Reliance Retail Limited",
      "gstNumber": "27AAACR1234F1Z5",
      "customerType": "WHOLESALE",
      "address": "Reliance Corporate Park, Ghansoli, Navi Mumbai, MH",
      "status": "ACTIVE",
      "notes": "Major wholesale partner"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 4,
    "totalPages": 1
  }
}
```

---

### 2.2 Get Customer Details & Follow-up Notes
Retrieve a single customer profile along with their full follow-up note timeline.

* **HTTP Method**: `GET`
* **Endpoint**: `/api/customers/:id`
* **Access**: Authenticated (`ADMIN`, `SALES`, `ACCOUNTS`)
* **Success Response (200 OK)**:
```json
{
  "id": 1,
  "name": "Reliance Retail Ltd",
  "mobile": "9876543210",
  "email": "procurement@relianceretail.com",
  "businessName": "Reliance Retail Limited",
  "gstNumber": "27AAACR1234F1Z5",
  "customerType": "WHOLESALE",
  "status": "ACTIVE",
  "followUps": [
    {
      "id": 1,
      "customerId": 1,
      "note": "Initial onboarding call completed",
      "createdBy": "Aditya Admin",
      "createdAt": "2026-08-11T10:00:00.000Z"
    }
  ]
}
```

---

### 2.3 Create Customer Lead
Add a new customer profile into the CRM.

* **HTTP Method**: `POST`
* **Endpoint**: `/api/customers`
* **Access**: Restricted (`ADMIN`, `SALES`)
* **Request Body**:
```json
{
  "name": "Tata Consumer Products",
  "mobile": "9812345678",
  "email": "contact@tataconsumer.com",
  "businessName": "Tata Consumer Ltd",
  "gstNumber": "27AAACT9876E1Z4",
  "customerType": "DISTRIBUTOR",
  "address": "Bombay House, Fort, Mumbai - 400001",
  "status": "LEAD",
  "notes": "Interested in bulk purchasing footwear"
}
```

---

### 2.4 Add Follow-up Timeline Note
Append a dated follow-up interaction note to a customer's CRM timeline.

* **HTTP Method**: `POST`
* **Endpoint**: `/api/customers/:id/notes`
* **Access**: Restricted (`ADMIN`, `SALES`)
* **Request Body**:
```json
{
  "note": "Called procurement manager. Sent updated wholesale price sheet."
}
```
* **Success Response (201 Created)**:
```json
{
  "id": 5,
  "customerId": 1,
  "note": "Called procurement manager. Sent updated wholesale price sheet.",
  "createdBy": "Siddharth Sales",
  "createdAt": "2026-08-11T12:00:00.000Z"
}
```

---

## 3. Product Inventory APIs

### 3.1 List Products
Retrieve catalog products with low-stock alert filters and search.

* **HTTP Method**: `GET`
* **Endpoint**: `/api/products`
* **Access**: Authenticated
* **Query Parameters**:
  * `lowStock` *(boolean)* — `true` filters items where `currentStock <= minStockAlert`
  * `category` *(string)* — Filter category
  * `search` *(string)* — Search by name or SKU
* **Success Response (200 OK)**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "Premium Leather Shoes",
      "sku": "SHO-LEA-001",
      "category": "Footwear",
      "unitPrice": 1200.0,
      "currentStock": 50,
      "minStockAlert": 10,
      "location": "Aisle 3, Shelf B"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 5, "totalPages": 1 }
}
```

---

### 3.2 Adjust Product Inventory Level
Perform positive (`IN`) or negative (`OUT`) stock quantity adjustments.

* **HTTP Method**: `POST`
* **Endpoint**: `/api/products/:id/adjust-stock`
* **Access**: Restricted (`ADMIN`, `WAREHOUSE`)
* **Request Body**:
```json
{
  "quantityChanged": 25,
  "reason": "Restocked stock batch #B-2026"
}
```
* **Success Response (200 OK)**:
```json
{
  "id": 1,
  "name": "Premium Leather Shoes",
  "currentStock": 75,
  "minStockAlert": 10
}
```

---

### 3.3 Fetch Product Stock Movements Ledger
Retrieve timestamped movement logs for a given product.

* **HTTP Method**: `GET`
* **Endpoint**: `/api/products/:id/movements`
* **Access**: Authenticated
* **Success Response (200 OK)**:
```json
[
  {
    "id": 1,
    "productId": 1,
    "quantityChanged": 25,
    "type": "IN",
    "reason": "Restocked stock batch #B-2026",
    "createdBy": {
      "name": "Waseem Warehouse",
      "role": "WAREHOUSE"
    },
    "createdAt": "2026-08-11T11:30:00.000Z"
  }
]
```

---

## 4. Sales Challan APIs

### 4.1 Create Sales Challan
Generate a new sales order with automatic stock verification and price snapshot creation.

* **HTTP Method**: `POST`
* **Endpoint**: `/api/challans`
* **Access**: Restricted (`ADMIN`, `SALES`)
* **Request Body**:
```json
{
  "customerId": 1,
  "status": "CONFIRMED",
  "items": [
    { "productId": 1, "quantity": 2 },
    { "productId": 2, "quantity": 5 }
  ]
}
```
* **Success Response (201 Created)**:
```json
{
  "id": 1,
  "challanNumber": "CH-2026-0001",
  "customerId": 1,
  "totalQuantity": 7,
  "status": "CONFIRMED",
  "snapshotData": "{\"customerName\":\"Reliance Retail Ltd\",\"items\":[{\"name\":\"Premium Leather Shoes\",\"unitPrice\":1200,\"quantity\":2}]}"
}
```

---

### 4.2 Get Challan Details & Price Snapshot
Retrieve order metadata and price snapshot data.

* **HTTP Method**: `GET`
* **Endpoint**: `/api/challans/:id`
* **Access**: Authenticated
* **Success Response (200 OK)**:
```json
{
  "id": 1,
  "challanNumber": "CH-2026-0001",
  "status": "CONFIRMED",
  "customerName": "Reliance Retail Ltd",
  "items": [
    {
      "productId": 1,
      "name": "Premium Leather Shoes",
      "sku": "SHO-LEA-001",
      "unitPrice": 1200.0,
      "quantity": 2,
      "lineTotal": 2400.0
    }
  ]
}
```

---

### 4.3 Confirm or Cancel Challan Order
* **Confirm Draft Order**: `PUT /api/challans/:id/confirm` *(Deducts inventory stock)*
* **Cancel Order**: `PUT /api/challans/:id/cancel` *(Restores deducted inventory stock)*

---

## 5. System Health Check

* **HTTP Method**: `GET`
* **Endpoint**: `/api/health`
* **Access**: Public
* **Success Response (200 OK)**:
```json
{
  "status": "UP",
  "timestamp": "2026-08-11T18:30:00.000Z",
  "database": "CONNECTED",
  "service": "Mini ERP + CRM Backend API"
}
```
