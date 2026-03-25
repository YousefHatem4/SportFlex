import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../supabaseClient';
import {
  FaUser,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaShoppingBag,
  FaTag,
  FaCheckCircle,
  FaTimes,
  FaShoppingCart,
  FaTruck,
  FaHeadset,
  FaShieldAlt,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaSpinner,
  FaArrowRight,
  FaMoneyBill,
  FaCreditCard,
  FaLock,
  FaPhone,
  FaMobileAlt,
  FaQrcode,
  FaBuilding,
  FaReceipt
} from 'react-icons/fa';

const DEFAULT_SHIPPING_COST = 50.00;

const PriceBreakdown = React.memo(({ subtotal, discount, shipping, total, isDarkMode }) => (
  <div className={`space-y-4 mb-8 pb-6 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
    <div className="flex justify-between">
      <span className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        <FaShoppingCart className="text-sm" />
        Subtotal
      </span>
      <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        EGP {subtotal.toFixed(2)}
      </span>
    </div>

    {discount > 0 && (
      <div className="flex justify-between">
        <span className={`flex items-center gap-2 ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
          <FaTag className="text-sm" />
          Discount
        </span>
        <span className={`font-medium ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
          - EGP {discount.toFixed(2)}
        </span>
      </div>
    )}

    <div className="flex justify-between">
      <span className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        <FaTruck className="text-sm" />
        Shipping
      </span>
      <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        EGP {shipping.toFixed(2)}
      </span>
    </div>

    <div className={`flex justify-between text-xl font-bold pt-4 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
      <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Total</span>
      <span className={`bg-gradient-to-r bg-clip-text text-transparent
        ${isDarkMode ? 'from-cyan-400 to-cyan-300' : 'from-cyan-700 to-cyan-600'}`}>
        EGP {total.toFixed(2)}
      </span>
    </div>
  </div>
));

const CartItem = React.memo(({ item, isDarkMode }) => (
  <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors duration-300
    ${isDarkMode
      ? 'bg-gradient-to-r from-cyan-900/20 to-cyan-800/20 border-gray-800/50'
      : 'bg-gradient-to-r from-cyan-50 to-blue-50 border-gray-200'}`}>
    <img
      src={item.product.imageCover || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop'}
      alt={item.product.title}
      className={`w-16 h-16 rounded-xl object-contain border
        ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}
    />
    <div className="flex-1 min-w-0">
      <h4 className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        {item.product.title}
      </h4>
      <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Quantity: {item.count}
      </p>
    </div>
    <div className="text-right">
      <p className={`font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
        EGP {(item.price * item.count).toFixed(2)}
      </p>
      <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        EGP {item.price.toFixed(2)} each
      </p>
    </div>
  </div>
));

export default function Checkout() {
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const [shippingCosts, setShippingCosts] = useState([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  const navigate = useNavigate();

  // Memoized calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => total + (item.price * item.count), 0);
  }, [cartItems]);

  const shipping = useMemo(() => {
    if (!selectedGovernorate) return DEFAULT_SHIPPING_COST;
    const selectedShipping = shippingCosts.find(g => g.governorate === selectedGovernorate);
    return selectedShipping ? selectedShipping.cost : DEFAULT_SHIPPING_COST;
  }, [selectedGovernorate, shippingCosts]);

  const discount = useMemo(() => {
    return appliedPromo?.discount_amount || 0;
  }, [appliedPromo]);

  const total = useMemo(() => {
    return Math.max(0, subtotal + shipping - discount);
  }, [subtotal, shipping, discount]);

  // Theme change listener
  useEffect(() => {
    const checkTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      setIsDarkMode(savedTheme ? savedTheme === 'dark' : true);
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          setIsDarkMode(isDark);
        }
      });
    });

    window.addEventListener('storage', checkTheme);
    observer.observe(document.documentElement, { attributes: true });

    return () => {
      window.removeEventListener('storage', checkTheme);
      observer.disconnect();
    };
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const fetchShippingCosts = async () => {
    try {
      const { data, error } = await supabase
        .from('shipping_costs')
        .select('*')
        .eq('is_active', true)
        .order('governorate');

      if (error) throw error;
      setShippingCosts(data || []);

      if (data && data.length > 0) {
        const cairo = data.find(g => g.governorate === 'Cairo');
        setSelectedGovernorate(cairo ? 'Cairo' : data[0].governorate);
      }
    } catch (error) {
      console.error('Error fetching shipping costs:', error);
      toast.error('Failed to load shipping costs');
    }
  };

  const loadCartFromStorage = () => {
    try {
      const storedCart = localStorage.getItem('checkout_cart');
      if (storedCart) {
        const cartData = JSON.parse(storedCart);
        if (cartData.products && cartData.products.length > 0) {
          setCartItems(cartData.products);
        } else {
          navigate('/cart');
        }
      } else {
        navigate('/cart');
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      navigate('/cart');
    }
  };

  useEffect(() => {
    const initializeCheckout = async () => {
      await checkUser();
      loadCartFromStorage();
      await fetchShippingCosts();
      document.title = 'Checkout - SportFlex Store';
    };

    initializeCheckout();
  }, []);

  const handleApplyPromoCode = useCallback(async () => {
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
      const { data, error } = await supabase.rpc('validate_promo_code', {
        p_promo_code: promoCode.toUpperCase(),
        p_user_id: user.id,
        p_order_amount: subtotal
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const promoData = data[0];
        if (promoData.is_valid) {
          setAppliedPromo({
            code: promoCode.toUpperCase(),
            discount_type: promoData.discount_type,
            discount_value: promoData.discount_value,
            discount_amount: promoData.discount_amount
          });
          toast.success(promoData.message || 'Promo code applied successfully!');
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
  }, [promoCode, user, subtotal]);

  const handleRemovePromoCode = useCallback(() => {
    setPromoCode('');
    setAppliedPromo(null);
    toast.success('Promo code removed');
  }, []);

  const validationSchema = useMemo(() => Yup.object({
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
  }), []);

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
        toast.error('Please select a governorate');
        return;
      }

      await createOrder({
        details: values.details,
        phone: values.phone,
        city: values.city
      });
    }
  });

  const createOrder = useCallback(async (shippingAddress) => {
    try {
      setLoading(true);

      if (!user) throw new Error('User not authenticated');

      const selectedShipping = shippingCosts.find(g => g.governorate === selectedGovernorate);
      const shippingCost = selectedShipping ? selectedShipping.cost : DEFAULT_SHIPPING_COST;
      const orderNumber = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

      let promoCodeId = null;
      if (appliedPromo) {
        const { data: promoData } = await supabase
          .from('promo_codes')
          .select('id')
          .eq('code', appliedPromo.code)
          .single();

        if (promoData) promoCodeId = promoData.id;
      }

      const orderStatus = 'pending';
      const orderPaymentStatus = paymentMethod === 'online' ? 'paid' : 'pending';

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNumber,
          customer_name: `${formik.values.firstName} ${formik.values.lastName}`,
          customer_email: formik.values.email,
          user_id: user.id,
          total_amount: total,
          subtotal: subtotal,
          shipping_address: shippingAddress.details,
          shipping_city: shippingAddress.city,
          shipping_governorate: selectedGovernorate,
          shipping_phone: shippingAddress.phone,
          payment_method: paymentMethod,
          shipping_cost: shippingCost,
          discount_amount: discount,
          status: orderStatus,
          payment_status: orderPaymentStatus
        }])
        .select('*')
        .single();

      if (orderError) throw orderError;

      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_title: item.product.title,
        quantity: item.count,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      if (promoCodeId) {
        await supabase.rpc('mark_promo_code_used', {
          p_promo_code_id: promoCodeId,
          p_user_id: user.id,
          p_order_id: order.id,
          p_discount_amount: discount
        });
      }

      for (const item of cartItems) {
        try {
          const { data: product } = await supabase
            .from('products')
            .select('sales')
            .eq('id', item.product.id)
            .single();

          if (product) {
            await supabase
              .from('products')
              .update({ sales: (product.sales || 0) + item.count })
              .eq('id', item.product.id);
          }
        } catch (err) {
          console.error('Error updating product sales:', err);
        }
      }

      await supabase.from('cart_items').delete().eq('user_id', user.id);
      localStorage.removeItem('checkout_cart');

      toast.success('Order placed successfully! You will receive a confirmation email shortly.');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      console.error('Order error:', err);
      setApiError(err.message || 'Order failed. Please try again.');
      setLoading(false);
    }
  }, [user, selectedGovernorate, shippingCosts, appliedPromo, paymentMethod, formik.values, total, subtotal, discount, cartItems, navigate]);

  if (!cartItems.length) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300
        ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4
            ${isDarkMode ? 'border-cyan-500' : 'border-cyan-700'}`}></div>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      {/* Loading Overlay */}
      {loading && (
        <div className={`fixed inset-0 bg-opacity-40 backdrop-blur-md z-50 flex items-center justify-center
          ${isDarkMode ? 'bg-black' : 'bg-gray-900'}`}>
          <div className={`p-10 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm mx-4 border
            ${isDarkMode ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'}`}>
            <div className="relative">
              <div className={`animate-spin rounded-full h-16 w-16 border-4
                ${isDarkMode ? 'border-cyan-500/20' : 'border-cyan-700/20'}`}></div>
              <div className={`animate-spin rounded-full h-16 w-16 border-4 border-t-current absolute top-0 left-0
                ${isDarkMode ? 'border-t-cyan-500' : 'border-t-cyan-700'}`}></div>
            </div>
            <p className={`font-semibold mt-6 text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Processing your order
            </p>
            <p className={`text-sm mt-2 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Please don't close this window<br />This may take a few moments
            </p>
          </div>
        </div>
      )}

      <header className={`relative border-b ${isDarkMode
        ? 'bg-gradient-to-r from-gray-900 to-gray-800/80 border-gray-800/50'
        : 'bg-gradient-to-r from-gray-50 to-white border-gray-200'}`}>
        <div className={`absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-cyan-500/5
          ${isDarkMode ? 'from-cyan-500/5' : 'from-cyan-700/5'}`}></div>
        <div className="relative max-w-6xl mx-auto px-5 lg:px-30 py-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className={`w-[20px] h-[40px] rounded-lg shadow-lg
                ${isDarkMode ? 'bg-gradient-to-r from-cyan-500 to-cyan-400' : 'bg-gradient-to-r from-cyan-700 to-cyan-600'}`}></div>
              <h1 className={`text-3xl lg:text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent
                ${isDarkMode ? 'from-cyan-400 to-cyan-300' : 'from-cyan-700 to-cyan-600'}`}>
                Complete Your Order
              </h1>
            </div>
            <p className={`text-lg max-w-2xl mx-auto leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              You're just one step away from getting your favorite SportFlex delivered to your doorstep
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 lg:px-30 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Main Form */}
          <div className="lg:col-span-3">
            <form onSubmit={formik.handleSubmit} className="space-y-8">
              {/* Customer Information */}
              <section className={`rounded-3xl shadow-lg border p-8 lg:p-10 hover:shadow-xl transition-all duration-300
                ${isDarkMode ? 'bg-gray-900/80 backdrop-blur-sm border-gray-800/50' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg
                    ${isDarkMode ? 'bg-gradient-to-br from-cyan-500 to-cyan-400' : 'bg-gradient-to-br from-cyan-700 to-cyan-600'}`}>
                    <FaUser className="text-white text-lg" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Personal Information
                    </h2>
                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Tell us who you are</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div className="space-y-2">
                    <label htmlFor="firstName" className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formik.values.firstName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-5 py-4 border-2 rounded-2xl transition-all duration-300 focus:outline-none
                        ${isDarkMode ? 'text-white bg-gray-800/70 backdrop-blur-sm' : 'text-gray-900 bg-gray-50'} 
                        ${formik.touched.firstName && formik.errors.firstName
                          ? 'border-red-500/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                          : isDarkMode
                            ? 'border-gray-700 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 hover:border-gray-600'
                            : 'border-gray-200 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10 hover:border-gray-300'
                        }`}
                      placeholder="Enter your first name"
                      aria-required="true"
                      aria-invalid={formik.touched.firstName && !!formik.errors.firstName}
                    />
                    {formik.touched.firstName && formik.errors.firstName && (
                      <p className="text-red-400 text-sm flex items-center gap-1" role="alert">
                        <FaExclamationCircle className="text-xs" aria-hidden="true" />
                        {formik.errors.firstName}
                      </p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div className="space-y-2">
                    <label htmlFor="lastName" className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formik.values.lastName}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-5 py-4 border-2 rounded-2xl transition-all duration-300 focus:outline-none
                        ${isDarkMode ? 'text-white bg-gray-800/70 backdrop-blur-sm' : 'text-gray-900 bg-gray-50'} 
                        ${formik.touched.lastName && formik.errors.lastName
                          ? 'border-red-500/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                          : isDarkMode
                            ? 'border-gray-700 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 hover:border-gray-600'
                            : 'border-gray-200 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10 hover:border-gray-300'
                        }`}
                      placeholder="Enter your last name"
                      aria-required="true"
                      aria-invalid={formik.touched.lastName && !!formik.errors.lastName}
                    />
                    {formik.touched.lastName && formik.errors.lastName && (
                      <p className="text-red-400 text-sm flex items-center gap-1" role="alert">
                        <FaExclamationCircle className="text-xs" aria-hidden="true" />
                        {formik.errors.lastName}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="md:col-span-2 space-y-2">
                    <label htmlFor="email" className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-5 py-4 border-2 rounded-2xl transition-all duration-300 focus:outline-none
                        ${isDarkMode ? 'text-white bg-gray-800/70 backdrop-blur-sm' : 'text-gray-900 bg-gray-50'} 
                        ${formik.touched.email && formik.errors.email
                          ? 'border-red-500/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                          : isDarkMode
                            ? 'border-gray-700 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 hover:border-gray-600'
                            : 'border-gray-200 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10 hover:border-gray-300'
                        }`}
                      placeholder="your.email@example.com"
                      aria-required="true"
                      aria-invalid={formik.touched.email && !!formik.errors.email}
                    />
                    {formik.touched.email && formik.errors.email && (
                      <p className="text-red-400 text-sm flex items-center gap-1" role="alert">
                        <FaExclamationCircle className="text-xs" aria-hidden="true" />
                        {formik.errors.email}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Shipping Information */}
              <section className={`rounded-3xl shadow-lg border p-8 lg:p-10 hover:shadow-xl transition-all duration-300
                ${isDarkMode ? 'bg-gray-900/80 backdrop-blur-sm border-gray-800/50' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg
                    ${isDarkMode ? 'bg-gradient-to-br from-cyan-500 to-cyan-400' : 'bg-gradient-to-br from-cyan-700 to-cyan-600'}`}>
                    <FaMapMarkerAlt className="text-white text-lg" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Delivery Address
                    </h2>
                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Where should we send your order?</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Address */}
                  <div className="space-y-2">
                    <label htmlFor="details" className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Street Address *
                    </label>
                    <input
                      type="text"
                      id="details"
                      name="details"
                      value={formik.values.details}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`w-full px-5 py-4 border-2 rounded-2xl transition-all duration-300 focus:outline-none
                        ${isDarkMode ? 'text-white bg-gray-800/70 backdrop-blur-sm' : 'text-gray-900 bg-gray-50'} 
                        ${formik.touched.details && formik.errors.details
                          ? 'border-red-500/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                          : isDarkMode
                            ? 'border-gray-700 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 hover:border-gray-600'
                            : 'border-gray-200 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10 hover:border-gray-300'
                        }`}
                      placeholder="Enter your complete address with landmarks"
                      aria-required="true"
                      aria-invalid={formik.touched.details && !!formik.errors.details}
                    />
                    {formik.touched.details && formik.errors.details && (
                      <p className="text-red-400 text-sm flex items-center gap-1" role="alert">
                        <FaExclamationCircle className="text-xs" aria-hidden="true" />
                        {formik.errors.details}
                      </p>
                    )}
                  </div>

                  {/* Governorate Selection */}
                  <div className="space-y-2">
                    <label htmlFor="governorate" className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Governorate *
                    </label>
                    <select
                      id="governorate"
                      value={selectedGovernorate}
                      onChange={(e) => setSelectedGovernorate(e.target.value)}
                      required
                      className={`w-full px-5 py-4 border-2 rounded-2xl transition-all duration-300 focus:outline-none
                        ${isDarkMode
                          ? 'text-white bg-gray-800/70 backdrop-blur-sm border-gray-700 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 hover:border-gray-600'
                          : 'text-gray-900 bg-gray-50 border-gray-200 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10 hover:border-gray-300'}`}
                      aria-required="true"
                    >
                      <option value="" className={isDarkMode ? 'bg-gray-900' : 'bg-white'}>Select your governorate</option>
                      {shippingCosts.map((governorate) => (
                        <option key={governorate.id} value={governorate.governorate} className={isDarkMode ? 'bg-gray-900' : 'bg-white'}>
                          {governorate.governorate} - EGP {governorate.cost.toFixed(2)} ({governorate.delivery_days} days)
                        </option>
                      ))}
                    </select>
                    {selectedGovernorate && shippingCosts.find(g => g.governorate === selectedGovernorate) && (
                      <div className={`mt-2 p-3 rounded-xl border
                        ${isDarkMode ? 'bg-cyan-900/30 border-cyan-800/50' : 'bg-cyan-50 border-cyan-200'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                              Shipping to {selectedGovernorate}
                            </p>
                            <p className={`text-xs ${isDarkMode ? 'text-cyan-500' : 'text-cyan-600'}`}>
                              Delivery within {shippingCosts.find(g => g.governorate === selectedGovernorate).delivery_days} days
                            </p>
                          </div>
                          <div className={`font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                            EGP {shippingCosts.find(g => g.governorate === selectedGovernorate).cost.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* City */}
                    <div className="space-y-2">
                      <label htmlFor="city" className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        City/District *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formik.values.city}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`w-full px-5 py-4 border-2 rounded-2xl transition-all duration-300 focus:outline-none
                          ${isDarkMode ? 'text-white bg-gray-800/70 backdrop-blur-sm' : 'text-gray-900 bg-gray-50'} 
                          ${formik.touched.city && formik.errors.city
                            ? 'border-red-500/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                            : isDarkMode
                              ? 'border-gray-700 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 hover:border-gray-600'
                              : 'border-gray-200 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10 hover:border-gray-300'
                          }`}
                        placeholder="Enter your city or district"
                        aria-required="true"
                        aria-invalid={formik.touched.city && !!formik.errors.city}
                      />
                      {formik.touched.city && formik.errors.city && (
                        <p className="text-red-400 text-sm flex items-center gap-1" role="alert">
                          <FaExclamationCircle className="text-xs" aria-hidden="true" />
                          {formik.errors.city}
                        </p>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <label htmlFor="phone" className={`block text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Phone Number (Egyptian) *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formik.values.phone}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        className={`w-full px-5 py-4 border-2 rounded-2xl transition-all duration-300 focus:outline-none
                          ${isDarkMode ? 'text-white bg-gray-800/70 backdrop-blur-sm' : 'text-gray-900 bg-gray-50'} 
                          ${formik.touched.phone && formik.errors.phone
                            ? 'border-red-500/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                            : isDarkMode
                              ? 'border-gray-700 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 hover:border-gray-600'
                              : 'border-gray-200 focus:border-cyan-700 focus:ring-4 focus:ring-cyan-700/10 hover:border-gray-300'
                          }`}
                        placeholder="01XXXXXXXXX"
                        aria-required="true"
                        aria-invalid={formik.touched.phone && !!formik.errors.phone}
                      />
                      {formik.touched.phone && formik.errors.phone && (
                        <p className="text-red-400 text-sm flex items-center gap-1" role="alert">
                          <FaExclamationCircle className="text-xs" aria-hidden="true" />
                          {formik.errors.phone}
                        </p>
                      )}
                      <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Must be an Egyptian number starting with 01 (11 digits)
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Payment Method Selection */}
              <section className={`rounded-3xl shadow-lg border p-8 lg:p-10 hover:shadow-xl transition-all duration-300
                ${isDarkMode ? 'bg-gray-900/80 backdrop-blur-sm border-gray-800/50' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg
                    ${isDarkMode ? 'bg-gradient-to-br from-purple-600 to-blue-600' : 'bg-gradient-to-br from-purple-800 to-blue-800'}`}>
                    <FaCreditCard className="text-white text-lg" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Payment Method
                    </h2>
                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Choose how you want to pay</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-5 rounded-2xl border-2 transition-all duration-300 text-left focus:outline-none focus:ring-2 focus:ring-offset-2
                      ${paymentMethod === 'cash'
                        ? isDarkMode
                          ? 'border-green-500 bg-gradient-to-br from-green-500/10 to-green-500/5 shadow-lg focus:ring-green-500'
                          : 'border-green-600 bg-gradient-to-br from-green-50 to-green-100/50 shadow-lg focus:ring-green-600'
                        : isDarkMode
                          ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 focus:ring-cyan-500'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 focus:ring-cyan-700'
                      }`}
                    aria-pressed={paymentMethod === 'cash'}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center 
                        ${paymentMethod === 'cash'
                          ? isDarkMode
                            ? 'bg-green-900/30 border border-green-800/50'
                            : 'bg-green-100 border border-green-200'
                          : isDarkMode
                            ? 'bg-gray-800 border border-gray-700'
                            : 'bg-gray-100 border border-gray-200'
                        }`}>
                        <FaMoneyBill className={`text-xl 
                          ${paymentMethod === 'cash'
                            ? isDarkMode ? 'text-green-400' : 'text-green-700'
                            : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`} aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-bold text-lg mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Cash on Delivery
                        </h3>
                        <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Pay when you receive your order
                        </p>
                        <div className="flex flex-wrap gap-1">
                          <span className={`text-xs px-2 py-1 rounded-full 
                            ${paymentMethod === 'cash'
                              ? isDarkMode
                                ? 'bg-green-900/50 text-green-300'
                                : 'bg-green-100 text-green-700'
                              : isDarkMode
                                ? 'bg-gray-700 text-gray-300'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                            No fees
                          </span>
                        </div>
                      </div>
                      {paymentMethod === 'cash' && (
                        <div className={isDarkMode ? 'text-green-400' : 'text-green-700'}>
                          <FaCheckCircle className="text-xl" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('online')}
                    className={`p-5 rounded-2xl border-2 transition-all duration-300 text-left focus:outline-none focus:ring-2 focus:ring-offset-2
                      ${paymentMethod === 'online'
                        ? isDarkMode
                          ? 'border-blue-500 bg-gradient-to-br from-blue-500/10 to-blue-500/5 shadow-lg focus:ring-blue-500'
                          : 'border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-lg focus:ring-blue-600'
                        : isDarkMode
                          ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50 focus:ring-cyan-500'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 focus:ring-cyan-700'
                      }`}
                    aria-pressed={paymentMethod === 'online'}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center 
                        ${paymentMethod === 'online'
                          ? isDarkMode
                            ? 'bg-blue-900/30 border border-blue-800/50'
                            : 'bg-blue-100 border border-blue-200'
                          : isDarkMode
                            ? 'bg-gray-800 border border-gray-700'
                            : 'bg-gray-100 border border-gray-200'
                        }`}>
                        <FaCreditCard className={`text-xl 
                          ${paymentMethod === 'online'
                            ? isDarkMode ? 'text-blue-400' : 'text-blue-700'
                            : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`} aria-hidden="true" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-bold text-lg mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          Online Payment
                        </h3>
                        <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Pay securely with card or wallet
                        </p>
                        <div className="flex flex-wrap gap-1">
                          <span className={`text-xs px-2 py-1 rounded-full 
                            ${paymentMethod === 'online'
                              ? isDarkMode
                                ? 'bg-blue-900/50 text-blue-300'
                                : 'bg-blue-100 text-blue-700'
                              : isDarkMode
                                ? 'bg-gray-700 text-gray-300'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                            Instant confirmation
                          </span>
                        </div>
                      </div>
                      {paymentMethod === 'online' && (
                        <div className={isDarkMode ? 'text-blue-400' : 'text-blue-700'}>
                          <FaCheckCircle className="text-xl" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                  </button>
                </div>

                {paymentMethod === 'online' && (
                  <div className={`mt-6 p-6 rounded-2xl border
                    ${isDarkMode
                      ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-blue-800/50'
                      : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <FaLock className={`text-xl ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`} aria-hidden="true" />
                      <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Online Payment Instructions
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div className={`p-4 rounded-xl border
                        ${isDarkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <FaBuilding className={isDarkMode ? 'text-blue-400' : 'text-blue-700'} aria-hidden="true" />
                          <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Bank Transfer
                          </h4>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Bank Name:</span>
                            <span className={`text-sm font-mono ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              Commercial International Bank (CIB)
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Account Number:</span>
                            <span className={`text-sm font-mono ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              123-456-789-10
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={`p-4 rounded-xl border
                        ${isDarkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center gap-3 mb-3">
                          <FaMobileAlt className={isDarkMode ? 'text-green-400' : 'text-green-700'} aria-hidden="true" />
                          <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Mobile Wallet
                          </h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2
                              ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                              <FaPhone className={isDarkMode ? 'text-blue-400' : 'text-blue-700'} aria-hidden="true" />
                            </div>
                            <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              Vodafone Cash
                            </p>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              0100 123 4567
                            </p>
                          </div>
                          <div className="text-center">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2
                              ${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
                              <FaQrcode className={isDarkMode ? 'text-purple-400' : 'text-purple-700'} aria-hidden="true" />
                            </div>
                            <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              InstaPay
                            </p>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Scan QR Code
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className={`p-4 rounded-xl border
                        ${isDarkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-white border-gray-200'}`}>
                        <h4 className={`font-semibold mb-3 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          <FaReceipt className={isDarkMode ? 'text-yellow-400' : 'text-yellow-700'} aria-hidden="true" />
                          How to Pay
                        </h4>
                        <ol className="space-y-2 text-sm">
                          {[
                            `Transfer the exact amount: EGP ${total.toFixed(2)}`,
                            "Include your order number as reference",
                            "Send payment screenshot to: +20 100 123 4567",
                            "Your order will be processed immediately after verification"
                          ].map((step, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className={`text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5
                                ${isDarkMode ? 'bg-blue-500' : 'bg-blue-700'}`}>{index + 1}</span>
                              <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className={`p-3 rounded-xl border
                        ${isDarkMode
                          ? 'bg-gradient-to-r from-blue-900/20 to-blue-800/20 border-blue-800/30'
                          : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'}`}>
                        <div className="flex items-start gap-2">
                          <FaInfoCircle className={`mt-1 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`} aria-hidden="true" />
                          <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                            <strong>Note:</strong> Please keep your payment receipt. Orders with online payment will be shipped faster.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'cash' && (
                  <div className={`mt-6 p-4 rounded-2xl border
                    ${isDarkMode
                      ? 'bg-gradient-to-r from-green-900/30 to-green-800/30 border-green-800/50'
                      : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'}`}>
                    <div className="flex items-start gap-3">
                      <FaInfoCircle className={`mt-1 ${isDarkMode ? 'text-green-400' : 'text-green-700'}`} aria-hidden="true" />
                      <div>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
                          Cash Payment Instructions
                        </p>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                          Please prepare exact cash amount (EGP {total.toFixed(2)}) for our delivery agent. You'll receive a confirmation email with order details.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Error Message */}
              {apiError && (
                <div className={`bg-gradient-to-r rounded-2xl p-6 shadow-lg border
                  ${isDarkMode
                    ? 'from-red-900/30 to-pink-900/30 border-red-800/50'
                    : 'from-red-50 to-pink-50 border-red-200'}`} role="alert">
                  <div className="flex items-center gap-3">
                    <FaExclamationTriangle className={`text-xl ${isDarkMode ? 'text-red-400' : 'text-red-700'}`} aria-hidden="true" />
                    <div>
                      <p className={`font-semibold ${isDarkMode ? 'text-red-300' : 'text-red-800'}`}>
                        Order Error
                      </p>
                      <p className={`text-sm mt-1 ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
                        {apiError}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" className="hidden" aria-hidden="true">Submit</button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className={`rounded-3xl shadow-xl border p-8 sticky top-6
              ${isDarkMode ? 'bg-gray-900/90 backdrop-blur-sm border-gray-800/50' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-3 mb-8">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                  ${isDarkMode ? 'bg-gradient-to-r from-cyan-500 to-cyan-400' : 'bg-gradient-to-r from-cyan-700 to-cyan-600'}`}>
                  <FaShoppingBag className="text-white" aria-hidden="true" />
                </div>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Order Summary
                </h2>
              </div>

              <div className="space-y-4 mb-8 max-h-64 overflow-y-auto custom-scrollbar">
                {cartItems.map((item, index) => (
                  <CartItem key={index} item={item} isDarkMode={isDarkMode} />
                ))}
              </div>

              {/* Promo Code Section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <FaTag className={isDarkMode ? 'text-purple-400' : 'text-purple-700'} aria-hidden="true" />
                  <h3 className={`font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Promo Code
                  </h3>
                </div>

                {appliedPromo ? (
                  <div className={`rounded-2xl p-4 border
                    ${isDarkMode
                      ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-800/50'
                      : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <FaCheckCircle className={isDarkMode ? 'text-green-400' : 'text-green-700'} aria-hidden="true" />
                        <span className={`font-mono font-bold ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
                          {appliedPromo.code}
                        </span>
                      </div>
                      <button
                        onClick={handleRemovePromoCode}
                        className="text-red-400 hover:text-red-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                        aria-label="Remove promo code"
                      >
                        <FaTimes aria-hidden="true" />
                      </button>
                    </div>
                    <p className={`text-sm mb-1 ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                      {appliedPromo.discount_type === 'percentage'
                        ? `${appliedPromo.discount_value}% discount applied`
                        : `EGP ${appliedPromo.discount_value} discount applied`
                      }
                    </p>
                    <p className={`text-lg font-bold ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>
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
                        className={`flex-1 min-w-0 px-4 py-3 border-2 rounded-2xl focus:outline-none font-mono
                          ${isDarkMode
                            ? 'border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 bg-gray-800 text-white'
                            : 'border-gray-200 focus:border-purple-700 focus:ring-2 focus:ring-purple-700/10 bg-gray-50 text-gray-900'}`}
                        disabled={promoLoading}
                        aria-label="Promo code"
                      />
                      <button
                        onClick={handleApplyPromoCode}
                        disabled={promoLoading || !promoCode.trim()}
                        className={`flex-shrink-0 px-6 py-3 rounded-2xl font-medium transition-all duration-300 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-2
                          ${promoLoading || !promoCode.trim()
                            ? isDarkMode
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : isDarkMode
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 focus:ring-purple-500'
                              : 'bg-gradient-to-r from-purple-700 to-indigo-700 text-white hover:from-purple-800 hover:to-indigo-800 focus:ring-purple-700'
                          }`}
                        aria-label={promoLoading ? "Applying promo code" : "Apply promo code"}
                      >
                        {promoLoading ? <FaSpinner className="animate-spin" aria-hidden="true" /> : 'Apply'}
                      </button>
                    </div>
                    <p className={`text-xs text-center md:text-left ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Enter your promo code and click apply to get discounts
                    </p>
                  </div>
                )}
              </div>

              <PriceBreakdown
                subtotal={subtotal}
                discount={discount}
                shipping={shipping}
                total={total}
                isDarkMode={isDarkMode}
              />

              {/* Payment Method Display */}
              <div className={`mb-6 p-4 rounded-2xl border
                ${isDarkMode
                  ? 'bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-gray-700'
                  : 'bg-gradient-to-r from-gray-50 to-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-medium flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {paymentMethod === 'cash' ? (
                      <>
                        <FaMoneyBill className={isDarkMode ? 'text-green-400' : 'text-green-700'} aria-hidden="true" />
                        Cash on Delivery
                      </>
                    ) : (
                      <>
                        <FaCreditCard className={isDarkMode ? 'text-blue-400' : 'text-blue-700'} aria-hidden="true" />
                        Online Payment
                      </>
                    )}
                  </span>
                  {paymentMethod === 'online' && (
                    <span className={`text-xs px-2 py-1 rounded-full
                      ${isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                      Pay Now
                    </span>
                  )}
                </div>
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {paymentMethod === 'cash'
                    ? 'Pay when you receive your order'
                    : 'Complete payment to confirm order immediately'
                  }
                </p>
              </div>

              {/* Place Order Button */}
              <button
                type="button"
                onClick={formik.handleSubmit}
                disabled={loading || !formik.isValid || !selectedGovernorate}
                className={`w-full py-5 px-6 rounded-2xl font-bold text-lg transition-all duration-300 focus:outline-none focus:ring-4 shadow-lg 
                  ${loading || !formik.isValid || !selectedGovernorate
                    ? isDarkMode
                      ? 'bg-gray-700 text-gray-300 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : paymentMethod === 'online'
                      ? isDarkMode
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-500/20'
                        : 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white hover:from-blue-800 hover:to-indigo-800 focus:ring-blue-700/20'
                      : isDarkMode
                        ? 'bg-gradient-to-r from-green-600 to-cyan-600 text-white hover:from-green-700 hover:to-cyan-700 focus:ring-cyan-500/20'
                        : 'bg-gradient-to-r from-green-700 to-cyan-700 text-white hover:from-green-800 hover:to-cyan-800 focus:ring-cyan-700/20'
                  }`}
                aria-label={loading ? "Processing order" : (paymentMethod === 'online' ? "Pay online" : "Place order")}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <FaSpinner className="animate-spin" aria-hidden="true" />
                    Processing...
                  </span>
                ) : paymentMethod === 'online' ? (
                  <span className="flex items-center justify-center gap-3">
                    <FaCreditCard aria-hidden="true" />
                    <span className="hidden sm:inline">Pay EGP {total.toFixed(2)} Online</span>
                    <span className="sm:hidden">Pay Online</span>
                    <FaArrowRight className="ml-2" aria-hidden="true" />
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <FaMoneyBillWave aria-hidden="true" />
                    <span className="hidden sm:inline">Place Order (Cash on Delivery)</span>
                    <span className="sm:hidden">Place Order (COD)</span>
                    <FaArrowRight className="ml-2" aria-hidden="true" />
                  </span>
                )}
              </button>

              {/* Security & Trust Badges */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <FaLock className={isDarkMode ? 'text-green-400' : 'text-green-700'} aria-hidden="true" />
                  <span className={isDarkMode ? 'text-gray-500' : 'text-gray-600'}>100% Secure Payment</span>
                </div>
                <div className={`flex items-center justify-center gap-6 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <span className="flex items-center gap-1">
                    <FaTruck aria-hidden="true" />
                    Fast Delivery
                  </span>
                  <span className="flex items-center gap-1">
                    <FaHeadset aria-hidden="true" />
                    24/7 Support
                  </span>
                  <span className="flex items-center gap-1">
                    <FaShieldAlt aria-hidden="true" />
                    Buyer Protection
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: ${isDarkMode ? '#1f2937' : '#f1f1f1'};
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: ${isDarkMode ? '#374151' : '#c1c1c1'};
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${isDarkMode ? '#4b5563' : '#a1a1a1'};
          }
          
          @media (max-width: 767px) {
            .px-5 { padding-left: 1rem !important; padding-right: 1rem !important; }
            .py-10 { padding-top: 2rem !important; padding-bottom: 2rem !important; }
            .p-8 { padding: 1.5rem !important; }
            .text-2xl { font-size: 1.5rem !important; line-height: 2rem !important; }
            .text-3xl { font-size: 1.875rem !important; line-height: 2.25rem !important; }
            .gap-10 { gap: 2rem !important; }
            .space-y-8 > * + * { margin-top: 1.5rem !important; }
            .grid.grid-cols-1.md\\:grid-cols-2.gap-6 { grid-template-columns: 1fr !important; }
          }
          
          @media (min-width: 768px) and (max-width: 1023px) {
            .max-w-6xl { max-width: 100% !important; padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
            .lg\\:px-30 { padding-left: 2rem !important; padding-right: 2rem !important; }
            .gap-10 { gap: 3rem !important; }
            .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
            .lg\\:col-span-3, .lg\\:col-span-2 { grid-column: span 1 / span 1 !important; }
            .sticky { position: relative !important; top: 0 !important; }
          }
        `}
      </style>
    </div>
  );
}