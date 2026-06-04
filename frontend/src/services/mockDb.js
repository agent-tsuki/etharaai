const INITIAL_PRODUCTS = [
  { id: 1, name: 'Laptop Pro 16"', sku: 'LPT-PRO-88', price: 1299.00, quantity: 15 },
  { id: 2, name: 'Curved Monitor 34"', sku: 'MON-CRV-34', price: 499.99, quantity: 8 },
  { id: 3, name: 'Mechanical Keyboard', sku: 'KEY-MECH-87', price: 129.00, quantity: 24 },
  { id: 4, name: 'Wireless Office Mouse', sku: 'MSE-WRL-12', price: 49.99, quantity: 3 },
  { id: 5, name: 'USB-C Multi Hub', sku: 'HUB-USBC-05', price: 79.00, quantity: 45 },
  { id: 6, name: 'Noise Cancelling Headset', sku: 'AUD-ANC-99', price: 199.99, quantity: 0 },
]

const INITIAL_CUSTOMERS = [
  { id: 1, full_name: 'Sarah Jenkins', email: 'sarah.j@example.com' },
  { id: 2, full_name: 'Michael Chen', email: 'm.chen@example.com' },
  { id: 3, full_name: 'Emma Rodriguez', email: 'emma.r@example.com' },
  { id: 4, full_name: 'David Kim', email: 'd.kim@example.com' },
]

const INITIAL_ORDERS = [
  { id: 1, customer_id: 1, customer_name: 'Sarah Jenkins', amount: 1299.00, total_amount: 1299.00, status: 'completed', created_at: '2026-06-01T10:00:00Z' },
  { id: 2, customer_id: 2, customer_name: 'Michael Chen', amount: 228.99, total_amount: 228.99, status: 'processing', created_at: '2026-06-03T14:30:00Z' },
  { id: 3, customer_id: 3, customer_name: 'Emma Rodriguez', amount: 49.99, total_amount: 49.99, status: 'pending', created_at: '2026-06-04T09:15:00Z' },
  { id: 4, customer_id: 4, customer_name: 'David Kim', amount: 79.00, total_amount: 79.00, status: 'cancelled', created_at: '2026-06-02T11:45:00Z' },
]

const INITIAL_USERS = [
  { id: 1, full_name: 'Guest User', email: 'guest@example.com', role: 'admin', is_active: true, permissions: {} },
  { id: 2, full_name: 'Super Admin', email: 'admin@admin.in', role: 'admin', is_active: true, permissions: {} },
  { id: 3, full_name: 'Alice Manager', email: 'alice@example.com', role: 'manager', is_active: true, permissions: {} },
  { id: 4, full_name: 'Bob Agent', email: 'bob@example.com', role: 'agent', is_active: true, permissions: {} },
]

function getStored(key, initial) {
  const val = localStorage.getItem(`ethara_mock_${key}`)
  if (!val) {
    localStorage.setItem(`ethara_mock_${key}`, JSON.stringify(initial))
    return initial
  }
  return JSON.parse(val)
}

function setStored(key, val) {
  localStorage.setItem(`ethara_mock_${key}`, JSON.stringify(val))
}

