import React, { useEffect, useState } from 'react'
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../supabaseClient';

export default function Checkout() {
  const [apiError, setApiError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cartItems, setCartItems] = useState([])
  const [user, setUser] = useState(null)
  const [subtotal, setSubtotal] = useState(0)
  const [shipping, setShipping] = useState(0)
  const [total, setTotal] = useState(0)
  const [shippingCosts, setShippingCosts] = useState([])
  const [selectedGovernorate, setSelectedGovernorate] = useState('')

  const navigate = useNavigate();

  // Fetch user session, cart items, and shipping costs
  useEffect(() => {
    checkUser()
    loadCartFromStorage()
    fetchShippingCosts()
    document.title = 'Checkout - SportFlex Store'
  }, [])

  useEffect(() => {
    if (selectedGovernorate && shippingCosts.length > 0) {
      calculateTotalsWithShipping()
    }
  }, [selectedGovernorate, shippingCosts])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user || null)
  }

  const fetchShippingCosts = async () => {
    try {
      const { data, error } = await supabase
        .from('shipping_costs')
        .select('*')
        .eq('is_active', true)
        .order('governorate')

      if (error) throw error
      setShippingCosts(data || [])

      // Set default governorate to Cairo if available
      if (data && data.length > 0) {
        const cairo = data.find(g => g.governorate === 'Cairo')
        if (cairo) {
          setSelectedGovernorate('Cairo')
        } else {
          setSelectedGovernorate(data[0].governorate)
        }
      }
    } catch (error) {
      console.error('Error fetching shipping costs:', error)
      toast.error('Failed to load shipping costs')
    }
  }

  const loadCartFromStorage = () => {
    try {
      const storedCart = localStorage.getItem('checkout_cart')
      if (storedCart) {
        const cartData = JSON.parse(storedCart)
        if (cartData.products && cartData.products.length > 0) {
          setCartItems(cartData.products)

          // Calculate subtotal (no tax)
          const calculatedSubtotal = cartData.products.reduce((total, item) =>
            total + (item.price * item.count), 0)

          setSubtotal(calculatedSubtotal)
        } else {
          navigate('/cart')
        }
      } else {
        navigate('/cart')
      }
    } catch (error) {
      console.error('Error loading cart:', error)
      navigate('/cart')
    }
  }

  const calculateTotalsWithShipping = () => {
    if (!selectedGovernorate) return

    const selectedShipping = shippingCosts.find(g => g.governorate === selectedGovernorate)
    const shippingCost = selectedShipping ? selectedShipping.cost : 50.00 // Default cost

    // Calculate total (no tax)
    const calculatedTotal = subtotal + shippingCost

    setShipping(shippingCost)
    setTotal(calculatedTotal)
  }

  const validationSchema = Yup.object({
    details: Yup.string()
      .min(10, 'Address must be at least 10 characters')
      .required('Address is required'),
    phone: Yup.string()
      .matches(/^01[0-9]{9}$/, 'Egyptian phone number must start with 01 and be 11 digits')
      .required('Phone number is required'),
    city: Yup.string()
      .min(2, 'City must be at least 2 characters')
      .required('City is required'),
    email: Yup.string()
      .email('Invalid email format')
      .required('Email is required'),
    firstName: Yup.string()
      .min(2, 'First name must be at least 2 characters')
      .required('First name is required'),
    lastName: Yup.string()
      .min(2, 'Last name must be at least 2 characters')
      .required('Last name is required'),
  })

  const createOrder = async (shippingAddress) => {
    try {
      setLoading(true)

      if (!user) {
        throw new Error('User not authenticated')
      }

      // Get selected shipping cost
      const selectedShipping = shippingCosts.find(g => g.governorate === selectedGovernorate)
      const shippingCost = selectedShipping ? selectedShipping.cost : 50.00

      // Generate order number
      const orderNumber = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

      // Prepare order data
      const orderData = {
        customer_name: `${formik.values.firstName} ${formik.values.lastName}`,
        customer_email: formik.values.email,
        shipping_address: shippingAddress.details,
        shipping_city: shippingAddress.city,
        shipping_governorate: selectedGovernorate,
        shipping_phone: shippingAddress.phone,
        payment_method: 'cash', // Always cash on delivery
        items: cartItems.map(item => ({
          product_title: item.product.title,
          quantity: item.count,
          price: item.price,
          subtotal: item.price * item.count
        })),
        order_number: orderNumber,
        total_amount: total,
        subtotal: subtotal,
        shipping_cost: shippingCost
      }

      // 1. Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNumber,
          customer_name: orderData.customer_name,
          customer_email: orderData.customer_email,
          user_id: user.id,
          total_amount: total,
          shipping_address: orderData.shipping_address,
          shipping_city: orderData.shipping_city,
          shipping_governorate: orderData.shipping_governorate,
          shipping_phone: orderData.shipping_phone,
          payment_method: orderData.payment_method,
          shipping_cost: shippingCost,
          status: 'Pending'
        }])
        .select()
        .single()

      if (orderError) throw orderError

      // 2. Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_title: item.product.title,
        quantity: item.count,
        price: item.price
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // 3. Update product sales count
      for (const item of cartItems) {
        try {
          // First get current sales count
          const { data: product } = await supabase
            .from('products')
            .select('sales')
            .eq('id', item.product.id)
            .single()

          if (product) {
            const newSales = (product.sales || 0) + item.count

            await supabase
              .from('products')
              .update({ sales: newSales })
              .eq('id', item.product.id)
          }
        } catch (err) {
          console.error('Error updating product sales:', err)
          // Continue even if sales update fails
        }
      }

      // 4. Clear cart items for this user
      const { error: clearCartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)

      if (clearCartError) console.error('Error clearing cart:', clearCartError)

      // 5. Clear localStorage cart
      localStorage.removeItem('checkout_cart')

      toast.success('Order placed successfully! You will receive a confirmation email shortly.')

      setTimeout(() => {
        navigate('/')
      }, 2000)

    } catch (err) {
      console.error('Order error:', err)
      setApiError(err.message || 'Order failed. Please try again.')
      setLoading(false)
    }
  }

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      details: '',
      phone: '',
      city: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!selectedGovernorate) {
        toast.error('Please select a governorate')
        return
      }

      const shippingAddress = {
        details: values.details,
        phone: values.phone,
        city: values.city
      };

      await createOrder(shippingAddress);
    }
  })

  if (!cartItems.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 to-teal-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-teal-50/30">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-sm p-10 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm mx-4 border border-white/20">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/20"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-blue-500 absolute top-0 left-0"></div>
            </div>
            <p className="text-gray-700 font-semibold mt-6 text-lg">Processing your order</p>
            <p className="text-gray-500 text-sm mt-2 text-center">Please don't close this window<br />This may take a few moments</p>
          </div>
        </div>
      )}

      {/* Elegant Header */}
      <div className="relative bg-gradient-to-r from-white to-gray-50/80 backdrop-blur-sm border-b border-gray-100/50">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/3 via-transparent to-teal-500/3"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>

        <div className="relative max-w-6xl mx-auto px-5 lg:px-30 py-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-teal-400 w-[20px] h-[40px] rounded-lg shadow-lg"></div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Complete Your Order
              </h1>
            </div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
              You're just one step away from getting your favorite SportFlex delivered to your doorstep
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 lg:px-30 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Main Form */}
          <div className="lg:col-span-3">
            <form onSubmit={formik.handleSubmit} className="space-y-8">
              {/* Customer Information */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 p-8 lg:p-10 hover:shadow-xl transition-all duration-500">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-user text-white text-lg"></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                    <p className="text-gray-600">Tell us who you are</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div className="space-y-2">
                    <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formik.values.firstName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-5 py-4 border-2 rounded-2xl transition-all duration-300 text-gray-700 bg-white/70 backdrop-blur-sm ${formik.touched.firstName && formik.errors.firstName
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-gray-300'
                        } focus:outline-none placeholder-gray-400`}
                      placeholder="Enter your first name"
                    />
                    {formik.touched.firstName && formik.errors.firstName && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <i className="fas fa-exclamation-circle text-xs"></i>
                        {formik.errors.firstName}
                      </p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formik.values.lastName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-5 py-4 border-2 rounded-2xl transition-all duration-300 text-gray-700 bg-white/70 backdrop-blur-sm ${formik.touched.lastName && formik.errors.lastName
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-gray-300'
                        } focus:outline-none placeholder-gray-400`}
                      placeholder="Enter your last name"
                    />
                    {formik.touched.lastName && formik.errors.lastName && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <i className="fas fa-exclamation-circle text-xs"></i>
                        {formik.errors.lastName}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="md:col-span-2 space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-5 py-4 border-2 rounded-2xl transition-all duration-300 text-gray-700 bg-white/70 backdrop-blur-sm ${formik.touched.email && formik.errors.email
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-gray-300'
                        } focus:outline-none placeholder-gray-400`}
                      placeholder="your.email@example.com"
                    />
                    {formik.touched.email && formik.errors.email && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <i className="fas fa-exclamation-circle text-xs"></i>
                        {formik.errors.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Shipping Information */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 p-8 lg:p-10 hover:shadow-xl transition-all duration-500">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-map-marker-alt text-white text-lg"></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Delivery Address</h2>
                    <p className="text-gray-600">Where should we send your order?</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Address */}
                  <div className="space-y-2">
                    <label htmlFor="details" className="block text-sm font-semibold text-gray-700">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      id="details"
                      name="details"
                      value={formik.values.details}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-5 py-4 border-2 rounded-2xl transition-all duration-300 text-gray-700 bg-white/70 backdrop-blur-sm ${formik.touched.details && formik.errors.details
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                        : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-gray-300'
                        } focus:outline-none placeholder-gray-400`}
                      placeholder="Enter your complete address with landmarks"
                    />
                    {formik.touched.details && formik.errors.details && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <i className="fas fa-exclamation-circle text-xs"></i>
                        {formik.errors.details}
                      </p>
                    )}
                  </div>

                  {/* Governorate Selection */}
                  <div className="space-y-2">
                    <label htmlFor="governorate" className="block text-sm font-semibold text-gray-700">
                      Governorate *
                    </label>
                    <select
                      id="governorate"
                      value={selectedGovernorate}
                      onChange={(e) => setSelectedGovernorate(e.target.value)}
                      required
                      className="w-full px-5 py-4 border-2 rounded-2xl transition-all duration-300 text-gray-700 bg-white/70 backdrop-blur-sm border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-gray-300 focus:outline-none"
                    >
                      <option value="">Select your governorate</option>
                      {shippingCosts.map((governorate) => (
                        <option key={governorate.id} value={governorate.governorate}>
                          {governorate.governorate} - EGP {governorate.cost.toFixed(2)} ({governorate.delivery_days} days)
                        </option>
                      ))}
                    </select>
                    {selectedGovernorate && shippingCosts.find(g => g.governorate === selectedGovernorate) && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-800">
                              Shipping to {selectedGovernorate}
                            </p>
                            <p className="text-xs text-blue-600">
                              Delivery within {shippingCosts.find(g => g.governorate === selectedGovernorate).delivery_days} days
                            </p>
                          </div>
                          <div className="text-blue-700 font-bold">
                            EGP {shippingCosts.find(g => g.governorate === selectedGovernorate).cost.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* City */}
                    <div className="space-y-2">
                      <label htmlFor="city" className="block text-sm font-semibold text-gray-700">
                        City/District *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formik.values.city}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`w-full px-5 py-4 border-2 rounded-2xl transition-all duration-300 text-gray-700 bg-white/70 backdrop-blur-sm ${formik.touched.city && formik.errors.city
                          ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                          : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-gray-300'
                          } focus:outline-none placeholder-gray-400`}
                        placeholder="Enter your city or district"
                      />
                      {formik.touched.city && formik.errors.city && (
                        <p className="text-red-500 text-sm flex items-center gap-1">
                          <i className="fas fa-exclamation-circle text-xs"></i>
                          {formik.errors.city}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">
                        Phone Number (Egyptian) *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formik.values.phone}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`w-full px-5 py-4 border-2 rounded-2xl transition-all duration-300 text-gray-700 bg-white/70 backdrop-blur-sm ${formik.touched.phone && formik.errors.phone
                          ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-100'
                          : 'border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-gray-300'
                          } focus:outline-none placeholder-gray-400`}
                        placeholder="01XXXXXXXXX"
                      />
                      {formik.touched.phone && formik.errors.phone && (
                        <p className="text-red-500 text-sm flex items-center gap-1">
                          <i className="fas fa-exclamation-circle text-xs"></i>
                          {formik.errors.phone}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">Must be an Egyptian number starting with 01 (11 digits)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method - Cash on Delivery Only */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 p-8 lg:p-10 hover:shadow-xl transition-all duration-500">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-money-bill-wave text-white text-lg"></i>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Payment Method</h2>
                    <p className="text-gray-600">Pay when you receive your order</p>
                  </div>
                </div>

                <div className="p-6 rounded-2xl border-2 border-green-500 bg-gradient-to-br from-green-500/10 to-green-500/5 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-green-100">
                      <i className="fas fa-money-bill-wave text-2xl text-green-600"></i>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">Cash on Delivery</h3>
                      <p className="text-sm text-gray-600 mt-1">Pay when you receive your order</p>
                      <div className="flex items-center gap-3 mt-3">
                        <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <i className="fas fa-check-circle"></i>
                          No additional fees
                        </p>
                        <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <i className="fas fa-check-circle"></i>
                          Safe and convenient
                        </p>
                        <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                          <i className="fas fa-check-circle"></i>
                          Available everywhere in Egypt
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="flex items-start gap-3">
                    <i className="fas fa-info-circle text-blue-500 mt-1"></i>
                    <div>
                      <p className="text-sm text-blue-800 font-medium">Cash on Delivery Only</p>
                      <p className="text-xs text-blue-600 mt-1">
                        We currently only accept cash payments upon delivery. Our delivery agent will collect the payment when they deliver your order.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {apiError && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3">
                    <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
                    <div>
                      <p className="text-red-800 font-semibold">Order Error</p>
                      <p className="text-red-600 text-sm mt-1">{apiError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Hidden submit button to fix Formik warning */}
              <button type="submit" className="hidden">Submit</button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 sticky top-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-400 rounded-xl flex items-center justify-center">
                  <i className="fas fa-shopping-bag text-white"></i>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>
              </div>

              {/* Cart Items */}
              <div className="space-y-4 mb-8 max-h-64 overflow-y-auto custom-scrollbar">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50/50 to-teal-50/50 rounded-2xl border border-gray-100/50">
                    <img
                      src={item.product.imageCover || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop'}
                      alt={item.product.title}
                      className="w-16 h-16 rounded-xl object-contain border border-gray-100 bg-white"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{item.product.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">Quantity: {item.count}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">EGP {(item.price * item.count).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">EGP {item.price.toFixed(2)} each</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown (TAX REMOVED) */}
              <div className="space-y-4 mb-8 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-2">
                    <i className="fas fa-shopping-cart text-sm"></i>
                    Subtotal
                  </span>
                  <span className="font-medium">EGP {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-2">
                    <i className="fas fa-truck text-sm"></i>
                    Shipping
                  </span>
                  <span className="font-medium">EGP {shipping.toFixed(2)}</span>
                </div>
                {/* TAX LINE REMOVED */}
                <div className="flex justify-between text-xl font-bold text-gray-900 pt-4 border-t border-gray-200">
                  <span>Total</span>
                  <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">EGP {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Place Order Button - Added type="button" */}
              <button
                type="button"
                onClick={formik.handleSubmit}
                disabled={loading || !formik.isValid || !selectedGovernorate}
                className={`w-full py-5 px-6 rounded-2xl font-bold text-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-500/20 shadow-lg ${loading || !formik.isValid || !selectedGovernorate
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600 hover:scale-105 hover:shadow-xl'
                  }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <i className="fas fa-spinner fa-spin"></i>
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <i className="fas fa-money-bill-wave"></i>
                    Place Order (Cash on Delivery)
                    <i className="fas fa-arrow-right ml-2"></i>
                  </span>
                )}
              </button>

              {/* Payment Info Note */}
              <div className="mt-6 p-4 bg-green-50 rounded-2xl border border-green-100">
                <div className="flex items-start gap-3">
                  <i className="fas fa-money-bill-wave text-green-600 mt-1"></i>
                  <div>
                    <p className="text-sm text-green-800 font-medium">Cash Payment Instructions</p>
                    <p className="text-xs text-green-600 mt-1">
                      Please prepare exact cash amount (EGP {total.toFixed(2)}) for our delivery agent. You'll receive a confirmation email with order details.
                    </p>
                  </div>
                </div>
              </div>

              {/* Security & Trust Badges */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <i className="fas fa-shield-alt text-green-500"></i>
                  <span>Secure cash on delivery</span>
                </div>
                <div className="flex items-center justify-center gap-6 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <i className="fas fa-truck"></i>
                    Fast Delivery
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fas fa-headset"></i>
                    24/7 Support
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fas fa-award"></i>
                    Satisfaction Guaranteed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed inline style - moved to separate style tag */}
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          .font-arabic {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            direction: rtl;
          }
        `}
      </style>
    </div>
  )
}