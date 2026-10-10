// Cart state management and server synchronization

function getLoggedInUser() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('currentUser') || localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    return null
  }
}

export function getLocalCart() {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('cart') || '[]')
  } catch (e) {
    return []
  }
}

export function saveLocalCart(cart) {
  if (typeof window === 'undefined') return
  localStorage.setItem('cart', JSON.stringify(cart))
  window.dispatchEvent(new Event('cartUpdated'))
}

async function syncToOnline(cart) {
  const user = getLoggedInUser()
  if (!user || (!user._id && !user.id)) return

  try {
    const token = localStorage.getItem('token')
    await fetch('/api/cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        userId: user._id || user.id,
        cart,
      }),
    })
  } catch (err) {
    console.error('Failed to sync cart online:', err)
  }
}

export function addToCart(product, quantity = 1) {
  if (!product || (!product._id && !product.id)) return null

  const cart = getLocalCart()
  const productId = String(product._id || product.id)
  const existing = cart.find((item) => String(item.id) === productId)

  if (existing) {
    existing.quantity = Math.min(99, (existing.quantity || 1) + quantity)
  } else {
    cart.push({
      id: productId,
      name: product.name || 'Unknown Product',
      price: product.price || 0,
      originalPrice: product.originalPrice || null,
      image: product.images?.[0] || product.image || '',
      quantity: Math.max(1, quantity),
      brand: product.brand || '',
    })
  }

  saveLocalCart(cart)
  syncToOnline(cart)
  return cart
}

export function updateCartQuantity(productId, newQuantity) {
  let cart = getLocalCart()
  const idStr = String(productId)

  if (newQuantity <= 0) {
    cart = cart.filter((item) => String(item.id) !== idStr)
  } else {
    cart = cart.map((item) =>
      String(item.id) === idStr ? { ...item, quantity: Math.min(99, newQuantity) } : item
    )
  }

  saveLocalCart(cart)
  syncToOnline(cart)
  return cart
}

export function removeFromCart(productId) {
  const idStr = String(productId)
  const cart = getLocalCart().filter((item) => String(item.id) !== idStr)
  saveLocalCart(cart)
  syncToOnline(cart)
  return cart
}

export async function syncCartOnLogin(user, token) {
  if (!user || (!user._id && !user.id)) return

  try {
    const localCart = getLocalCart()
    const response = await fetch('/api/cart', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        userId: user._id || user.id,
        localCart,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      if (data.cart) {
        saveLocalCart(data.cart)
      }
    }
  } catch (err) {
    console.error('Failed to merge cart on login:', err)
  }
}

export function clearCart() {
  saveLocalCart([])
  syncToOnline([])
}

export async function initUserCart() {
  const user = getLoggedInUser()
  if (!user || (!user._id && !user.id)) return

  try {
    const token = localStorage.getItem('token')
    const userId = user._id || user.id
    const res = await fetch(`/api/cart?userId=${encodeURIComponent(userId)}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.cart) && data.cart.length > 0) {
        saveLocalCart(data.cart)
      }
    }
  } catch (err) {
    console.error('Failed to init user cart from online:', err)
  }
}

export function isItemInCart(productId) {
  if (!productId) return false
  const cart = getLocalCart()
  const pid = String(productId)
  return cart.some((item) => String(item.id || item._id) === pid)
}
