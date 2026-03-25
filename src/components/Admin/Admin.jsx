// Admin.jsx - COMPLETE UPDATED VERSION WITH IMAGE UPLOAD AND STOCK MANAGEMENT
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    FaBox, FaUsers, FaShoppingCart, FaChartLine, FaCog,
    FaSignOutAlt, FaPlus, FaEdit, FaTrash, FaEye,
    FaSpinner, FaCheck, FaTimes, FaTags, FaTag,
    FaImage, FaTimesCircle, FaShoppingBag, FaTruck,
    FaMoneyBillWave, FaMapMarkerAlt, FaGlobeAfrica,
    FaEnvelope, FaUserCheck, FaBars, FaChevronLeft,
    FaChevronRight, FaSearch, FaFilter, FaDownload,
    FaBell, FaHome, FaStore, FaShippingFast, FaReceipt,
    FaCalendar, FaMoneyBill, FaShoppingBasket, FaListAlt,
    FaGift, FaTicketAlt, FaPercent, FaExclamationCircle,
    FaExclamationTriangle, FaWarehouse, FaUpload
} from 'react-icons/fa';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [orders, setOrders] = useState([]);
    const [users, setUsers] = useState([]);
    const [shippingCosts, setShippingCosts] = useState([]);
    const [specialOffers, setSpecialOffers] = useState([]);
    const [promoCodes, setPromoCodes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme ? savedTheme === 'dark' : true;
    });
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalCategories: 0,
        totalOrders: 0,
        totalUsers: 0,
        totalRevenue: 0,
        totalUsersOrdered: 0,
        lowStockCount: 0,
        outOfStockCount: 0
    });
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState({
        products: 'all',
        orders: 'all',
        users: 'all'
    });

    // Image upload states
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);
    const additionalFileInputRef = useRef(null);

    // Listen for theme changes
    useEffect(() => {
        const checkTheme = () => {
            const savedTheme = localStorage.getItem('theme');
            setIsDarkMode(savedTheme ? savedTheme === 'dark' : true);
        };

        window.addEventListener('storage', checkTheme);

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const isDark = document.documentElement.classList.contains('dark');
                    setIsDarkMode(isDark);
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });

        return () => {
            window.removeEventListener('storage', checkTheme);
            observer.disconnect();
        };
    }, []);

    // Form states for products
    const [productForm, setProductForm] = useState({
        title: '',
        description: '',
        price: '',
        category_id: '',
        stock: '',
        image_url: '',
        additionalImages: []
    });
    const [editingProduct, setEditingProduct] = useState(null);
    const [showProductModal, setShowProductModal] = useState(false);

    // Form states for categories
    const [categoryForm, setCategoryForm] = useState({
        name: '',
        description: '',
        image_url: '',
        is_active: true
    });
    const [editingCategory, setEditingCategory] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    // Form states for shipping costs
    const [shippingForm, setShippingForm] = useState({
        governorate: '',
        governorate_ar: '',
        cost: '',
        delivery_days: 3,
        is_active: true,
        notes: ''
    });
    const [editingShipping, setEditingShipping] = useState(null);
    const [showShippingModal, setShowShippingModal] = useState(false);

    // Form states for special offers
    const [specialOfferForm, setSpecialOfferForm] = useState({
        banner_text: '',
        is_active: true,
        start_date: '',
        end_date: ''
    });
    const [editingSpecialOffer, setEditingSpecialOffer] = useState(null);
    const [showSpecialOfferModal, setShowSpecialOfferModal] = useState(false);

    // Form states for promo codes
    const [promoCodeForm, setPromoCodeForm] = useState({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        minimum_order: '',
        maximum_discount: '',
        usage_limit: '',
        is_active: true,
        start_date: '',
        end_date: ''
    });
    const [editingPromoCode, setEditingPromoCode] = useState(null);
    const [showPromoCodeModal, setShowPromoCodeModal] = useState(false);

    const navigate = useNavigate();
    const sidebarRef = useRef(null);

    // =========== IMAGE UPLOAD FUNCTIONS ===========
    const uploadImage = async (file, folder = 'products') => {
        try {
            if (!file) return null;

            // Validate file type
            const fileExt = file.name.split('.').pop().toLowerCase();
            const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            if (!allowedTypes.includes(fileExt)) {
                toast.error('Please upload an image file (jpg, png, gif, webp)');
                return null;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return null;
            }

            setUploading(true);
            setUploadProgress(0);

            // Create a unique file name
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;

            // Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from('images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // Simulate progress (since Supabase doesn't provide progress events)
            setUploadProgress(100);

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            toast.success('Image uploaded successfully!');
            return publicUrl;

        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to upload image. Please try again.');
            return null;
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleMainImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = await uploadImage(file, 'products');
            if (url) {
                setProductForm({ ...productForm, image_url: url });
            }
        }
    };

    const handleAdditionalImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = await uploadImage(file, 'products/additional');
            if (url) {
                setProductForm({
                    ...productForm,
                    additionalImages: [...productForm.additionalImages, url]
                });
            }
        }
    };

    const handleCategoryImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = await uploadImage(file, 'categories');
            if (url) {
                setCategoryForm({ ...categoryForm, image_url: url });
            }
        }
    };

    const removeMainImage = () => {
        setProductForm({ ...productForm, image_url: '' });
    };

    const removeAdditionalImage = (index) => {
        const newImages = [...productForm.additionalImages];
        newImages.splice(index, 1);
        setProductForm({
            ...productForm,
            additionalImages: newImages
        });
    };

    const removeCategoryImage = () => {
        setCategoryForm({ ...categoryForm, image_url: '' });
    };

    // Check screen size for responsive sidebar
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setSidebarCollapsed(true);
            } else {
                setSidebarCollapsed(false);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Check admin authentication
    useEffect(() => {
        checkAdminAccess();
        loadInitialData();
    }, []);

    const checkAdminAccess = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                toast.error('Please login to access admin panel');
                navigate('/login');
                return;
            }

            const { data: adminRole, error } = await supabase
                .from('admin_roles')
                .select('*')
                .eq('id', session.user.id)
                .maybeSingle();

            if (error) {
                console.error('Admin check error:', error);
            }

            if (!adminRole) {
                toast.error('Unauthorized access. Admin privileges required.');
                navigate('/');
                return;
            }

        } catch (error) {
            console.error('Admin access check error:', error);
        }
    };

    const loadInitialData = async () => {
        try {
            setIsInitializing(true);

            // Load all data in parallel
            const [
                productsData,
                categoriesData,
                ordersData,
                usersData,
                shippingData,
                specialOffersData,
                promoCodesData
            ] = await Promise.all([
                fetchProductsWithImages(),
                fetchCategories(),
                fetchOrders(),
                fetchUsers(),
                fetchShippingCosts(),
                fetchSpecialOffers(),
                fetchPromoCodes()
            ]);

            setProducts(productsData);
            setCategories(categoriesData);
            setOrders(ordersData);
            setUsers(usersData);
            setShippingCosts(shippingData);
            setSpecialOffers(specialOffersData);
            setPromoCodes(promoCodesData);

            calculateStats(productsData, categoriesData, ordersData, usersData);

        } catch (error) {
            console.error('Error loading initial data:', error);
            toast.error('Failed to load data');
        } finally {
            setIsInitializing(false);
        }
    };

    // Fetch functions
    const fetchProductsWithImages = async () => {
        try {
            const { data: products, error: productsError } = await supabase
                .from('products')
                .select(`
                    *,
                    categories (
                        id,
                        name
                    )
                `)
                .order('created_at', { ascending: false });

            if (productsError) throw productsError;

            const productsWithImages = await Promise.all(
                products.map(async (product) => {
                    const { data: images, error: imagesError } = await supabase
                        .from('product_images')
                        .select('*')
                        .eq('product_id', product.id)
                        .order('display_order', { ascending: true });

                    if (imagesError) throw imagesError;

                    return {
                        ...product,
                        images: images || []
                    };
                })
            );

            return productsWithImages || [];
        } catch (error) {
            console.error('Error fetching products with images:', error);
            toast.error('Failed to load products');
            return [];
        }
    };

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
            return [];
        }
    };

    const fetchOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        id,
                        product_title,
                        quantity,
                        price,
                        product_id
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders');
            return [];
        }
    };

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users');
            return [];
        }
    };

    const fetchShippingCosts = async () => {
        try {
            const { data, error } = await supabase
                .from('shipping_costs')
                .select('*')
                .order('governorate');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching shipping costs:', error);
            toast.error('Failed to load shipping costs');
            return [];
        }
    };

    const fetchSpecialOffers = async () => {
        try {
            const { data, error } = await supabase
                .from('special_offers')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching special offers:', error);
            toast.error('Failed to load special offers');
            return [];
        }
    };

    const fetchPromoCodes = async () => {
        try {
            const { data, error } = await supabase
                .from('promo_codes')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching promo codes:', error);
            toast.error('Failed to load promo codes');
            return [];
        }
    };

    const calculateStats = async (productsData, categoriesData, ordersData, usersData) => {
        const totalRevenue = ordersData.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
        const uniqueUserIds = new Set();
        ordersData.forEach(order => {
            if (order.user_id) {
                uniqueUserIds.add(order.user_id);
            }
        });
        const totalUsersOrdered = uniqueUserIds.size;

        // Calculate stock statistics
        const lowStockCount = productsData.filter(p => p.stock > 0 && p.stock < 5).length;
        const outOfStockCount = productsData.filter(p => p.stock === 0).length;

        setStats({
            totalProducts: productsData.length,
            totalCategories: categoriesData.length,
            totalOrders: ordersData.length,
            totalUsers: usersData.length,
            totalRevenue: totalRevenue,
            totalUsersOrdered: totalUsersOrdered,
            lowStockCount: lowStockCount,
            outOfStockCount: outOfStockCount
        });
    };

    // =========== STOCK MANAGEMENT FUNCTIONS ===========

    // Decrease product stock when order is shipped
    const decreaseProductStock = async (orderId) => {
        try {
            console.log('Decreasing stock for shipped order:', orderId);

            // Get order items with product details
            const { data: orderItems, error: itemsError } = await supabase
                .from('order_items')
                .select(`
                    product_id,
                    quantity,
                    product_title
                `)
                .eq('order_id', orderId);

            if (itemsError) throw itemsError;

            // Update stock for each product
            for (const item of orderItems) {
                if (item.product_id) {
                    const { data: product, error: productError } = await supabase
                        .from('products')
                        .select('stock')
                        .eq('id', item.product_id)
                        .single();

                    if (productError) {
                        console.error(`Error fetching product ${item.product_id}:`, productError);
                        continue;
                    }

                    const newStock = Math.max(0, product.stock - item.quantity);

                    const { error: updateError } = await supabase
                        .from('products')
                        .update({
                            stock: newStock,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', item.product_id)

                    if (updateError) {
                        console.error(`Error updating stock for product ${item.product_id}:`, updateError);
                    } else {
                        console.log(`Updated stock for product ${item.product_title}: ${product.stock} → ${newStock}`);
                    }
                }
            }

            // Refresh products to update stock display
            const refreshedProducts = await fetchProductsWithImages();
            setProducts(refreshedProducts);
            calculateStats(refreshedProducts, categories, orders, users);

            return true;
        } catch (error) {
            console.error('Error decreasing product stock:', error);
            return false;
        }
    };

    // Return products to stock when order status is changed to Pending, Processing, or Cancelled
    const returnProductStock = async (orderId) => {
        try {
            console.log('Returning stock for order:', orderId);

            // Get order items with product details
            const { data: orderItems, error: itemsError } = await supabase
                .from('order_items')
                .select(`
                    product_id,
                    quantity,
                    product_title
                `)
                .eq('order_id', orderId);

            if (itemsError) throw itemsError;

            // Update stock for each product
            for (const item of orderItems) {
                if (item.product_id) {
                    const { data: product, error: productError } = await supabase
                        .from('products')
                        .select('stock')
                        .eq('id', item.product_id)
                        .single();

                    if (productError) {
                        console.error(`Error fetching product ${item.product_id}:`, productError);
                        continue;
                    }

                    const newStock = product.stock + item.quantity;

                    const { error: updateError } = await supabase
                        .from('products')
                        .update({
                            stock: newStock,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', item.product_id)

                    if (updateError) {
                        console.error(`Error updating stock for product ${item.product_id}:`, updateError);
                    } else {
                        console.log(`Returned stock for product ${item.product_title}: ${product.stock} → ${newStock}`);
                    }
                }
            }

            // Refresh products to update stock display
            const refreshedProducts = await fetchProductsWithImages();
            setProducts(refreshedProducts);
            calculateStats(refreshedProducts, categories, orders, users);

            return true;
        } catch (error) {
            console.error('Error returning product stock:', error);
            return false;
        }
    };

    // Helper function to get category name
    const getCategoryName = (categoryId) => {
        if (!categoryId) return 'Uncategorized';
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : 'Uncategorized';
    };

    // PRODUCT FUNCTIONS
    const handleProductSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const categoryName = getCategoryName(productForm.category_id);

            const productData = {
                title: productForm.title,
                description: productForm.description,
                price: parseFloat(productForm.price),
                category_id: productForm.category_id || null,
                category: categoryName,
                stock: parseInt(productForm.stock),
                image_url: productForm.image_url,
                updated_at: new Date().toISOString(),
            };

            let savedProduct;

            if (editingProduct) {
                const { data, error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', editingProduct.id)
                    .select(`
                    *,
                    categories (
                        id,
                        name
                    )
                `)
                    .single();

                if (error) throw error;
                savedProduct = data;

                await handleProductImages(editingProduct.id);
            } else {
                productData.created_by = session.user.id;

                const { data, error } = await supabase
                    .from('products')
                    .insert([productData])
                    .select(`
                    *,
                    categories (
                        id,
                        name
                    )
                `)
                    .single();

                if (error) throw error;
                savedProduct = data;

                await handleProductImages(savedProduct.id);
            }

            const updatedProduct = await fetchProductWithImages(savedProduct.id);

            if (editingProduct) {
                setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct : p));
                toast.success('Product updated successfully');
            } else {
                setProducts([updatedProduct, ...products]);
                toast.success('Product added successfully');
            }

            // Update stats
            const updatedProducts = editingProduct
                ? products.map(p => p.id === editingProduct.id ? updatedProduct : p)
                : [updatedProduct, ...products];
            calculateStats(updatedProducts, categories, orders, users);

            resetProductForm();
            setShowProductModal(false);

        } catch (error) {
            console.error('Error saving product:', error);
            toast.error('Failed to save product. ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProductImages = async (productId) => {
        try {
            const { error: deleteError } = await supabase
                .from('product_images')
                .delete()
                .eq('product_id', productId);

            if (deleteError) throw deleteError;

            if (productForm.image_url) {
                const { error: insertMainError } = await supabase
                    .from('product_images')
                    .insert({
                        product_id: productId,
                        image_url: productForm.image_url,
                        display_order: 0,
                        is_primary: true,
                        alt_text: productForm.title
                    });

                if (insertMainError) throw insertMainError;
            }

            if (productForm.additionalImages.length > 0) {
                const imagesToInsert = productForm.additionalImages.map((imageUrl, index) => ({
                    product_id: productId,
                    image_url: imageUrl,
                    display_order: index + 1,
                    is_primary: false,
                    alt_text: productForm.title
                }));

                const { error: insertError } = await supabase
                    .from('product_images')
                    .insert(imagesToInsert);

                if (insertError) throw insertError;
            }
        } catch (error) {
            console.error('Error handling product images:', error);
            throw error;
        }
    };

    const fetchProductWithImages = async (productId) => {
        try {
            const { data: product, error: productError } = await supabase
                .from('products')
                .select(`
                    *,
                    categories (
                        id,
                        name
                    )
                `)
                .eq('id', productId)
                .single();

            if (productError) throw productError;

            const { data: images, error: imagesError } = await supabase
                .from('product_images')
                .select('*')
                .eq('product_id', productId)
                .order('display_order', { ascending: true });

            if (imagesError) throw imagesError;

            return {
                ...product,
                images: images || []
            };
        } catch (error) {
            console.error('Error fetching product with images:', error);
            throw error;
        }
    };

    const handleEditProduct = async (product) => {
        try {
            setEditingProduct(product);

            const { data: images, error } = await supabase
                .from('product_images')
                .select('*')
                .eq('product_id', product.id)
                .order('display_order', { ascending: true });

            if (error) throw error;

            const mainImage = images?.find(img => img.display_order === 0);
            const additionalImages = images?.filter(img => img.display_order > 0).map(img => img.image_url) || [];

            setProductForm({
                title: product.title,
                description: product.description,
                price: product.price,
                category_id: product.category_id || '',
                stock: product.stock,
                image_url: mainImage?.image_url || product.image_url || '',
                additionalImages: additionalImages
            });

            setShowProductModal(true);
        } catch (error) {
            console.error('Error loading product for edit:', error);
            toast.error('Failed to load product data');
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product? All associated images will also be deleted.')) return;

        try {
            const { error: imagesError } = await supabase
                .from('product_images')
                .delete()
                .eq('product_id', productId);

            if (imagesError) throw imagesError;

            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

            if (error) throw error;

            const updatedProducts = products.filter(p => p.id !== productId);
            setProducts(updatedProducts);
            calculateStats(updatedProducts, categories, orders, users);
            toast.success('Product deleted successfully');
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Failed to delete product');
        }
    };

    // CATEGORY FUNCTIONS
    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            const categoryData = {
                name: categoryForm.name,
                description: categoryForm.description,
                image_url: categoryForm.image_url,
                is_active: categoryForm.is_active,
                updated_at: new Date().toISOString(),
            };

            let savedCategory;

            if (editingCategory) {
                const { data, error } = await supabase
                    .from('categories')
                    .update(categoryData)
                    .eq('id', editingCategory.id)
                    .select()
                    .single();

                if (error) throw error;
                savedCategory = data;

                await updateProductsCategory(editingCategory.id, savedCategory.name);

                setCategories(categories.map(c => c.id === editingCategory.id ? savedCategory : c));
                toast.success('Category updated successfully');
            } else {
                categoryData.created_by = session.user.id;

                const { data, error } = await supabase
                    .from('categories')
                    .insert([categoryData])
                    .select()
                    .single();

                if (error) throw error;
                savedCategory = data;

                setCategories([savedCategory, ...categories]);
                toast.success('Category added successfully');
            }

            resetCategoryForm();
            setShowCategoryModal(false);

        } catch (error) {
            console.error('Error saving category:', error);
            toast.error(error.message || 'Failed to save category');
        } finally {
            setIsLoading(false);
        }
    };

    const updateProductsCategory = async (categoryId, categoryName) => {
        try {
            const { error } = await supabase
                .from('products')
                .update({
                    category: categoryName,
                    updated_at: new Date().toISOString()
                })
                .eq('category_id', categoryId);

            if (error) throw error;

            setProducts(products.map(p =>
                p.category_id === categoryId
                    ? {
                        ...p,
                        category: categoryName,
                        categories: { id: categoryId, name: categoryName }
                    }
                    : p
            ));

        } catch (error) {
            console.error('Error updating products category:', error);
        }
    };

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setCategoryForm({
            name: category.name,
            description: category.description || '',
            image_url: category.image_url || '',
            is_active: category.is_active
        });
        setShowCategoryModal(true);
    };

    const handleDeleteCategory = async (categoryId) => {
        if (!window.confirm('Are you sure you want to delete this category? Products using this category will have their category set to null.')) return;

        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', categoryId);

            if (error) throw error;

            const updatedCategories = categories.filter(c => c.id !== categoryId);
            setCategories(updatedCategories);

            const { error: updateError } = await supabase
                .from('products')
                .update({
                    category_id: null,
                    category: 'Uncategorized',
                    updated_at: new Date().toISOString()
                })
                .eq('category_id', categoryId);

            if (updateError) throw updateError;

            setProducts(products.map(p =>
                p.category_id === categoryId ? { ...p, category_id: null, category: 'Uncategorized', categories: null } : p
            ));

            calculateStats(products, updatedCategories, orders, users);
            toast.success('Category deleted successfully');
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Failed to delete category');
        }
    };

    // SHIPPING COST FUNCTIONS
    const handleShippingSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            const shippingData = {
                governorate: shippingForm.governorate,
                governorate_ar: shippingForm.governorate_ar,
                cost: parseFloat(shippingForm.cost),
                delivery_days: parseInt(shippingForm.delivery_days),
                is_active: shippingForm.is_active,
                notes: shippingForm.notes,
                updated_at: new Date().toISOString(),
            };

            if (editingShipping) {
                const { data, error } = await supabase
                    .from('shipping_costs')
                    .update(shippingData)
                    .eq('id', editingShipping.id)
                    .select()
                    .single();

                if (error) throw error;

                setShippingCosts(shippingCosts.map(s => s.id === editingShipping.id ? data : s));
                toast.success('Shipping cost updated successfully');
            } else {
                shippingData.created_by = session.user.id;

                const { data, error } = await supabase
                    .from('shipping_costs')
                    .insert([shippingData])
                    .select()
                    .single();

                if (error) throw error;

                setShippingCosts([data, ...shippingCosts]);
                toast.success('Shipping cost added successfully');
            }

            resetShippingForm();
            setShowShippingModal(false);

        } catch (error) {
            console.error('Error saving shipping cost:', error);
            toast.error(error.message || 'Failed to save shipping cost');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditShipping = (shipping) => {
        setEditingShipping(shipping);
        setShippingForm({
            governorate: shipping.governorate,
            governorate_ar: shipping.governorate_ar || '',
            cost: shipping.cost,
            delivery_days: shipping.delivery_days || 3,
            is_active: shipping.is_active,
            notes: shipping.notes || ''
        });
        setShowShippingModal(true);
    };

    const handleDeleteShipping = async (shippingId) => {
        if (!window.confirm('Are you sure you want to delete this shipping cost?')) return;

        try {
            const { error } = await supabase
                .from('shipping_costs')
                .delete()
                .eq('id', shippingId);

            if (error) throw error;

            setShippingCosts(shippingCosts.filter(s => s.id !== shippingId));
            toast.success('Shipping cost deleted successfully');
        } catch (error) {
            console.error('Error deleting shipping cost:', error);
            toast.error('Failed to delete shipping cost');
        }
    };

    // SPECIAL OFFER FUNCTIONS
    const handleSpecialOfferSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            const offerData = {
                banner_text: specialOfferForm.banner_text,
                is_active: specialOfferForm.is_active,
                start_date: specialOfferForm.start_date || null,
                end_date: specialOfferForm.end_date || null,
                updated_at: new Date().toISOString(),
            };

            if (editingSpecialOffer) {
                const { data, error } = await supabase
                    .from('special_offers')
                    .update(offerData)
                    .eq('id', editingSpecialOffer.id)
                    .select()
                    .single();

                if (error) throw error;

                setSpecialOffers(specialOffers.map(o => o.id === editingSpecialOffer.id ? data : o));
                toast.success('Special offer updated successfully');
            } else {
                offerData.created_by = session.user.id;

                const { data, error } = await supabase
                    .from('special_offers')
                    .insert([offerData])
                    .select()
                    .single();

                if (error) throw error;

                setSpecialOffers([data, ...specialOffers]);
                toast.success('Special offer added successfully');
            }

            resetSpecialOfferForm();
            setShowSpecialOfferModal(false);

        } catch (error) {
            console.error('Error saving special offer:', error);
            toast.error('Failed to save special offer');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditSpecialOffer = (offer) => {
        setEditingSpecialOffer(offer);
        setSpecialOfferForm({
            banner_text: offer.banner_text,
            is_active: offer.is_active,
            start_date: offer.start_date ? offer.start_date.substring(0, 16) : '',
            end_date: offer.end_date ? offer.end_date.substring(0, 16) : ''
        });
        setShowSpecialOfferModal(true);
    };

    const handleDeleteSpecialOffer = async (offerId) => {
        if (!window.confirm('Are you sure you want to delete this special offer?')) return;

        try {
            const { error } = await supabase
                .from('special_offers')
                .delete()
                .eq('id', offerId);

            if (error) throw error;

            setSpecialOffers(specialOffers.filter(o => o.id !== offerId));
            toast.success('Special offer deleted successfully');
        } catch (error) {
            console.error('Error deleting special offer:', error);
            toast.error('Failed to delete special offer');
        }
    };

    // PROMO CODE FUNCTIONS
    const handlePromoCodeSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            const promoData = {
                code: promoCodeForm.code.toUpperCase(),
                description: promoCodeForm.description,
                discount_type: promoCodeForm.discount_type,
                discount_value: parseFloat(promoCodeForm.discount_value),
                minimum_order: promoCodeForm.minimum_order ? parseFloat(promoCodeForm.minimum_order) : null,
                maximum_discount: promoCodeForm.maximum_discount ? parseFloat(promoCodeForm.maximum_discount) : null,
                usage_limit: promoCodeForm.usage_limit ? parseInt(promoCodeForm.usage_limit) : null,
                is_active: promoCodeForm.is_active,
                start_date: promoCodeForm.start_date || null,
                end_date: promoCodeForm.end_date || null,
                updated_at: new Date().toISOString(),
            };

            if (editingPromoCode) {
                const { data, error } = await supabase
                    .from('promo_codes')
                    .update(promoData)
                    .eq('id', editingPromoCode.id)
                    .select()
                    .single();

                if (error) throw error;

                setPromoCodes(promoCodes.map(p => p.id === editingPromoCode.id ? data : p));
                toast.success('Promo code updated successfully');
            } else {
                promoData.created_by = session.user.id;
                promoData.times_used = 0;

                const { data, error } = await supabase
                    .from('promo_codes')
                    .insert([promoData])
                    .select()
                    .single();

                if (error) throw error;

                setPromoCodes([data, ...promoCodes]);
                toast.success('Promo code added successfully');
            }

            resetPromoCodeForm();
            setShowPromoCodeModal(false);

        } catch (error) {
            console.error('Error saving promo code:', error);
            toast.error('Failed to save promo code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditPromoCode = (promo) => {
        setEditingPromoCode(promo);
        setPromoCodeForm({
            code: promo.code,
            description: promo.description || '',
            discount_type: promo.discount_type,
            discount_value: promo.discount_value,
            minimum_order: promo.minimum_order || '',
            maximum_discount: promo.maximum_discount || '',
            usage_limit: promo.usage_limit || '',
            is_active: promo.is_active,
            start_date: promo.start_date ? promo.start_date.substring(0, 16) : '',
            end_date: promo.end_date ? promo.end_date.substring(0, 16) : ''
        });
        setShowPromoCodeModal(true);
    };

    const handleDeletePromoCode = async (promoId) => {
        if (!window.confirm('Are you sure you want to delete this promo code?')) return;

        try {
            const { error } = await supabase
                .from('promo_codes')
                .delete()
                .eq('id', promoId);

            if (error) throw error;

            setPromoCodes(promoCodes.filter(p => p.id !== promoId));
            toast.success('Promo code deleted successfully');
        } catch (error) {
            console.error('Error deleting promo code:', error);
            toast.error('Failed to delete promo code');
        }
    };

    // =========== COMPLETE ORDER STATUS UPDATE WITH STOCK MANAGEMENT ===========
    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            const order = orders.find(o => o.id === orderId);
            if (!order) {
                toast.error('Order not found');
                return;
            }

            // Convert to lowercase to match database constraint
            const newStatusLower = newStatus.toLowerCase();
            const oldStatus = (order.status || 'pending').toLowerCase();

            // Define status categories (use lowercase for database comparison)
            const shippedStatuses = ['shipped', 'delivered'];
            const returnStatuses = ['pending', 'processing', 'cancelled'];

            // If changing from shipped to non-shipped status, return stock
            if (shippedStatuses.includes(oldStatus) && returnStatuses.includes(newStatusLower)) {
                const stockReturned = await returnProductStock(orderId);
                if (!stockReturned) {
                    toast.error('Failed to return product stock');
                } else {
                    toast.success('Product stock returned successfully');
                }
            }
            // If changing from non-shipped to shipped status, decrease stock
            else if (returnStatuses.includes(oldStatus) && shippedStatuses.includes(newStatusLower)) {
                const stockDecreased = await decreaseProductStock(orderId);
                if (!stockDecreased) {
                    toast.error('Failed to update product stock');
                } else {
                    toast.success('Product stock decreased successfully');
                }
            }

            // Update the order with lowercase status
            const { error } = await supabase
                .from('orders')
                .update({
                    status: newStatusLower,  // Use lowercase here
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderId);

            if (error) throw error;

            // Update local state with lowercase status
            setOrders(orders.map(order =>
                order.id === orderId ? { ...order, status: newStatusLower } : order
            ));

            toast.success(`Order status updated to ${newStatusLower}`);

            // Send email notification with capitalized status for display
            await sendStatusUpdateEmail(order, newStatusLower);

        } catch (error) {
            console.error('Error updating order:', error);
            toast.error('Failed to update order status');
        }
    };
    // EMAIL SENDING FUNCTION
    const sendStatusUpdateEmail = async (order, newStatus) => {
        try {
            // Create detailed email content
            const emailBody = `
📦 ORDER STATUS UPDATE - SportFlex Store

Dear ${order.customer_name},

Your order status has been updated!

===========================================
ORDER INFORMATION
===========================================
📦 Order Number: ${order.order_number}
📋 Status: ${newStatus}
📅 Order Date: ${formatDate(order.created_at)}
💰 Total Amount: EGP ${parseFloat(order.total_amount).toFixed(2)}
📍 Governorate: ${order.shipping_governorate || 'Not specified'}
🚚 Shipping Cost: EGP ${parseFloat(order.shipping_cost || 0).toFixed(2)}

===========================================
STATUS UPDATE DETAILS
===========================================
🔄 Previous Status: ${order.status || 'Pending'}
✅ New Status: ${newStatus}
⏰ Updated: ${new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}

${getStatusMessage(newStatus)}

===========================================
NEXT STEPS
===========================================
${getNextSteps(newStatus)}

Thank you for shopping with us!

Best regards,
SportFlex Store Team
📞 Contact: +021 14082 1819
📧 Email: yousef.hatem.developer@gmail.com
`.trim();

            // Create Gmail compose URL
            const subject = encodeURIComponent(`📦 Order #${order.order_number} - Status Updated to ${newStatus}`);
            const body = encodeURIComponent(emailBody);
            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(order.customer_email)}&su=${subject}&body=${body}`;

            // Open Gmail in new tab
            window.open(gmailUrl, '_blank');

        } catch (error) {
            console.error('Error preparing email:', error);
            toast.error('Failed to prepare email notification');
        }
    };

    // Helper function for status messages
    const getStatusMessage = (status) => {
        const messages = {
            'Pending': 'Your order has been received and is awaiting processing.',
            'Processing': 'Your order is currently being processed. We\'re preparing your items for shipment.',
            'Shipped': 'Great news! Your order has been shipped and is on its way to you.',
            'Delivered': 'Your order has been successfully delivered. Thank you for shopping with us!',
            'Cancelled': 'Your order has been cancelled. Please contact us if you have any questions.'
        };
        return messages[status] || 'Your order status has been updated.';
    };

    // Helper function for next steps
    const getNextSteps = (status) => {
        const steps = {
            'Pending': '• We will notify you when your order starts processing\n• Estimated processing time: 24-48 hours',
            'Processing': '• Your items are being prepared\n• You will receive shipping details soon\n• Estimated shipping time: 3-7 business days',
            'Shipped': '• Track your shipment using the provided tracking number\n• Estimated delivery: Within 3-7 business days\n• Please ensure someone is available to receive the package',
            'Delivered': '• Please inspect your items upon delivery\n• Contact us within 7 days for any issues\n• We hope you enjoy your purchase!',
            'Cancelled': '• Any payments will be refunded within 5-7 business days\n• Contact us for more information\n• We hope to serve you better next time'
        };
        return steps[status] || '• We will contact you if any action is required';
    };

    // RESET FORM FUNCTIONS
    const resetProductForm = () => {
        setProductForm({
            title: '',
            description: '',
            price: '',
            category_id: '',
            stock: '',
            image_url: '',
            additionalImages: []
        });
        setEditingProduct(null);
    };

    const resetCategoryForm = () => {
        setCategoryForm({
            name: '',
            description: '',
            image_url: '',
            is_active: true
        });
        setEditingCategory(null);
    };

    const resetShippingForm = () => {
        setShippingForm({
            governorate: '',
            governorate_ar: '',
            cost: '',
            delivery_days: 3,
            is_active: true,
            notes: ''
        });
        setEditingShipping(null);
    };

    const resetSpecialOfferForm = () => {
        setSpecialOfferForm({
            banner_text: '',
            is_active: true,
            start_date: '',
            end_date: ''
        });
        setEditingSpecialOffer(null);
    };

    const resetPromoCodeForm = () => {
        setPromoCodeForm({
            code: '',
            description: '',
            discount_type: 'percentage',
            discount_value: '',
            minimum_order: '',
            maximum_discount: '',
            usage_limit: '',
            is_active: true,
            start_date: '',
            end_date: ''
        });
        setEditingPromoCode(null);
    };

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            toast.success('Logged out successfully');
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Failed to logout');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Filter functions
    const filteredProducts = products.filter(product =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredOrders = orders.filter(order =>
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer_email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredShipping = shippingCosts.filter(shipping =>
        shipping.governorate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shipping.governorate_ar?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredSpecialOffers = specialOffers.filter(offer =>
        offer.banner_text.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPromoCodes = promoCodes.filter(promo =>
        promo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        promo.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUsers = users.filter(user =>
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.phone?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get products by filter
    const getFilteredProducts = () => {
        switch (activeFilters.products) {
            case 'in-stock':
                return filteredProducts.filter(p => p.stock > 0);
            case 'low-stock':
                return filteredProducts.filter(p => p.stock > 0 && p.stock < 10);
            case 'critical-stock':
                return filteredProducts.filter(p => p.stock > 0 && p.stock < 5);
            case 'out-of-stock':
                return filteredProducts.filter(p => p.stock === 0);
            default:
                return filteredProducts;
        }
    };

    // Get orders by filter
    const getFilteredOrders = () => {
        const filteredBySearch = filteredOrders.filter(order =>
            order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer_email.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (activeFilters.orders === 'all') {
            return filteredBySearch;
        } else {
            return filteredBySearch.filter(order => order.status === activeFilters.orders);
        }
    };

    // Export report function
    const handleExportReport = () => {
        try {
            const reportData = {
                timestamp: new Date().toISOString(),
                stats: stats,
                recentOrders: orders.slice(0, 10).map(order => ({
                    order_number: order.order_number,
                    customer_name: order.customer_name,
                    total_amount: order.total_amount,
                    status: order.status,
                    date: formatDate(order.created_at)
                })),
                recentProducts: products.slice(0, 10).map(product => ({
                    title: product.title,
                    price: product.price,
                    stock: product.stock,
                    category: product.categories?.name || 'Uncategorized'
                })),
                lowStockProducts: products.filter(p => p.stock < 5).map(product => ({
                    title: product.title,
                    price: product.price,
                    stock: product.stock,
                    category: product.categories?.name || 'Uncategorized'
                }))
            };

            const reportContent = `
SPORTFLEX STORE ADMIN REPORT
Generated: ${new Date().toLocaleString()}

===============================
DASHBOARD STATISTICS
===============================
Total Products: ${stats.totalProducts}
Total Categories: ${stats.totalCategories}
Total Orders: ${stats.totalOrders}
Total Users: ${stats.totalUsers}
Active Buyers: ${stats.totalUsersOrdered}
Total Revenue: EGP ${stats.totalRevenue.toFixed(2)}
Low Stock Products (<5): ${stats.lowStockCount}
Out of Stock Products: ${stats.outOfStockCount}

===============================
LOW STOCK ALERTS (Stock < 5)
===============================
${reportData.lowStockProducts.map(product => `
Product: ${product.title}
Price: EGP ${parseFloat(product.price).toFixed(2)}
Stock: ${product.stock} - ⚠️ CRITICAL
Category: ${product.category}
---`).join('\n')}

===============================
RECENT ORDERS (Last 10)
===============================
${reportData.recentOrders.map(order => `
Order #${order.order_number}
Customer: ${order.customer_name}
Amount: EGP ${parseFloat(order.total_amount).toFixed(2)}
Status: ${order.status}
Date: ${order.date}
---`).join('\n')}

===============================
RECENT PRODUCTS (Last 10)
===============================
${reportData.recentProducts.map(product => `
Product: ${product.title}
Price: EGP ${parseFloat(product.price).toFixed(2)}
Stock: ${product.stock}
Category: ${product.category}
---`).join('\n')}

===============================
END OF REPORT
===============================
Generated by SportFlex Admin Panel
`;

            const blob = new Blob([reportContent], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sportflex-report-${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast.success('Report exported successfully!');
        } catch (error) {
            console.error('Error exporting report:', error);
            toast.error('Failed to export report');
        }
    };

    // =========== RENDER FUNCTIONS ===========

    // UPDATED renderDashboard() WITH LIGHT THEME SUPPORT
    const renderDashboard = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className={`text-2xl font-bold transition-colors duration-300
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard Overview</h1>
                    <p className={`transition-colors duration-300
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Welcome back! Here's what's happening with your store today.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportReport}
                        className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-all duration-300
                            ${isDarkMode
                                ? 'bg-gray-800 text-white border-gray-700 hover:bg-gray-700'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                    >
                        <FaDownload /> Export Report
                    </button>
                </div>
            </div>

            {/* Stats Cards - Modern Attractive Design with Light/Dark Support */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    {
                        title: 'Total Products',
                        value: stats.totalProducts,
                        icon: <FaBox className="text-xl" />,
                        color: isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50',
                        iconColor: isDarkMode ? 'text-cyan-500' : 'text-cyan-700',
                        borderColor: isDarkMode ? 'border-gray-700' : 'border-gray-200',
                        textColor: isDarkMode ? 'text-white' : 'text-gray-900',
                        change: '+12%',
                        description: 'All products in store'
                    },
                    {
                        title: 'Total Categories',
                        value: stats.totalCategories,
                        icon: <FaTags className="text-xl" />,
                        color: isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50',
                        iconColor: isDarkMode ? 'text-purple-500' : 'text-purple-700',
                        borderColor: isDarkMode ? 'border-gray-700' : 'border-gray-200',
                        textColor: isDarkMode ? 'text-white' : 'text-gray-900',
                        change: '+5%',
                        description: 'Product categories'
                    },
                    {
                        title: 'Total Orders',
                        value: stats.totalOrders,
                        icon: <FaShoppingCart className="text-xl" />,
                        color: isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50',
                        iconColor: isDarkMode ? 'text-green-500' : 'text-green-700',
                        borderColor: isDarkMode ? 'border-gray-700' : 'border-gray-200',
                        textColor: isDarkMode ? 'text-white' : 'text-gray-900',
                        change: '+24%',
                        description: 'All time orders'
                    },
                    {
                        title: 'Total Users',
                        value: stats.totalUsers,
                        icon: <FaUsers className="text-xl" />,
                        color: isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50',
                        iconColor: isDarkMode ? 'text-pink-500' : 'text-pink-700',
                        borderColor: isDarkMode ? 'border-gray-700' : 'border-gray-200',
                        textColor: isDarkMode ? 'text-white' : 'text-gray-900',
                        change: '+8%',
                        description: 'Registered users'
                    },
                    {
                        title: 'Active Buyers',
                        value: stats.totalUsersOrdered,
                        icon: <FaUserCheck className="text-xl" />,
                        color: isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50',
                        iconColor: isDarkMode ? 'text-indigo-500' : 'text-indigo-700',
                        borderColor: isDarkMode ? 'border-gray-700' : 'border-gray-200',
                        textColor: isDarkMode ? 'text-white' : 'text-gray-900',
                        change: '+15%',
                        description: 'Users who ordered'
                    },
                    {
                        title: 'Total Revenue',
                        value: `EGP ${stats.totalRevenue.toFixed(2)}`,
                        icon: <FaChartLine className="text-xl" />,
                        color: isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50',
                        iconColor: isDarkMode ? 'text-amber-500' : 'text-amber-700',
                        borderColor: isDarkMode ? 'border-gray-700' : 'border-gray-200',
                        textColor: isDarkMode ? 'text-white' : 'text-gray-900',
                        change: '+32%',
                        description: 'All time revenue'
                    },
                    {
                        title: 'Low Stock',
                        value: stats.lowStockCount,
                        icon: <FaExclamationTriangle className="text-xl" />,
                        color: isDarkMode ? 'bg-gradient-to-br from-red-900/30 to-red-800/30' : 'bg-gradient-to-br from-red-50 to-red-100',
                        iconColor: isDarkMode ? 'text-red-400' : 'text-red-700',
                        borderColor: isDarkMode ? 'border-red-800/50' : 'border-red-200',
                        textColor: isDarkMode ? 'text-white' : 'text-gray-900',
                        change: 'Needs attention',
                        description: 'Products with stock < 5',
                        isAlert: stats.lowStockCount > 0
                    },
                    {
                        title: 'Out of Stock',
                        value: stats.outOfStockCount,
                        icon: <FaTimesCircle className="text-xl" />,
                        color: isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50',
                        iconColor: isDarkMode ? 'text-gray-400' : 'text-gray-700',
                        borderColor: isDarkMode ? 'border-gray-700' : 'border-gray-200',
                        textColor: isDarkMode ? 'text-white' : 'text-gray-900',
                        change: 'Check inventory',
                        description: 'No stock available',
                        isAlert: stats.outOfStockCount > 0
                    }
                ].map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`${stat.color} ${stat.borderColor} border rounded-2xl p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group`}
                    >
                        {/* Background pattern */}
                        <div className={`absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-10 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-400'}`}></div>
                        <div className={`absolute -left-6 -bottom-6 w-20 h-20 rounded-full opacity-10 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-400'}`}></div>

                        {/* Alert badge */}
                        {stat.isAlert && (
                            <div className="absolute -top-2 -right-2">
                                <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full shadow-lg">
                                    Alert
                                </span>
                            </div>
                        )}

                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className={`text-sm font-medium mb-1 transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.title}</p>
                                    <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.iconColor} ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
                                    {stat.icon}
                                </div>
                            </div>

                            <div className={`pt-4 border-t transition-colors duration-300
                                ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className={`text-xs transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.description}</p>
                                    </div>
                                    <div>
                                        <span className={`text-xs px-2 py-1 rounded-full 
                                            ${stat.isAlert
                                                ? isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'
                                                : isDarkMode ? 'bg-gray-700/70 text-gray-300' : 'bg-gray-200 text-gray-700'
                                            }`}>
                                            {stat.change}
                                        </span>
                                    </div>
                                </div>

                                {/* Progress bar for non-alert cards */}
                                {!stat.isAlert && index < 6 && (
                                    <div className="mt-3">
                                        <div className={`h-1.5 rounded-full overflow-hidden transition-colors duration-300
                                            ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                            <div
                                                className={`h-full ${stat.iconColor.replace('text', 'bg')}`}
                                                style={{ width: `${Math.min(100, (index + 1) * 15)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className={`rounded-2xl shadow-sm border p-6 transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className={`text-lg font-bold transition-colors duration-300
                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Recent Orders</h3>
                            <p className={`text-sm transition-colors duration-300
                                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Latest customer orders</p>
                        </div>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`text-sm font-medium flex items-center gap-1 transition-colors duration-300
                                ${isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'}`}
                        >
                            View All <FaChevronRight className="text-xs" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {orders.slice(0, 5).map((order) => (
                            <div key={order.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors group
                                ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full 
                                        ${order.status === 'Delivered' ? 'bg-green-500' :
                                            order.status === 'Processing' ? 'bg-blue-500' :
                                                order.status === 'Shipped' ? 'bg-indigo-500' :
                                                    'bg-amber-500'}`}></div>
                                    <div>
                                        <p className={`font-medium transition-colors duration-300
                                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>#{order.order_number}</p>
                                        <p className={`text-sm transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{order.customer_name}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>EGP {parseFloat(order.total_amount).toFixed(2)}</p>
                                    <p className={`text-xs transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{formatDate(order.created_at)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Products */}
                <div className={`rounded-2xl shadow-sm border p-6 transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className={`text-lg font-bold transition-colors duration-300
                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Recent Products</h3>
                            <p className={`text-sm transition-colors duration-300
                                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Latest added products</p>
                        </div>
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`text-sm font-medium flex items-center gap-1 transition-colors duration-300
                                ${isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'}`}
                        >
                            View All <FaChevronRight className="text-xs" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {products.slice(0, 5).map((product) => (
                            <div key={product.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors group
                                ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg overflow-hidden flex-shrink-0
                                        ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                        <img
                                            src={product.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop'}
                                            alt={product.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop';
                                            }}
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`font-medium truncate transition-colors duration-300
                                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{product.title}</p>
                                        <p className={`text-sm transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>EGP {parseFloat(product.price).toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xs px-2 py-1 rounded-full 
                                        ${product.stock > 10
                                            ? isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
                                            : product.stock >= 5
                                                ? isDarkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                                                : isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {product.stock} in stock
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Low Stock Alert Section */}
            {stats.lowStockCount > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className={`rounded-2xl shadow-sm border p-6 transition-colors duration-300
                        ${isDarkMode
                            ? 'bg-gradient-to-r from-red-900/30 to-orange-900/30 border-red-800/50'
                            : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'}`}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl transition-colors duration-300
                                ${isDarkMode ? 'bg-red-900/50' : 'bg-red-100'}`}>
                                <FaExclamationCircle className={`text-xl ${isDarkMode ? 'text-red-400' : 'text-red-700'}`} />
                            </div>
                            <div>
                                <h3 className={`text-lg font-bold transition-colors duration-300
                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Low Stock Alert</h3>
                                <p className={`text-sm transition-colors duration-300
                                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    You have <span className={`font-bold ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>{stats.lowStockCount}</span> products with critically low stock (&lt;5 units)
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveTab('products')}
                            className={`px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800'
                                    : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'}`}
                        >
                            <FaBox /> Manage Stock
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {products.filter(p => p.stock < 5).slice(0, 4).map(product => (
                            <div key={product.id} className={`p-4 rounded-xl border transition-colors duration-300
                                ${isDarkMode ? 'bg-gray-900 border-red-800/50' : 'bg-white border-red-200'}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium text-sm truncate transition-colors duration-300
                                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{product.title}</p>
                                        <p className={`text-xs mt-1 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>EGP {parseFloat(product.price).toFixed(2)}</p>
                                    </div>
                                    <span className={`ml-2 text-xs px-2 py-1 rounded-full 
                                        ${product.stock < 2
                                            ? isDarkMode ? 'bg-red-600 text-white' : 'bg-red-600 text-white'
                                            : isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {product.stock} left
                                    </span>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <span className={`text-xs transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {product.categories?.name || 'Uncategorized'}
                                    </span>
                                    <button
                                        onClick={() => handleEditProduct(product)}
                                        className={`text-xs font-medium transition-colors duration-300
                                            ${isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'}`}
                                    >
                                        Restock →
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {stats.lowStockCount > 4 && (
                        <div className={`mt-6 pt-4 border-t transition-colors duration-300
                            ${isDarkMode ? 'border-red-800/50' : 'border-red-200'}`}>
                            <button
                                onClick={() => setActiveTab('products')}
                                className={`text-sm font-medium flex items-center gap-2 transition-colors duration-300
                                    ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-700 hover:text-red-800'}`}
                            >
                                View all low stock products ({stats.lowStockCount}) <FaChevronRight />
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
        </motion.div>
    );

    // UPDATED renderProducts WITH LIGHT THEME SUPPORT
    const renderProducts = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            {/* Header with Search */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className={`text-2xl font-bold transition-colors duration-300
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Product Management</h1>
                    <p className={`transition-colors duration-300
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage your store products and inventory</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300
                            ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                ${isDarkMode
                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-cyan-500 focus:border-cyan-500'
                                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-cyan-700 focus:border-cyan-700'}`}
                        />
                    </div>
                    <button
                        onClick={() => {
                            resetProductForm();
                            setShowProductModal(true);
                        }}
                        className={`flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg
                            ${isDarkMode
                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
                                : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'}`}
                    >
                        <FaPlus /> Add Product
                    </button>
                </div>
            </div>

            {/* Stats Bar - Updated with stock alerts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>Total Products</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{products.length}</p>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>In Stock</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {products.filter(p => p.stock > 0).length}
                    </p>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>Low Stock</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {products.filter(p => p.stock > 0 && p.stock < 10).length}
                    </p>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>Critical Stock (&lt;5)</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {products.filter(p => p.stock > 0 && p.stock < 5).length}
                    </p>
                </div>
            </div>

            {/* Product Grid/Table Toggle */}
            <div className={`rounded-xl shadow-lg overflow-hidden border transition-colors duration-300
                ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className={`p-4 border-b transition-colors duration-300
                    ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setActiveFilters({ ...activeFilters, products: 'all' })}
                                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-300
                                    ${activeFilters.products === 'all'
                                        ? isDarkMode ? 'bg-cyan-900/50 text-cyan-300' : 'bg-cyan-100 text-cyan-700'
                                        : isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                                    }`}
                            >
                                All ({products.length})
                            </button>
                            <button
                                onClick={() => setActiveFilters({ ...activeFilters, products: 'in-stock' })}
                                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-300
                                    ${activeFilters.products === 'in-stock'
                                        ? isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
                                        : isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                                    }`}
                            >
                                In Stock ({products.filter(p => p.stock > 0).length})
                            </button>
                            <button
                                onClick={() => setActiveFilters({ ...activeFilters, products: 'low-stock' })}
                                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-300
                                    ${activeFilters.products === 'low-stock'
                                        ? isDarkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                                        : isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                                    }`}
                            >
                                Low Stock ({products.filter(p => p.stock > 0 && p.stock < 10).length})
                            </button>
                            <button
                                onClick={() => setActiveFilters({ ...activeFilters, products: 'critical-stock' })}
                                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-300
                                    ${activeFilters.products === 'critical-stock'
                                        ? isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'
                                        : isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                                    }`}
                            >
                                Critical Stock ({products.filter(p => p.stock > 0 && p.stock < 5).length})
                            </button>
                            <button
                                onClick={() => setActiveFilters({ ...activeFilters, products: 'out-of-stock' })}
                                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-300
                                    ${activeFilters.products === 'out-of-stock'
                                        ? isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'
                                        : isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                                    }`}
                            >
                                Out of Stock ({products.filter(p => p.stock === 0).length})
                            </button>
                        </div>
                        <button className={`flex items-center gap-2 text-sm transition-colors duration-300
                            ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'}`}>
                            <FaFilter /> Filter
                        </button>
                    </div>
                </div>

                {isInitializing ? (
                    <div className="flex justify-center items-center h-64">
                        <FaSpinner className={`animate-spin text-4xl ${isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}`} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {getFilteredProducts().map((product) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className={`border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group relative
                                    ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                            >
                                {/* Low Stock Alert Badge */}
                                {product.stock < 5 && (
                                    <div className="absolute top-3 left-3 z-10">
                                        <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full flex items-center gap-1 shadow-lg">
                                            <FaExclamationCircle className="text-xs" />
                                            Low Stock
                                        </span>
                                    </div>
                                )}

                                <div className={`relative h-48 overflow-hidden
                                    ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
                                    <img
                                        src={product.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop'}
                                        alt={product.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => {
                                            e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop';
                                        }}
                                    />
                                    <div className="absolute top-3 right-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                            ${product.stock > 10
                                                ? isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
                                                : product.stock >= 5
                                                    ? isDarkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                                                    : isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-3 left-3">
                                        <span className={`px-2 py-1 bg-black/70 text-white text-xs rounded-full`}>
                                            {product.categories?.name || 'Uncategorized'}
                                        </span>
                                    </div>
                                    {product.images?.length > 1 && (
                                        <div className="absolute bottom-3 right-3">
                                            <span className="px-2 py-1 bg-black/70 text-white text-xs rounded-full">
                                                <FaImage className="inline mr-1" /> +{product.images.length - 1}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className={`font-bold truncate transition-colors duration-300
                                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{product.title}</h4>
                                        <p className={`font-bold text-lg transition-colors duration-300
                                            ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>EGP {parseFloat(product.price).toFixed(2)}</p>
                                    </div>
                                    <p className={`text-sm mb-4 line-clamp-2 transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{product.description}</p>
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditProduct(product)}
                                                className={`p-2 rounded-lg transition-colors
                                                    ${isDarkMode ? 'text-cyan-400 hover:bg-cyan-900/30' : 'text-cyan-700 hover:bg-cyan-100'}`}
                                                title="Edit"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(product.id)}
                                                className={`p-2 rounded-lg transition-colors
                                                    ${isDarkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-700 hover:bg-red-100'}`}
                                                title="Delete"
                                            >
                                                <FaTrash />
                                            </button>
                                            <button
                                                onClick={() => navigate(`/productdetailsadmin/${product.id}`)}
                                                className={`p-2 rounded-lg transition-colors
                                                    ${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                                                title="View Details"
                                            >
                                                <FaEye />
                                            </button>
                                        </div>
                                        <span className={`text-xs transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {formatDate(product.created_at)}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Product Modal */}
            {showProductModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border transition-colors duration-300
                            ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className={`text-xl font-bold transition-colors duration-300
                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowProductModal(false);
                                        resetProductForm();
                                    }}
                                    className={`p-2 rounded-full transition-colors
                                        ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                                >
                                    <FaTimes className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                                </button>
                            </div>

                            <form onSubmit={handleProductSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Product Title *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={productForm.title}
                                            onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                                ${isDarkMode
                                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-cyan-500 focus:border-cyan-500'
                                                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-cyan-700 focus:border-cyan-700'}`}
                                            placeholder="Enter product title"
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Price (EGP) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            value={productForm.price}
                                            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                                ${isDarkMode
                                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-cyan-500 focus:border-cyan-500'
                                                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-cyan-700 focus:border-cyan-700'}`}
                                            placeholder="Enter price"
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Category
                                        </label>
                                        <select
                                            value={productForm.category_id}
                                            onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                                ${isDarkMode
                                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-cyan-500 focus:border-cyan-500'
                                                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-cyan-700 focus:border-cyan-700'}`}
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Stock Quantity *
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            required
                                            value={productForm.stock}
                                            onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                                ${isDarkMode
                                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-cyan-500 focus:border-cyan-500'
                                                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-cyan-700 focus:border-cyan-700'}`}
                                            placeholder="Enter stock quantity"
                                        />
                                        {parseInt(productForm.stock) < 5 && productForm.stock !== '' && (
                                            <p className={`text-sm mt-1 flex items-center gap-1
                                                ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                                                <FaExclamationCircle className="text-xs" /> Low stock alert will be shown
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Main Image Upload - REPLACED URL INPUT WITH UPLOADER */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Main Image *
                                    </label>
                                    <div className="space-y-4">
                                        {productForm.image_url ? (
                                            <div className="relative group">
                                                <img
                                                    src={productForm.image_url}
                                                    alt="Main product"
                                                    className="w-full h-48 object-cover rounded-lg border-2 border-cyan-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={removeMainImage}
                                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                >
                                                    <FaTimes />
                                                </button>
                                                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                                    Main Image
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                                                    ${isDarkMode
                                                        ? 'border-gray-600 hover:border-cyan-500 bg-gray-800'
                                                        : 'border-gray-300 hover:border-cyan-700 bg-gray-50'}`}
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    accept="image/*"
                                                    onChange={handleMainImageUpload}
                                                    className="hidden"
                                                />
                                                <div className="flex flex-col items-center gap-3">
                                                    <FaUpload className={`text-4xl ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                        Click to upload main product image
                                                    </p>
                                                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        PNG, JPG, GIF, WEBP (max. 5MB)
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {uploading && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <FaSpinner className="animate-spin text-cyan-500" />
                                                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                        Uploading... {Math.round(uploadProgress)}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div
                                                        className="bg-cyan-600 h-2.5 rounded-full transition-all duration-300"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Description
                                    </label>
                                    <textarea
                                        value={productForm.description}
                                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                        rows="3"
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                            ${isDarkMode
                                                ? 'border-gray-700 bg-gray-800 text-white focus:ring-cyan-500 focus:border-cyan-500'
                                                : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-cyan-700 focus:border-cyan-700'}`}
                                        placeholder="Enter product description"
                                    />
                                </div>

                                {/* Additional Images Upload - REPLACED URL INPUTS WITH UPLOADER */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className={`block text-sm font-medium transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Additional Images
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => additionalFileInputRef.current?.click()}
                                            className={`text-sm transition-colors duration-300 flex items-center gap-1
                                                ${isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'}`}
                                        >
                                            <FaUpload /> Add Image
                                        </button>
                                    </div>

                                    <input
                                        type="file"
                                        ref={additionalFileInputRef}
                                        accept="image/*"
                                        onChange={handleAdditionalImageUpload}
                                        className="hidden"
                                    />

                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {productForm.additionalImages.map((image, index) => (
                                            <div key={index} className="relative group">
                                                <img
                                                    src={image}
                                                    alt={`Additional ${index + 1}`}
                                                    className="w-full h-20 object-cover rounded-lg border"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeAdditionalImage(index)}
                                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowProductModal(false);
                                            resetProductForm();
                                        }}
                                        className={`px-6 py-2 border rounded-lg transition-colors
                                            ${isDarkMode
                                                ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                                                : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading || uploading}
                                        className={`px-6 py-2 text-white rounded-lg disabled:opacity-50 flex items-center gap-2
                                            ${isDarkMode
                                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
                                                : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'}`}
                                    >
                                        {isLoading ? (
                                            <FaSpinner className="animate-spin" />
                                        ) : (
                                            <FaCheck />
                                        )}
                                        {editingProduct ? 'Update Product' : 'Add Product'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );

    // =========== UPDATED RENDER FUNCTIONS FOR OTHER SECTIONS ===========

    const renderCategories = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className={`text-2xl font-bold transition-colors duration-300
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Category Management</h1>
                    <p className={`transition-colors duration-300
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Organize your products into categories</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300
                            ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                ${isDarkMode
                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-purple-500 focus:border-purple-500'
                                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-purple-700 focus:border-purple-700'}`}
                        />
                    </div>
                    <button
                        onClick={() => {
                            resetCategoryForm();
                            setShowCategoryModal(true);
                        }}
                        className={`flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg
                            ${isDarkMode
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                                : 'bg-gradient-to-r from-purple-700 to-pink-700 hover:from-purple-800 hover:to-pink-800'}`}
                    >
                        <FaTag /> Add Category
                    </button>
                </div>
            </div>

            {/* Category Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>Total Categories</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{categories.length}</p>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>Active</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {categories.filter(c => c.is_active).length}
                    </p>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Inactive</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {categories.filter(c => !c.is_active).length}
                    </p>
                </div>
            </div>

            {/* Category Cards */}
            {isInitializing ? (
                <div className="flex justify-center items-center h-64">
                    <FaSpinner className={`animate-spin text-4xl ${isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}`} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCategories.map((category) => (
                        <motion.div
                            key={category.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className={`border rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group
                                ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
                        >
                            <div className={`relative h-40 overflow-hidden bg-gradient-to-br 
                                ${isDarkMode ? 'from-purple-900/30 to-pink-900/30' : 'from-purple-100 to-pink-100'}`}>
                                <img
                                    src={category.image_url || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&h=400&fit=crop'}
                                    alt={category.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    onError={(e) => {
                                        e.target.src = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&h=400&fit=crop';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                                <div className="absolute top-3 right-3">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                        ${category.is_active
                                            ? isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
                                            : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                                        }`}>
                                        {category.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-4">
                                <h4 className={`font-bold truncate mb-2 transition-colors duration-300
                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{category.name}</h4>
                                <p className={`text-sm mb-4 line-clamp-2 transition-colors duration-300
                                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{category.description}</p>
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditCategory(category)}
                                            className={`p-2 rounded-lg transition-colors
                                                ${isDarkMode ? 'text-cyan-400 hover:bg-cyan-900/30' : 'text-cyan-700 hover:bg-cyan-100'}`}
                                            title="Edit"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCategory(category.id)}
                                            className={`p-2 rounded-lg transition-colors
                                                ${isDarkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-700 hover:bg-red-100'}`}
                                            title="Delete"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                    <span className={`text-xs transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {formatDate(category.created_at)}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border transition-colors duration-300
                            ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className={`text-xl font-bold transition-colors duration-300
                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {editingCategory ? 'Edit Category' : 'Add New Category'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowCategoryModal(false);
                                        resetCategoryForm();
                                    }}
                                    className={`p-2 rounded-full transition-colors
                                        ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                                >
                                    <FaTimes className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                                </button>
                            </div>

                            <form onSubmit={handleCategorySubmit} className="space-y-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Category Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={categoryForm.name}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                            ${isDarkMode
                                                ? 'border-gray-700 bg-gray-800 text-white focus:ring-purple-500 focus:border-purple-500'
                                                : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-purple-700 focus:border-purple-700'}`}
                                        placeholder="Enter category name"
                                    />
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Description
                                    </label>
                                    <textarea
                                        value={categoryForm.description}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                        rows="3"
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                            ${isDarkMode
                                                ? 'border-gray-700 bg-gray-800 text-white focus:ring-purple-500 focus:border-purple-500'
                                                : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-purple-700 focus:border-purple-700'}`}
                                        placeholder="Enter category description"
                                    />
                                </div>

                                {/* Category Image Upload */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Category Image
                                    </label>
                                    <div className="space-y-4">
                                        {categoryForm.image_url ? (
                                            <div className="relative group">
                                                <img
                                                    src={categoryForm.image_url}
                                                    alt="Category"
                                                    className="w-full h-32 object-cover rounded-lg border-2 border-purple-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={removeCategoryImage}
                                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        ) : (
                                            <div
                                                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                                                    ${isDarkMode
                                                        ? 'border-gray-600 hover:border-purple-500 bg-gray-800'
                                                        : 'border-gray-300 hover:border-purple-700 bg-gray-50'}`}
                                                onClick={() => document.getElementById('category-image-upload').click()}
                                            >
                                                <input
                                                    type="file"
                                                    id="category-image-upload"
                                                    accept="image/*"
                                                    onChange={handleCategoryImageUpload}
                                                    className="hidden"
                                                />
                                                <div className="flex flex-col items-center gap-2">
                                                    <FaUpload className={`text-2xl ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                        Click to upload category image
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={categoryForm.is_active}
                                        onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                    />
                                    <label htmlFor="is_active" className={`text-sm transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Active Category
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCategoryModal(false);
                                            resetCategoryForm();
                                        }}
                                        className={`px-6 py-2 border rounded-lg transition-colors
                                            ${isDarkMode
                                                ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                                                : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`px-6 py-2 text-white rounded-lg disabled:opacity-50 flex items-center gap-2
                                            ${isDarkMode
                                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                                                : 'bg-gradient-to-r from-purple-700 to-pink-700 hover:from-purple-800 hover:to-pink-800'}`}
                                    >
                                        {isLoading ? (
                                            <FaSpinner className="animate-spin" />
                                        ) : (
                                            <FaCheck />
                                        )}
                                        {editingCategory ? 'Update Category' : 'Add Category'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );

    const renderShipping = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className={`text-2xl font-bold transition-colors duration-300
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Shipping Cost Management</h1>
                    <p className={`transition-colors duration-300
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage shipping costs for different governorates</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300
                            ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <input
                            type="text"
                            placeholder="Search shipping..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                ${isDarkMode
                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-orange-500 focus:border-orange-500'
                                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-orange-700 focus:border-orange-700'}`}
                        />
                    </div>
                    <button
                        onClick={() => {
                            resetShippingForm();
                            setShowShippingModal(true);
                        }}
                        className={`flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg
                            ${isDarkMode
                                ? 'bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700'
                                : 'bg-gradient-to-r from-orange-700 to-yellow-700 hover:from-orange-800 hover:to-yellow-800'}`}
                    >
                        <FaTruck /> Add Shipping
                    </button>
                </div>
            </div>

            {/* Shipping Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-orange-400' : 'text-orange-700'}`}>Total Areas</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{shippingCosts.length}</p>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>Active</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {shippingCosts.filter(s => s.is_active).length}
                    </p>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>Avg. Cost</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        EGP {(shippingCosts.reduce((sum, s) => sum + parseFloat(s.cost), 0) / shippingCosts.length || 0).toFixed(2)}
                    </p>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>Avg. Days</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {(shippingCosts.reduce((sum, s) => sum + parseInt(s.delivery_days), 0) / shippingCosts.length || 0).toFixed(1)} days
                    </p>
                </div>
            </div>

            {/* Shipping Table */}
            {isInitializing ? (
                <div className="flex justify-center items-center h-64">
                    <FaSpinner className={`animate-spin text-4xl ${isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}`} />
                </div>
            ) : (
                <div className={`rounded-xl shadow-lg overflow-hidden border transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className={`bg-gradient-to-r 
                                    ${isDarkMode ? 'from-orange-900/30 to-yellow-900/30' : 'from-orange-100 to-yellow-100'}`}>
                                    <th className={`py-4 px-6 text-left text-sm font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Governorate (English)</th>
                                    <th className={`py-4 px-6 text-left text-sm font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Governorate (Arabic)</th>
                                    <th className={`py-4 px-6 text-left text-sm font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Cost (EGP)</th>
                                    <th className={`py-4 px-6 text-left text-sm font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Delivery Days</th>
                                    <th className={`py-4 px-6 text-left text-sm font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                                    <th className={`py-4 px-6 text-left text-sm font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredShipping.map((shipping) => (
                                    <tr key={shipping.id} className={`border-b transition-colors duration-300
                                        ${isDarkMode ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className={`font-medium transition-colors duration-300
                                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{shipping.governorate}</p>
                                                {shipping.notes && (
                                                    <p className={`text-xs mt-1 transition-colors duration-300
                                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{shipping.notes}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className={`py-4 px-6 text-sm font-arabic transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{shipping.governorate_ar || '-'}</td>
                                        <td className="py-4 px-6">
                                            <p className={`font-semibold transition-colors duration-300
                                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>EGP {parseFloat(shipping.cost).toFixed(2)}</p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm transition-colors duration-300
                                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{shipping.delivery_days} days</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium 
                                                ${shipping.is_active
                                                    ? isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
                                                    : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                                                }`}>
                                                {shipping.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditShipping(shipping)}
                                                    className={`p-2 rounded-lg transition-colors
                                                        ${isDarkMode ? 'text-cyan-400 hover:bg-cyan-900/30' : 'text-cyan-700 hover:bg-cyan-100'}`}
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteShipping(shipping.id)}
                                                    className={`p-2 rounded-lg transition-colors
                                                        ${isDarkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-700 hover:bg-red-100'}`}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Shipping Modal */}
            {showShippingModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border transition-colors duration-300
                            ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className={`text-xl font-bold transition-colors duration-300
                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {editingShipping ? 'Edit Shipping Cost' : 'Add Shipping Cost'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowShippingModal(false);
                                        resetShippingForm();
                                    }}
                                    className={`p-2 rounded-full transition-colors
                                        ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                                >
                                    <FaTimes className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                                </button>
                            </div>

                            <form onSubmit={handleShippingSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Governorate (English) *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={shippingForm.governorate}
                                            onChange={(e) => setShippingForm({ ...shippingForm, governorate: e.target.value })}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                                ${isDarkMode
                                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-orange-500 focus:border-orange-500'
                                                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-orange-700 focus:border-orange-700'}`}
                                            placeholder="Cairo"
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Governorate (Arabic)
                                        </label>
                                        <input
                                            type="text"
                                            value={shippingForm.governorate_ar}
                                            onChange={(e) => setShippingForm({ ...shippingForm, governorate_ar: e.target.value })}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300 font-arabic
                                                ${isDarkMode
                                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-orange-500 focus:border-orange-500'
                                                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-orange-700 focus:border-orange-700'}`}
                                            placeholder="القاهرة"
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Cost (EGP) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            value={shippingForm.cost}
                                            onChange={(e) => setShippingForm({ ...shippingForm, cost: e.target.value })}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                                ${isDarkMode
                                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-orange-500 focus:border-orange-500'
                                                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-orange-700 focus:border-orange-700'}`}
                                            placeholder="30.00"
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Delivery Days *
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            value={shippingForm.delivery_days}
                                            onChange={(e) => setShippingForm({ ...shippingForm, delivery_days: e.target.value })}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                                ${isDarkMode
                                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-orange-500 focus:border-orange-500'
                                                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-orange-700 focus:border-orange-700'}`}
                                            placeholder="3"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Notes
                                    </label>
                                    <textarea
                                        value={shippingForm.notes}
                                        onChange={(e) => setShippingForm({ ...shippingForm, notes: e.target.value })}
                                        rows="2"
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                            ${isDarkMode
                                                ? 'border-gray-700 bg-gray-800 text-white focus:ring-orange-500 focus:border-orange-500'
                                                : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-orange-700 focus:border-orange-700'}`}
                                        placeholder="Additional notes about this shipping area"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="shipping_active"
                                        checked={shippingForm.is_active}
                                        onChange={(e) => setShippingForm({ ...shippingForm, is_active: e.target.checked })}
                                        className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                    />
                                    <label htmlFor="shipping_active" className={`text-sm transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Active Shipping Area
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowShippingModal(false);
                                            resetShippingForm();
                                        }}
                                        className={`px-6 py-2 border rounded-lg transition-colors
                                            ${isDarkMode
                                                ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                                                : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`px-6 py-2 text-white rounded-lg disabled:opacity-50 flex items-center gap-2
                                            ${isDarkMode
                                                ? 'bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700'
                                                : 'bg-gradient-to-r from-orange-700 to-yellow-700 hover:from-orange-800 hover:to-yellow-800'}`}
                                    >
                                        {isLoading ? (
                                            <FaSpinner className="animate-spin" />
                                        ) : (
                                            <FaCheck />
                                        )}
                                        {editingShipping ? 'Update Shipping' : 'Add Shipping'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );

    const renderSpecialOffers = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className={`text-2xl font-bold transition-colors duration-300
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Special Offers Management</h1>
                    <p className={`transition-colors duration-300
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage banner offers displayed on the website</p>
                </div>
                <button
                    onClick={() => {
                        resetSpecialOfferForm();
                        setShowSpecialOfferModal(true);
                    }}
                    className={`flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg
                        ${isDarkMode
                            ? 'bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700'
                            : 'bg-gradient-to-r from-orange-700 to-pink-700 hover:from-orange-800 hover:to-pink-800'}`}
                >
                    <FaGift /> Add Special Offer
                </button>
            </div>

            {/* Offers Grid */}
            {isInitializing ? (
                <div className="flex justify-center items-center h-64">
                    <FaSpinner className={`animate-spin text-4xl ${isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}`} />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredSpecialOffers.map((offer) => (
                        <div key={offer.id} className={`rounded-xl shadow-lg p-6 border transition-colors duration-300
                            ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className={`font-bold text-lg transition-colors duration-300
                                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Banner Text</h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                            ${offer.is_active
                                                ? isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
                                                : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                                            }`}>
                                            {offer.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className={`p-4 rounded-lg border-l-4 transition-colors duration-300
                                        ${isDarkMode
                                            ? 'text-gray-300 bg-gray-800 border-orange-500'
                                            : 'text-gray-700 bg-gray-50 border-orange-700'}`}>
                                        {offer.banner_text}
                                    </p>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => handleEditSpecialOffer(offer)}
                                        className={`p-2 rounded-lg transition-colors
                                            ${isDarkMode ? 'text-cyan-400 hover:bg-cyan-900/30' : 'text-cyan-700 hover:bg-cyan-100'}`}
                                        title="Edit"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSpecialOffer(offer.id)}
                                        className={`p-2 rounded-lg transition-colors
                                            ${isDarkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-700 hover:bg-red-100'}`}
                                        title="Delete"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className={`transition-colors duration-300
                                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <span className="font-medium">Created:</span> {formatDate(offer.created_at)}
                                </div>
                                {offer.start_date && (
                                    <div className={`transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        <span className="font-medium">Starts:</span> {formatDateTime(offer.start_date)}
                                    </div>
                                )}
                                {offer.end_date && (
                                    <div className={`transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        <span className="font-medium">Ends:</span> {formatDateTime(offer.end_date)}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Special Offer Modal */}
            {showSpecialOfferModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border transition-colors duration-300
                            ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className={`text-xl font-bold transition-colors duration-300
                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {editingSpecialOffer ? 'Edit Special Offer' : 'Add Special Offer'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowSpecialOfferModal(false);
                                        resetSpecialOfferForm();
                                    }}
                                    className={`p-2 rounded-full transition-colors
                                        ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                                >
                                    <FaTimes className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                                </button>
                            </div>

                            <form onSubmit={handleSpecialOfferSubmit} className="space-y-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Banner Text *
                                    </label>
                                    <textarea
                                        required
                                        value={specialOfferForm.banner_text}
                                        onChange={(e) => setSpecialOfferForm({ ...specialOfferForm, banner_text: e.target.value })}
                                        rows="3"
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                            ${isDarkMode
                                                ? 'border-gray-700 bg-gray-800 text-white focus:ring-orange-500 focus:border-orange-500'
                                                : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-orange-700 focus:border-orange-700'}`}
                                        placeholder="Enter banner text to display on the website"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Start Date & Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={specialOfferForm.start_date}
                                            onChange={(e) => setSpecialOfferForm({ ...specialOfferForm, start_date: e.target.value })}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                                ${isDarkMode
                                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-orange-500 focus:border-orange-500'
                                                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-orange-700 focus:border-orange-700'}`}
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            End Date & Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={specialOfferForm.end_date}
                                            onChange={(e) => setSpecialOfferForm({ ...specialOfferForm, end_date: e.target.value })}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                                ${isDarkMode
                                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-orange-500 focus:border-orange-500'
                                                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-orange-700 focus:border-orange-700'}`}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_active_offer"
                                        checked={specialOfferForm.is_active}
                                        onChange={(e) => setSpecialOfferForm({ ...specialOfferForm, is_active: e.target.checked })}
                                        className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                    />
                                    <label htmlFor="is_active_offer" className={`text-sm transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Active Offer
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowSpecialOfferModal(false);
                                            resetSpecialOfferForm();
                                        }}
                                        className={`px-6 py-2 border rounded-lg transition-colors
                                            ${isDarkMode
                                                ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                                                : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`px-6 py-2 text-white rounded-lg disabled:opacity-50 flex items-center gap-2
                                            ${isDarkMode
                                                ? 'bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700'
                                                : 'bg-gradient-to-r from-orange-700 to-pink-700 hover:from-orange-800 hover:to-pink-800'}`}
                                    >
                                        {isLoading ? (
                                            <FaSpinner className="animate-spin" />
                                        ) : (
                                            <FaCheck />
                                        )}
                                        {editingSpecialOffer ? 'Update Offer' : 'Add Offer'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );

    const renderPromoCodes = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className={`text-2xl font-bold transition-colors duration-300
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Promo Codes Management</h1>
                    <p className={`transition-colors duration-300
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Create and manage discount codes for customers</p>
                </div>
                <button
                    onClick={() => {
                        resetPromoCodeForm();
                        setShowPromoCodeModal(true);
                    }}
                    className={`flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg
                        ${isDarkMode
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                            : 'bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800'}`}
                >
                    <FaTicketAlt /> Add Promo Code
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>Total Codes</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{promoCodes.length}</p>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>Active</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {promoCodes.filter(p => p.is_active).length}
                    </p>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>Times Used</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {promoCodes.reduce((sum, p) => sum + (p.times_used || 0), 0)}
                    </p>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>Expired</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {promoCodes.filter(p => p.end_date && new Date(p.end_date) < new Date()).length}
                    </p>
                </div>
            </div>

            {/* Promo Codes Table */}
            {isInitializing ? (
                <div className="flex justify-center items-center h-64">
                    <FaSpinner className={`animate-spin text-4xl ${isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}`} />
                </div>
            ) : (
                <div className={`rounded-xl shadow-lg overflow-hidden border transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className={`bg-gradient-to-r 
                                    ${isDarkMode ? 'from-purple-900/30 to-indigo-900/30' : 'from-purple-100 to-indigo-100'}`}>
                                    <th className={`py-4 px-6 text-left text-sm font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Code</th>
                                    <th className={`py-4 px-6 text-left text-sm font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description</th>
                                    <th className={`py-4 px-6 text-left text-sm font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Discount</th>
                                    <th className={`py-4 px-6 text-left text-sm font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Usage</th>
                                    <th className={`py-4 px-6 text-left text-sm font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                                    <th className={`py-4 px-6 text-left text-sm font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPromoCodes.map((promo) => (
                                    <tr key={promo.id} className={`border-b transition-colors duration-300
                                        ${isDarkMode ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className={`font-mono font-bold transition-colors duration-300
                                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{promo.code}</p>
                                                <p className={`text-xs transition-colors duration-300
                                                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {promo.start_date ? formatDate(promo.start_date) : 'No start date'} -
                                                    {promo.end_date ? formatDate(promo.end_date) : 'No end date'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className={`text-sm transition-colors duration-300
                                                ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{promo.description || 'No description'}</p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className={`font-medium transition-colors duration-300
                                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `EGP ${promo.discount_value}`}
                                                </p>
                                                {promo.minimum_order && (
                                                    <p className={`text-xs transition-colors duration-300
                                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Min: EGP {promo.minimum_order}</p>
                                                )}
                                                {promo.maximum_discount && promo.discount_type === 'percentage' && (
                                                    <p className={`text-xs transition-colors duration-300
                                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Max: EGP {promo.maximum_discount}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className={`text-sm transition-colors duration-300
                                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {promo.times_used || 0} / {promo.usage_limit || '∞'}
                                                </p>
                                                <p className={`text-xs transition-colors duration-300
                                                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Times used</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium 
                                                ${promo.is_active
                                                    ? isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
                                                    : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                                                }`}>
                                                {promo.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditPromoCode(promo)}
                                                    className={`p-2 rounded-lg transition-colors
                                                        ${isDarkMode ? 'text-cyan-400 hover:bg-cyan-900/30' : 'text-cyan-700 hover:bg-cyan-100'}`}
                                                >
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePromoCode(promo.id)}
                                                    className={`p-2 rounded-lg transition-colors
                                                        ${isDarkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-700 hover:bg-red-100'}`}
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Promo Code Modal */}
            {showPromoCodeModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border transition-colors duration-300
                            ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className={`text-xl font-bold transition-colors duration-300
                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {editingPromoCode ? 'Edit Promo Code' : 'Add Promo Code'}
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowPromoCodeModal(false);
                                        resetPromoCodeForm();
                                    }}
                                    className={`p-2 rounded-full transition-colors
                                        ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                                >
                                    <FaTimes className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                                </button>
                            </div>

                            <form onSubmit={handlePromoCodeSubmit} className="space-y-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Code *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={promoCodeForm.code}
                                        onChange={(e) => setPromoCodeForm({ ...promoCodeForm, code: e.target.value.toUpperCase() })}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300 font-mono
                                            ${isDarkMode
                                                ? 'border-gray-700 bg-gray-800 text-white focus:ring-purple-500 focus:border-purple-500'
                                                : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-purple-700 focus:border-purple-700'}`}
                                        placeholder="SUMMER50"
                                    />
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        value={promoCodeForm.description}
                                        onChange={(e) => setPromoCodeForm({ ...promoCodeForm, description: e.target.value })}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                            ${isDarkMode
                                                ? 'border-gray-700 bg-gray-800 text-white focus:ring-purple-500 focus:border-purple-500'
                                                : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-purple-700 focus:border-purple-700'}`}
                                        placeholder="Summer discount 50% off"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Discount Type *
                                        </label>
                                        <select
                                            value={promoCodeForm.discount_type}
                                            onChange={(e) => setPromoCodeForm({ ...promoCodeForm, discount_type: e.target.value })}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                                ${isDarkMode
                                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-purple-500 focus:border-purple-500'
                                                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-purple-700 focus:border-purple-700'}`}
                                        >
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount (EGP)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Discount Value *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            value={promoCodeForm.discount_value}
                                            onChange={(e) => setPromoCodeForm({ ...promoCodeForm, discount_value: e.target.value })}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                                ${isDarkMode
                                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-purple-500 focus:border-purple-500'
                                                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-purple-700 focus:border-purple-700'}`}
                                            placeholder={promoCodeForm.discount_type === 'percentage' ? '50' : '100'}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Minimum Order (EGP)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={promoCodeForm.minimum_order}
                                            onChange={(e) => setPromoCodeForm({ ...promoCodeForm, minimum_order: e.target.value })}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                                ${isDarkMode
                                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-purple-500 focus:border-purple-500'
                                                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-purple-700 focus:border-purple-700'}`}
                                            placeholder="No minimum"
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Maximum Discount (EGP)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={promoCodeForm.maximum_discount}
                                            onChange={(e) => setPromoCodeForm({ ...promoCodeForm, maximum_discount: e.target.value })}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                                ${isDarkMode
                                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-purple-500 focus:border-purple-500'
                                                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-purple-700 focus:border-purple-700'}`}
                                            placeholder="No maximum"
                                            disabled={promoCodeForm.discount_type === 'fixed'}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Usage Limit
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={promoCodeForm.usage_limit}
                                            onChange={(e) => setPromoCodeForm({ ...promoCodeForm, usage_limit: e.target.value })}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                                ${isDarkMode
                                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-purple-500 focus:border-purple-500'
                                                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-purple-700 focus:border-purple-700'}`}
                                            placeholder="Unlimited"
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Status
                                        </label>
                                        <select
                                            value={promoCodeForm.is_active ? 'active' : 'inactive'}
                                            onChange={(e) => setPromoCodeForm({ ...promoCodeForm, is_active: e.target.value === 'active' })}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                                ${isDarkMode
                                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-purple-500 focus:border-purple-500'
                                                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-purple-700 focus:border-purple-700'}`}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Start Date & Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={promoCodeForm.start_date}
                                            onChange={(e) => setPromoCodeForm({ ...promoCodeForm, start_date: e.target.value })}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                                ${isDarkMode
                                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-purple-500 focus:border-purple-500'
                                                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-purple-700 focus:border-purple-700'}`}
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            End Date & Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={promoCodeForm.end_date}
                                            onChange={(e) => setPromoCodeForm({ ...promoCodeForm, end_date: e.target.value })}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                                ${isDarkMode
                                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-purple-500 focus:border-purple-500'
                                                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-purple-700 focus:border-purple-700'}`}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPromoCodeModal(false);
                                            resetPromoCodeForm();
                                        }}
                                        className={`px-6 py-2 border rounded-lg transition-colors
                                            ${isDarkMode
                                                ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                                                : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`px-6 py-2 text-white rounded-lg disabled:opacity-50 flex items-center gap-2
                                            ${isDarkMode
                                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                                                : 'bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800'}`}
                                    >
                                        {isLoading ? (
                                            <FaSpinner className="animate-spin" />
                                        ) : (
                                            <FaCheck />
                                        )}
                                        {editingPromoCode ? 'Update Promo Code' : 'Add Promo Code'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );

    const renderOrders = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className={`text-2xl font-bold transition-colors duration-300
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Order Management</h1>
                    <p className={`transition-colors duration-300
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Track and manage customer orders</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 sm:w-64">
                        <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300
                            ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                                ${isDarkMode
                                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-green-500 focus:border-green-500'
                                    : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-green-700 focus:border-green-700'}`}
                        />
                    </div>
                    <div className={`text-sm px-3 py-1.5 rounded-lg transition-colors duration-300
                        ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                        <span className="font-medium">{stats.totalUsersOrdered}</span> users ordered
                    </div>
                </div>
            </div>

            {/* Order Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Pending</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {orders.filter(o => o.status === 'Pending').length}
                    </p>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-indigo-400' : 'text-indigo-700'}`}>Processing</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {orders.filter(o => o.status === 'Processing').length}
                    </p>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>Shipped</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {orders.filter(o => o.status === 'Shipped').length}
                    </p>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>Total Revenue</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>EGP {stats.totalRevenue.toFixed(2)}</p>
                </div>
            </div>

            {/* Order Status Filters */}
            <div className={`rounded-xl shadow-lg p-4 border transition-colors duration-300
                ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setActiveFilters({ ...activeFilters, orders: 'all' })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-300
                            ${activeFilters.orders === 'all'
                                ? isDarkMode ? 'bg-cyan-900/50 text-cyan-300' : 'bg-cyan-100 text-cyan-700'
                                : isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                            }`}
                    >
                        All ({orders.length})
                    </button>
                    <button
                        onClick={() => setActiveFilters({ ...activeFilters, orders: 'Pending' })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-300
                            ${activeFilters.orders === 'Pending'
                                ? isDarkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                                : isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                            }`}
                    >
                        Pending ({orders.filter(o => o.status === 'Pending').length})
                    </button>
                    <button
                        onClick={() => setActiveFilters({ ...activeFilters, orders: 'Processing' })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-300
                            ${activeFilters.orders === 'Processing'
                                ? isDarkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                                : isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                            }`}
                    >
                        Processing ({orders.filter(o => o.status === 'Processing').length})
                    </button>
                    <button
                        onClick={() => setActiveFilters({ ...activeFilters, orders: 'Shipped' })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-300
                            ${activeFilters.orders === 'Shipped'
                                ? isDarkMode ? 'bg-cyan-900/50 text-cyan-300' : 'bg-cyan-100 text-cyan-700'
                                : isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                            }`}
                    >
                        Shipped ({orders.filter(o => o.status === 'Shipped').length})
                    </button>
                    <button
                        onClick={() => setActiveFilters({ ...activeFilters, orders: 'Delivered' })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-300
                            ${activeFilters.orders === 'Delivered'
                                ? isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
                                : isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                            }`}
                    >
                        Delivered ({orders.filter(o => o.status === 'Delivered').length})
                    </button>
                    <button
                        onClick={() => setActiveFilters({ ...activeFilters, orders: 'Cancelled' })}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-300
                            ${activeFilters.orders === 'Cancelled'
                                ? isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'
                                : isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                            }`}
                    >
                        Cancelled ({orders.filter(o => o.status === 'Cancelled').length})
                    </button>
                </div>
            </div>

            {/* Orders Table */}
            {isInitializing ? (
                <div className="flex justify-center items-center h-64">
                    <FaSpinner className={`animate-spin text-4xl ${isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}`} />
                </div>
            ) : (
                <div className={`rounded-xl shadow-lg overflow-hidden border transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className={`bg-gradient-to-r 
                                    ${isDarkMode ? 'from-cyan-900/30 to-cyan-800/30' : 'from-cyan-100 to-cyan-50'}`}>
                                    <th className={`py-4 px-6 text-left text-sm font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Order Details</th>
                                    <th className={`py-4 px-6 text-left text-sm font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Customer</th>
                                    <th className={`py-4 px-6 text-left text-sm font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Shipping</th>
                                    <th className={`py-4 px-6 text-left text-sm font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Amount</th>
                                    <th className={`py-4 px-6 text-left text-sm font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                                    <th className={`py-4 px-6 text-left text-sm font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getFilteredOrders().map((order) => (
                                    <tr key={order.id} className={`border-b transition-colors duration-300
                                        ${isDarkMode ? 'border-gray-800 hover:bg-gray-800/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className={`font-medium transition-colors duration-300
                                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>#{order.order_number}</p>
                                                <p className={`text-sm transition-colors duration-300
                                                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{formatDate(order.created_at)}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className={`font-medium transition-colors duration-300
                                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{order.customer_name}</p>
                                                <p className={`text-sm transition-colors duration-300
                                                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{order.customer_email}</p>
                                                <p className={`text-xs transition-colors duration-300
                                                    ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{order.customer_phone || 'No phone'}</p>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div>
                                                <p className={`text-sm transition-colors duration-300
                                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{order.shipping_governorate || '-'}</p>
                                                {order.shipping_cost && (
                                                    <p className={`text-xs transition-colors duration-300
                                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>EGP {parseFloat(order.shipping_cost).toFixed(2)}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className={`font-semibold transition-colors duration-300
                                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>EGP {parseFloat(order.total_amount).toFixed(2)}</p>
                                            {order.discount_amount > 0 && (
                                                <p className={`text-xs transition-colors duration-300
                                                    ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>Discount: EGP {parseFloat(order.discount_amount).toFixed(2)}</p>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col gap-2">
                                                <select
                                                    value={(order.status || 'pending').toLowerCase()}
                                                    onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                                    className={`text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 shadow-sm transition-colors duration-300
        ${isDarkMode
                                                            ? 'border-gray-700 bg-gray-800 text-white focus:ring-cyan-500'
                                                            : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-cyan-700'}`}
                                                >
                                                    <option value="pending">⏳ Pending</option>
                                                    <option value="processing">🔧 Processing</option>
                                                    <option value="shipped">🚚 Shipped</option>
                                                    <option value="delivered">✅ Delivered</option>
                                                    <option value="cancelled">❌ Cancelled</option>
                                                </select>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium text-center 
    ${order.status === 'delivered'
                                                        ? isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
                                                        : order.status === 'processing' || order.status === 'shipped'
                                                            ? isDarkMode ? 'bg-cyan-900/50 text-cyan-300' : 'bg-cyan-100 text-cyan-700'
                                                            : order.status === 'cancelled'
                                                                ? isDarkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700'
                                                                : isDarkMode ? 'bg-yellow-900/50 text-yellow-300' : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : 'Pending'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => navigate(`/order/${order.id}`)}
                                                    className={`p-2 rounded-lg transition-colors
                                                        ${isDarkMode ? 'text-cyan-400 hover:bg-cyan-900/30' : 'text-cyan-700 hover:bg-cyan-100'}`}
                                                    title="View Details"
                                                >
                                                    <FaEye />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(order.customer_email)}&su=${encodeURIComponent(`Regarding Your Order #${order.order_number}`)}`;
                                                        window.open(gmailUrl, '_blank');
                                                    }}
                                                    className={`p-2 rounded-lg transition-colors
                                                        ${isDarkMode ? 'text-green-400 hover:bg-green-900/30' : 'text-green-700 hover:bg-green-100'}`}
                                                    title="Email Customer"
                                                >
                                                    <FaEnvelope />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </motion.div>
    );

    const renderUsers = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className={`text-2xl font-bold transition-colors duration-300
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>User Management</h1>
                    <p className={`transition-colors duration-300
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage registered users and their information</p>
                </div>
                <div className="relative flex-1 sm:w-64">
                    <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300
                        ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 transition-all duration-300
                            ${isDarkMode
                                ? 'border-gray-700 bg-gray-800 text-white focus:ring-pink-500 focus:border-pink-500'
                                : 'border-gray-200 bg-gray-50 text-gray-900 focus:ring-pink-700 focus:border-pink-700'}`}
                    />
                </div>
            </div>

            {/* User Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-pink-400' : 'text-pink-700'}`}>Total Users</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{users.length}</p>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>Active Buyers</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.totalUsersOrdered}</p>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>This Month</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {users.filter(u => new Date(u.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                    </p>
                </div>
                <div className={`p-4 rounded-xl transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>With Phone</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {users.filter(u => u.phone).length}
                    </p>
                </div>
            </div>

            {isInitializing ? (
                <div className="flex justify-center items-center h-64">
                    <FaSpinner className={`animate-spin text-4xl ${isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}`} />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map((user) => (
                        <div key={user.id} className={`rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border transition-colors duration-300
                            ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 relative">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md
                                        ${isDarkMode ? 'bg-gradient-to-r from-cyan-500 to-cyan-600' : 'bg-gradient-to-r from-cyan-700 to-cyan-800'}`}>
                                        {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-bold text-base truncate transition-colors duration-300
                                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {user.full_name || 'No Name'}
                                    </h4>
                                    <p className={`text-sm truncate mt-1 transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {user.email}
                                    </p>
                                    {user.phone && (
                                        <p className={`text-xs truncate mt-1 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {user.phone}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className={`mt-6 pt-4 border-t transition-colors duration-300
                                ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className={`text-xs mb-1 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Joined</p>
                                        <p className={`font-medium truncate transition-colors duration-300
                                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {formatDate(user.created_at)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className={`text-xs mb-1 transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Phone</p>
                                        <p className={`font-medium truncate transition-colors duration-300
                                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {user.phone || 'Not set'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <p className={`text-xs mb-1 transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>User ID</p>
                                    <div className={`p-2 rounded-lg transition-colors duration-300
                                        ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                                        <p className={`font-mono text-xs truncate transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {user.id}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );

    // Sidebar navigation items
    const sidebarItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <FaChartLine /> },
        { id: 'products', label: 'Products', icon: <FaBox /> },
        { id: 'categories', label: 'Categories', icon: <FaTags /> },
        { id: 'shipping', label: 'Shipping', icon: <FaTruck /> },
        { id: 'offers', label: 'Special Offers', icon: <FaGift /> },
        { id: 'promocodes', label: 'Promo Codes', icon: <FaTicketAlt /> },
        { id: 'orders', label: 'Orders', icon: <FaShoppingCart /> },
        { id: 'users', label: 'Users', icon: <FaUsers /> },
    ];

    // Main content render
    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return renderDashboard();
            case 'products': return renderProducts();
            case 'categories': return renderCategories();
            case 'shipping': return renderShipping();
            case 'offers': return renderSpecialOffers();
            case 'promocodes': return renderPromoCodes();
            case 'orders': return renderOrders();
            case 'users': return renderUsers();
            default: return renderDashboard();
        }
    };

    if (isInitializing && activeTab === 'dashboard') {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors duration-300
                ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                <div className="text-center">
                    <div className="relative">
                        <FaSpinner className={`animate-spin text-4xl mx-auto mb-4
                            ${isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}`} />
                        <div className={`absolute inset-0 bg-gradient-to-r blur-lg opacity-20
                            ${isDarkMode ? 'from-cyan-500 to-cyan-600' : 'from-cyan-700 to-cyan-800'}`}></div>
                    </div>
                    <p className={`font-medium transition-colors duration-300
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading Admin Panel...</p>
                    <p className={`text-sm mt-2 transition-colors duration-300
                        ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Please wait while we load your data</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-300
            ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
            {/* Main Layout */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex gap-6">
                    {/* Sidebar - Desktop */}
                    <motion.aside
                        ref={sidebarRef}
                        initial={false}
                        animate={{ width: sidebarCollapsed ? '80px' : '256px' }}
                        className={`hidden lg:block rounded-2xl shadow-lg overflow-hidden sticky top-24 h-fit border transition-colors duration-300
                            ${sidebarCollapsed ? 'w-20' : 'w-64'} 
                            ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
                    >
                        <div className="p-4">
                            {/* Collapse button - Desktop only */}
                            <button
                                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                className={`w-full p-2 mb-4 rounded-lg flex items-center justify-center transition-colors duration-300
                                    ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                            >
                                {sidebarCollapsed ?
                                    <FaChevronRight className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} /> :
                                    <FaChevronLeft className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />}
                            </button>

                            {/* Navigation */}
                            <nav className="space-y-1">
                                {sidebarItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setActiveTab(item.id);
                                        }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 
                                            ${activeTab === item.id
                                                ? isDarkMode
                                                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-md'
                                                    : 'bg-gradient-to-r from-cyan-700 to-cyan-800 text-white shadow-md'
                                                : isDarkMode
                                                    ? 'text-gray-400 hover:bg-gray-800'
                                                    : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <span className="text-lg">{item.icon}</span>
                                        {!sidebarCollapsed && (
                                            <span className="font-medium whitespace-nowrap">{item.label}</span>
                                        )}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </motion.aside>

                    {/* Sidebar - Mobile */}
                    <AnimatePresence>
                        {!sidebarCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -300 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -300 }}
                                className="fixed inset-0 z-50 lg:hidden"
                            >
                                <div className="absolute inset-0 bg-black/70" onClick={() => setSidebarCollapsed(true)} />
                                <div className={`absolute left-0 top-0 h-full w-64 shadow-2xl border-r transition-colors duration-300
                                    ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className={`font-bold transition-colors duration-300
                                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Navigation</h2>
                                            <button
                                                onClick={() => setSidebarCollapsed(true)}
                                                className={`p-2 rounded-lg transition-colors
                                                    ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                                            >
                                                <FaTimes />
                                            </button>
                                        </div>
                                        <nav className="space-y-2">
                                            {sidebarItems.map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => {
                                                        setActiveTab(item.id);
                                                        setSidebarCollapsed(true);
                                                    }}
                                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors duration-300
                                                        ${activeTab === item.id
                                                            ? isDarkMode
                                                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white'
                                                                : 'bg-gradient-to-r from-cyan-700 to-cyan-800 text-white'
                                                            : isDarkMode
                                                                ? 'text-gray-400 hover:bg-gray-800'
                                                                : 'text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {item.icon}
                                                    <span>{item.label}</span>
                                                </button>
                                            ))}
                                        </nav>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Mobile Toggle Button */}
                    <button
                        onClick={() => setSidebarCollapsed(false)}
                        className={`fixed left-4 top-20 lg:hidden z-30 w-10 h-10 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110
                            ${isDarkMode ? 'bg-gradient-to-r from-cyan-500 to-cyan-600' : 'bg-gradient-to-r from-cyan-700 to-cyan-800'}`}
                    >
                        <FaBars />
                    </button>

                    {/* Main Content */}
                    <main className={`flex-1 ${sidebarCollapsed ? 'lg:ml-0' : 'lg:ml-6'} overflow-x-hidden`}>
                        <div className="w-full max-w-full">
                            {renderContent()}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}