export function handleMockRequest(config) {
  const url = config.url || ''
  const method = (config.method || 'get').toLowerCase()
  
  // Parse params
  const params = config.params || {}
  
  let data = null
  let status = 200

  // 1. Dashboard Endpoint
  if (url.match(/\/dashboard$/)) {
    const products = getStored('products', INITIAL_PRODUCTS)
    const customers = getStored('customers', INITIAL_CUSTOMERS)
    const orders = getStored('orders', INITIAL_ORDERS)
    const lowStock = products.filter(p => p.quantity <= 10)
    
    data = {
      status: 'success',
      data: {
        total_products: products.length,
        total_customers: customers.length,
        total_orders: orders.length,
        low_stock_products: lowStock.map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          quantity: p.quantity,
          price: p.price
        }))
      }
    }
  }
  // 2. Auth Endpoint /auth/me
  else if (url.match(/\/auth\/me$/)) {
    data = {
      status: 'success',
      data: {
        id: 'guest',
        full_name: 'Guest User',
        email: 'guest@example.com',
        role: 'admin'
      }
    }
  }
  // 3. Auth Logout
  else if (url.match(/\/auth\/logout$/)) {
    data = {
      status: 'success',
      data: null
    }
  }
  // 4. Products List and Actions
  else if (url.match(/\/products\/?$/)) {
    const products = getStored('products', INITIAL_PRODUCTS)
    if (method === 'get') {
      let filtered = [...products]
      
      if (params.name) {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(params.name.toLowerCase()))
      }
      if (params.sku) {
        filtered = filtered.filter(p => p.sku.toLowerCase().includes(params.sku.toLowerCase()))
      }
      if (params.stock_count !== undefined) {
        const count = Number(params.stock_count)
        const op = params.stock_operator || 'gte'
        filtered = filtered.filter(p => {
          if (op === 'lte') return p.quantity <= count
          if (op === 'gte') return p.quantity >= count
          return p.quantity === count
        })
      }
      if (params.min_price !== undefined) {
        filtered = filtered.filter(p => p.price >= Number(params.min_price))
      }
      if (params.max_price !== undefined) {
        filtered = filtered.filter(p => p.price <= Number(params.max_price))
      }

      const skip = Number(params.skip || 0)
      const limit = Number(params.limit || 100)
      const paginated = filtered.slice(skip, skip + limit)
      
      data = {
        status: 'success',
        data: paginated,
        pagination: {
          total: filtered.length,
          skip,
          limit,
          has_more: skip + limit < filtered.length
        }
      }
    } else if (method === 'post') {
      const body = JSON.parse(config.data || '{}')
      const newProduct = {
        id: Date.now(),
        name: body.name || 'New Product',
        sku: body.sku || `SKU-${Date.now()}`,
        price: Number(body.price || 0),
        quantity: Number(body.quantity || 0)
      }
      products.push(newProduct)
      setStored('products', products)
      data = { status: 'success', data: newProduct }
    }
  }
  // Product Detail / Edit / Delete
  else if (url.match(/\/products\/(\d+|[a-zA-Z0-9-_]+)$/)) {
    const match = url.match(/\/products\/([a-zA-Z0-9-_]+)$/)
    const id = match ? match[1] : ''
    const products = getStored('products', INITIAL_PRODUCTS)
    const index = products.findIndex(p => String(p.id) === String(id))

    if (method === 'get') {
      if (index !== -1) {
        data = { status: 'success', data: products[index] }
      } else {
        status = 404
        data = { status: 'fail', msg: 'Product not found' }
      }
    } else if (method === 'put') {
      if (index !== -1) {
        const body = JSON.parse(config.data || '{}')
        products[index] = {
          ...products[index],
          name: body.name ?? products[index].name,
          sku: body.sku ?? products[index].sku,
          price: body.price !== undefined ? Number(body.price) : products[index].price,
          quantity: body.quantity !== undefined ? Number(body.quantity) : products[index].quantity
        }
        setStored('products', products)
        data = { status: 'success', data: products[index] }
      } else {
        status = 404
        data = { status: 'fail', msg: 'Product not found' }
      }
    } else if (method === 'delete') {
      if (index !== -1) {
        const deleted = products.splice(index, 1)
        setStored('products', products)
        data = { status: 'success', data: deleted[0] }
      } else {
        status = 404
        data = { status: 'fail', msg: 'Product not found' }
      }
    }
  }
  // 5. Customers List and Actions
  else if (url.match(/\/customers\/?$/)) {
    const customers = getStored('customers', INITIAL_CUSTOMERS)
    if (method === 'get') {
      let filtered = [...customers]
      if (params.name) {
        filtered = filtered.filter(c => c.full_name.toLowerCase().includes(params.name.toLowerCase()))
      }
      if (params.email) {
        filtered = filtered.filter(c => c.email.toLowerCase().includes(params.email.toLowerCase()))
      }
      
      const skip = Number(params.skip || 0)
      const limit = Number(params.limit || 100)
      const paginated = filtered.slice(skip, skip + limit)

      data = {
        status: 'success',
        data: paginated,
        pagination: {
          total: filtered.length,
          skip,
          limit,
          has_more: skip + limit < filtered.length
        }
      }
    } else if (method === 'post') {
      const body = JSON.parse(config.data || '{}')
      const newCustomer = {
        id: Date.now(),
        full_name: body.full_name || body.name || 'New Customer',
        email: body.email || 'customer@example.com'
      }
      customers.push(newCustomer)
      setStored('customers', customers)
      data = { status: 'success', data: newCustomer }
    }
  }
  // Customer Detail / Delete
  else if (url.match(/\/customers\/([a-zA-Z0-9-_]+)$/)) {
    const match = url.match(/\/customers\/([a-zA-Z0-9-_]+)$/)
    const id = match ? match[1] : ''
    const customers = getStored('customers', INITIAL_CUSTOMERS)
    const index = customers.findIndex(c => String(c.id) === String(id))

    if (method === 'get') {
      if (index !== -1) {
        data = { status: 'success', data: customers[index] }
      } else {
        status = 404
        data = { status: 'fail', msg: 'Customer not found' }
      }
    } else if (method === 'delete') {
      if (index !== -1) {
        const deleted = customers.splice(index, 1)
        setStored('customers', customers)
        data = { status: 'success', data: deleted[0] }
      } else {
        status = 404
        data = { status: 'fail', msg: 'Customer not found' }
      }
    }
  }
  // 6. Orders List and Actions
  else if (url.match(/\/orders\/?$/)) {
    const orders = getStored('orders', INITIAL_ORDERS)
    if (method === 'get') {
      let filtered = [...orders]
      if (params.customer_id) {
        filtered = filtered.filter(o => String(o.customer_id) === String(params.customer_id))
      }
      if (params.status) {
        filtered = filtered.filter(o => o.status === params.status)
      }
      if (params.min_amount !== undefined) {
        filtered = filtered.filter(o => (o.total_amount ?? o.amount) >= Number(params.min_amount))
      }
      if (params.max_amount !== undefined) {
        filtered = filtered.filter(o => (o.total_amount ?? o.amount) <= Number(params.max_amount))
      }
      
      const skip = Number(params.skip || 0)
      const limit = Number(params.limit || 100)
      const paginated = filtered.slice(skip, skip + limit)

      data = {
        status: 'success',
        data: paginated,
        pagination: {
          total: filtered.length,
          skip,
          limit,
          has_more: skip + limit < filtered.length
        }
      }
    } else if (method === 'post') {
      const body = JSON.parse(config.data || '{}')
      const customers = getStored('customers', INITIAL_CUSTOMERS)
      const customer = customers.find(c => String(c.id) === String(body.customer_id))
      
      const newOrder = {
        id: Date.now(),
        customer_id: Number(body.customer_id),
        customer_name: customer ? customer.full_name : 'Unknown Customer',
        amount: Number(body.amount || body.total_amount || 0),
        total_amount: Number(body.total_amount || body.amount || 0),
        status: body.status || 'pending',
        created_at: new Date().toISOString()
      }
      orders.push(newOrder)
      setStored('orders', orders)
      data = { status: 'success', data: newOrder }
    }
  }
  // Order Detail / Delete
  else if (url.match(/\/orders\/([a-zA-Z0-9-_]+)$/)) {
    const match = url.match(/\/orders\/([a-zA-Z0-9-_]+)$/)
    const id = match ? match[1] : ''
    const orders = getStored('orders', INITIAL_ORDERS)
    const index = orders.findIndex(o => String(o.id) === String(id))

    if (method === 'get') {
      if (index !== -1) {
        data = { status: 'success', data: orders[index] }
      } else {
        status = 404
        data = { status: 'fail', msg: 'Order not found' }
      }
    } else if (method === 'delete') {
      if (index !== -1) {
        const deleted = orders.splice(index, 1)
        setStored('orders', orders)
        data = { status: 'success', data: deleted[0] }
      } else {
        status = 404
        data = { status: 'fail', msg: 'Order not found' }
      }
    }
  }
  // 7. Users List and Actions
  else if (url.match(/\/users\/?$/)) {
    const users = getStored('users', INITIAL_USERS)
    if (method === 'get') {
      data = { status: 'success', data: users }
    }
  }
  // User Edit / Role / Permission / Delete
  else if (url.match(/\/users\/([a-zA-Z0-9-_]+)(\/role|\/permissions)?$/)) {
    const match = url.match(/\/users\/([a-zA-Z0-9-_]+)(?:\/role|\/permissions)?$/)
    const id = match ? match[1] : ''
    const users = getStored('users', INITIAL_USERS)
    const index = users.findIndex(u => String(u.id) === String(id))

    if (index !== -1) {
      const body = JSON.parse(config.data || '{}')
      if (url.endsWith('/role')) {
        users[index].role = body.role
        setStored('users', users)
        data = { status: 'success', data: users[index] }
      } else if (url.endsWith('/permissions')) {
        users[index].permissions = body.permissions
        setStored('users', users)
        data = { status: 'success', data: users[index] }
      } else if (method === 'put') {
        users[index] = { ...users[index], ...body }
        setStored('users', users)
        data = { status: 'success', data: users[index] }
      } else if (method === 'delete') {
        const deleted = users.splice(index, 1)
        setStored('users', users)
        data = { status: 'success', data: users[index] }
      } else if (method === 'get') {
        data = { status: 'success', data: users[index] }
      }
    } else {
      status = 404
      data = { status: 'fail', msg: 'User not found' }
    }
  }

  // Fallback / Catchall for other URLs
  if (!data) {
    status = 404
    data = { status: 'fail', msg: `Mock endpoint not found for ${method.toUpperCase()} ${url}` }
  }

  // Axios expects a response structure that resolves
  const response = {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: { 'content-type': 'application/json' },
    config,
  }

  return status === 200 
    ? Promise.resolve(response)
    : Promise.reject({
        response,
        message: data.msg || 'Mock request failed',
        config
      })
}
