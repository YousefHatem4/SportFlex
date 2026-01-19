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
  const [discount, setDiscount] = useState(0)
  const [total, setTotal] = useState(0)
  const [shippingCosts, setShippingCosts] = useState([])
  const [selectedGovernorate, setSelectedGovernorate] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState(null)
  const [promoLoading, setPromoLoading] = useState(false)

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
      calculateTotals()
    }
  }, [selectedGovernorate, shippingCosts, discount])

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
          calculateTotals(calculatedSubtotal)
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

  const calculateTotals = (customSubtotal = null) => {
    const calculatedSubtotal = customSubtotal !== null ? customSubtotal : subtotal;

    if (!selectedGovernorate) return

    const selectedShipping = shippingCosts.find(g => g.governorate === selectedGovernorate)
    const shippingCost = selectedShipping ? selectedShipping.cost : 50.00 // Default cost

    // Calculate total (no tax)
    const calculatedTotal = Math.max(0, calculatedSubtotal + shippingCost - discount)

    setShipping(shippingCost)
    setTotal(calculatedTotal)
  }

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    if (!user) {
      toast.error('Please login to apply promo code');
      return;
    }

    setPromoLoading(true);
    try {
      // Call the stored procedure
      const { data, error } = await supabase.rpc('validate_promo_code', {
        p_promo_code: promoCode.toUpperCase(),
        p_user_id: user.id,
        p_order_amount: subtotal
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        throw error;
      }

      console.log('Promo validation response:', data);

      // Handle the array response properly
      if (data && data.length > 0) {
        const promoData = data[0];

        if (promoData.is_valid) {
          setDiscount(promoData.discount_amount);
          setAppliedPromo({
            code: promoCode.toUpperCase(),
            discount_type: promoData.discount_type,
            discount_value: promoData.discount_value,
            discount_amount: promoData.discount_amount
          });
          toast.success(promoData.message || 'Promo code applied successfully!');
          calculateTotals();
        } else {
          toast.error(promoData.message || 'Invalid promo code');
        }
      } else {
        toast.error('Invalid promo code');
      }
    } catch (error) {
      console.error('Error applying promo code:', error);
      toast.error(error.message || 'Failed to apply promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromoCode = () => {
    setPromoCode('');
    setAppliedPromo(null);
    setDiscount(0);
    calculateTotals();
    toast.success('Promo code removed');
  };

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

      // Get promo code ID if applied
      let promoCodeId = null;
      if (appliedPromo) {
        const { data: promoData } = await supabase
          .from('promo_codes')
          .select('id')
          .eq('code', appliedPromo.code)
          .single();

        if (promoData) {
          promoCodeId = promoData.id;
        }
      }

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
        shipping_cost: shippingCost,
        discount_amount: discount
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
          discount_amount: discount,
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

      // 3. Mark promo code as used if applied
      if (promoCodeId) {
        await supabase.rpc('mark_promo_code_used', {
          p_promo_code_id: promoCodeId,
          p_user_id: user.id,
          p_order_id: order.id,
          p_discount_amount: discount
        });
      }

      // 4. Update product sales count
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

      // 5. Clear cart items for this user
      const { error: clearCartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)

      if (clearCartError) console.error('Error clearing cart:', clearCartError)

      // 6. Clear localStorage cart
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
                      onChange={(e) => {
                        formik.handleChange(e);
                      }}
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
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg mb-1">Cash on Delivery</h3>
                      <p className="text-sm text-gray-600 mb-3">Pay when you receive your order</p>
                      <div className="flex flex-wrap gap-2">
                        <p className="text-xs text-green-600 font-medium flex items-center gap-1 whitespace-nowrap">
                          <i className="fas fa-check-circle"></i>
                          No additional fees
                        </p>
                        <p className="text-xs text-green-600 font-medium flex items-center gap-1 whitespace-nowrap">
                          <i className="fas fa-check-circle"></i>
                          Safe and convenient
                        </p>
                        <p className="text-xs text-green-600 font-medium flex items-center gap-1 whitespace-nowrap">
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

              {/* Promo Code Section - Fixed overflow issue */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <i className="fas fa-tag text-purple-500"></i>
                  <h3 className="font-semibold text-gray-800">Promo Code</h3>
                </div>

                {appliedPromo ? (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-check-circle text-green-500"></i>
                        <span className="font-mono font-bold text-green-800">{appliedPromo.code}</span>
                      </div>
                      <button
                        onClick={handleRemovePromoCode}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <p className="text-sm text-green-700 mb-1">
                      {appliedPromo.discount_type === 'percentage'
                        ? `${appliedPromo.discount_value}% discount applied`
                        : `EGP ${appliedPromo.discount_value} discount applied`
                      }
                    </p>
                    <p className="text-lg font-bold text-green-800">
                      - EGP {appliedPromo.discount_amount.toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Enter promo code"
                        className="flex-1 min-w-0 px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 focus:outline-none font-mono"
                        disabled={promoLoading}
                      />
                      <button
                        onClick={handleApplyPromoCode}
                        disabled={promoLoading || !promoCode.trim()}
                        className={`flex-shrink-0 px-6 py-3 rounded-2xl font-medium transition-all duration-300 whitespace-nowrap ${promoLoading || !promoCode.trim()
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 hover:scale-105 active:scale-95'
                          }`}
                      >
                        {promoLoading ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          'Apply'
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 text-center md:text-left">
                      Enter your promo code and click apply to get discounts
                    </p>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-4 mb-8 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-2">
                    <i className="fas fa-shopping-cart text-sm"></i>
                    Subtotal
                  </span>
                  <span className="font-medium">EGP {subtotal.toFixed(2)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-2">
                      <i className="fas fa-tag text-sm"></i>
                      Discount
                    </span>
                    <span className="font-medium">- EGP {discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-2">
                    <i className="fas fa-truck text-sm"></i>
                    Shipping
                  </span>
                  <span className="font-medium">EGP {shipping.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-xl font-bold text-gray-900 pt-4 border-t border-gray-200">
                  <span>Total</span>
                  <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">EGP {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                type="button"
                onClick={formik.handleSubmit}
                disabled={loading || !formik.isValid || !selectedGovernorate}
                className={`w-full py-5 px-6 rounded-2xl font-bold text-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-500/20 shadow-lg ${loading || !formik.isValid || !selectedGovernorate
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600 hover:scale-105 hover:shadow-xl active:scale-95'
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
                    <span className="hidden sm:inline">Place Order (Cash on Delivery)</span>
                    <span className="sm:hidden">Place Order (COD)</span>
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
          
          /* Mobile & Tablet Optimizations */
          @media (max-width: 767px) {
            .px-5 {
              padding-left: 1rem !important;
              padding-right: 1rem !important;
            }
            
            .py-10 {
              padding-top: 2rem !important;
              padding-bottom: 2rem !important;
            }
            
            .p-8 {
              padding: 1.5rem !important;
            }
            
            .text-2xl {
              font-size: 1.5rem !important;
              line-height: 2rem !important;
            }
            
            .text-3xl {
              font-size: 1.875rem !important;
              line-height: 2.25rem !important;
            }
            
            .py-4 {
              padding-top: 0.875rem !important;
              padding-bottom: 0.875rem !important;
            }
            
            .gap-10 {
              gap: 2rem !important;
            }
            
            .gap-6 {
              gap: 1rem !important;
            }
            
            .space-y-8 > * + * {
              margin-top: 1.5rem !important;
            }
            
            .w-12 {
              width: 2.5rem !important;
            }
            
            .h-12 {
              height: 2.5rem !important;
            }
            
            .mb-8 {
              margin-bottom: 1.5rem !important;
            }
            
            .text-lg {
              font-size: 1rem !important;
            }
            
            /* Fix for Cash on Delivery box text overflow */
            .flex.flex-wrap.gap-2 {
              gap: 0.5rem !important;
            }
            
            .whitespace-nowrap {
              white-space: normal !important;
              font-size: 0.7rem !important;
              padding: 0.25rem 0.5rem;
              background: rgba(34, 197, 94, 0.1);
              border-radius: 0.5rem;
            }
            
            .w-14 {
              width: 3rem !important;
            }
            
            .h-14 {
              height: 3rem !important;
            }
            
            .text-2xl {
              font-size: 1.25rem !important;
            }
            
            .p-6 {
              padding: 1rem !important;
            }
            
            .gap-4 {
              gap: 1rem !important;
            }
            
            .text-lg {
              font-size: 1rem !important;
            }
          }
          
          @media (min-width: 768px) and (max-width: 1023px) {
            .max-w-6xl {
              max-width: 100% !important;
              padding-left: 1.5rem !important;
              padding-right: 1.5rem !important;
            }
            
            .lg\\:px-30 {
              padding-left: 2rem !important;
              padding-right: 2rem !important;
            }
            
            .gap-10 {
              gap: 3rem !important;
            }
            
            .p-10 {
              padding: 2rem !important;
            }
            
            .grid-cols-1 {
              grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
            }
            
            .lg\\:col-span-3, .lg\\:col-span-2 {
              grid-column: span 1 / span 1 !important;
            }
            
            .space-y-8 > * + * {
              margin-top: 2rem !important;
            }
            
            .py-5 {
              padding-top: 1.25rem !important;
              padding-bottom: 1.25rem !important;
            }
            
            .text-xl {
              font-size: 1.25rem !important;
            }
            
            .sticky {
              position: relative !important;
              top: 0 !important;
            }
            
            /* Tablet fix for Cash on Delivery box */
            .flex.flex-wrap.gap-2 {
              flex-wrap: wrap !important;
            }
            
            .whitespace-nowrap {
              white-space: nowrap !important;
            }
          }
          
          /* Large screen fix only - Prevent button overflow */
          @media (min-width: 1024px) {
            .flex-1.min-w-0 {
              min-width: 0 !important;
            }
            
            /* Fixed promo code section to prevent button overflow */
            .space-y-3 > .flex.gap-2 {
              flex-wrap: nowrap !important;
            }
            
            .flex-1.min-w-0 {
              flex: 1 1 0% !important;
              min-width: 0 !important;
            }
            
            .flex-shrink-0 {
              flex-shrink: 0 !important;
            }
            
            .whitespace-nowrap {
              white-space: nowrap !important;
            }
            
            /* Fixed Cash on Delivery section */
            .flex.flex-wrap.gap-2 {
              gap: 0.75rem !important;
            }
          }
        `}
      </style>
    </div>
  )
}