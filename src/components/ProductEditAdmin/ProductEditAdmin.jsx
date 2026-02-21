import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { supabase } from '../../supabaseClient';
import {
    FaArrowLeft,
    FaSave,
    FaTimes,
    FaBox,
    FaTag,
    FaImage,
    FaMoneyBill,
    FaBoxOpen,
    FaListAlt,
    FaPlus,
    FaTrash,
    FaSpinner,
    FaEye,
    FaCamera
} from 'react-icons/fa';

export default function ProductEditAdmin() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Theme state (copied from navbar)
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme ? savedTheme === 'dark' : false;
    });

    // Product form state
    const [productForm, setProductForm] = useState({
        title: '',
        description: '',
        price: '',
        category_id: '',
        stock: '',
        image_url: '',
        additionalImages: []
    });

    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingProduct, setIsLoadingProduct] = useState(true);
    const [product, setProduct] = useState(null);
    const [mainImagePreview, setMainImagePreview] = useState('');
    const [additionalPreviews, setAdditionalPreviews] = useState([]);

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
        }
    };

    // Fetch product details
    const fetchProductDetails = async () => {
        try {
            setIsLoadingProduct(true);

            // Get product with categories
            const { data: productData, error: productError } = await supabase
                .from('products')
                .select(`
                    *,
                    categories (
                        id,
                        name
                    )
                `)
                .eq('id', id)
                .single();

            if (productError) throw productError;

            if (!productData) {
                toast.error('Product not found');
                navigate('/admin');
                return;
            }

            setProduct(productData);

            // Get product images
            const { data: imagesData, error: imagesError } = await supabase
                .from('product_images')
                .select('*')
                .eq('product_id', id)
                .order('display_order', { ascending: true });

            if (imagesError) throw imagesError;

            // Find main image (display_order = 0) and additional images
            const mainImage = imagesData?.find(img => img.display_order === 0);
            const additionalImages = imagesData?.filter(img => img.display_order > 0).map(img => img.image_url) || [];

            setProductForm({
                title: productData.title,
                description: productData.description || '',
                price: productData.price,
                category_id: productData.category_id || '',
                stock: productData.stock,
                image_url: mainImage?.image_url || productData.image_url || '',
                additionalImages: additionalImages
            });

            setMainImagePreview(mainImage?.image_url || productData.image_url || '');
            setAdditionalPreviews(additionalImages);

        } catch (error) {
            console.error('Error loading product for edit:', error);
            toast.error('Failed to load product data');
        } finally {
            setIsLoadingProduct(false);
        }
    };

    // Helper function to get category name
    const getCategoryName = (categoryId) => {
        if (!categoryId) return 'Uncategorized';
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : 'Uncategorized';
    };

    // Handle product submission - UPDATED TO NAVIGATE TO ADMIN
    const handleProductSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();

            // Get category name for the category column
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

            // Update product in database
            const { data, error } = await supabase
                .from('products')
                .update(productData)
                .eq('id', id)
                .select(`
                    *,
                    categories (
                        id,
                        name
                    )
                `)
                .single();

            if (error) throw error;

            // Handle product images
            await handleProductImages(id);

            toast.success('Product updated successfully!');

            // Navigate back to admin dashboard (changed from product details)
            navigate('/admin');

        } catch (error) {
            console.error('Error updating product:', error);
            toast.error('Failed to update product. ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle product images update
    const handleProductImages = async (productId) => {
        try {
            // First, delete existing additional images (keep main image if it exists)
            const { error: deleteError } = await supabase
                .from('product_images')
                .delete()
                .eq('product_id', productId);

            if (deleteError) throw deleteError;

            // Ensure main image is in product_images table
            if (productForm.image_url) {
                const { error: insertMainError } = await supabase
                    .from('product_images')
                    .insert({
                        product_id: productId,
                        image_url: productForm.image_url,
                        display_order: 0,
                        alt_text: productForm.title
                    });

                if (insertMainError) throw insertMainError;
            }

            // Add new additional images
            if (productForm.additionalImages.length > 0) {
                const imagesToInsert = productForm.additionalImages.map((imageUrl, index) => ({
                    product_id: productId,
                    image_url: imageUrl,
                    display_order: index + 1, // Start from 1 (0 is for main image)
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

    // Image handling functions
    const addAdditionalImage = () => {
        const newImage = prompt('Enter image URL:');
        if (newImage && newImage.trim() !== '') {
            const newImageUrl = newImage.trim();
            setProductForm({
                ...productForm,
                additionalImages: [...productForm.additionalImages, newImageUrl]
            });
            setAdditionalPreviews([...additionalPreviews, newImageUrl]);
        }
    };

    const removeAdditionalImage = (index) => {
        const newImages = [...productForm.additionalImages];
        const newPreviews = [...additionalPreviews];
        newImages.splice(index, 1);
        newPreviews.splice(index, 1);
        setProductForm({
            ...productForm,
            additionalImages: newImages
        });
        setAdditionalPreviews(newPreviews);
    };

    // Handle main image URL change
    const handleMainImageChange = (e) => {
        const value = e.target.value;
        setProductForm({
            ...productForm,
            image_url: value
        });
        setMainImagePreview(value);
    };

    // Handle additional image URL change
    const handleAdditionalImageChange = (index, value) => {
        const newImages = [...productForm.additionalImages];
        const newPreviews = [...additionalPreviews];
        newImages[index] = value;
        newPreviews[index] = value;
        setProductForm({
            ...productForm,
            additionalImages: newImages
        });
        setAdditionalPreviews(newPreviews);
    };

    // View product details
    const handleViewProduct = () => {
        navigate(`/productdetailsadmin/${id}`);
    };

    // Cancel edit - UPDATED TO NAVIGATE TO ADMIN
    const handleCancel = () => {
        if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            navigate('/admin');
        }
    };

    // Delete product - UPDATED TO NAVIGATE TO ADMIN AFTER DELETE
    const handleDeleteProduct = async () => {
        if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

        try {
            setIsLoading(true);

            // Delete associated images first
            const { error: imagesError } = await supabase
                .from('product_images')
                .delete()
                .eq('product_id', id);

            if (imagesError) throw imagesError;

            // Delete product
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Product deleted successfully');
            navigate('/admin');
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Failed to delete product');
        } finally {
            setIsLoading(false);
        }
    };

    // Go back to admin dashboard
    const handleBackToAdmin = () => {
        navigate('/admin');
    };

    // Initialize
    useEffect(() => {
        fetchCategories();
        if (id) {
            fetchProductDetails();
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [id]);

    if (isLoadingProduct) {
        return (
            <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-gray-50'} flex items-center justify-center`}>
                <div className="text-center">
                    <FaSpinner className={`animate-spin text-4xl ${isDarkMode ? 'text-cyan-500' : 'text-cyan-600'} mx-auto mb-4`} />
                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Loading product data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen py-8 transition-colors duration-300 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <button
                                onClick={handleBackToAdmin}
                                className={`flex items-center gap-2 transition-colors mb-3 ${isDarkMode
                                        ? 'text-cyan-400 hover:text-cyan-300'
                                        : 'text-cyan-700 hover:text-cyan-800'
                                    }`}
                            >
                                <FaArrowLeft /> Back to Admin Panel
                            </button>
                            <h1 className={`text-2xl md:text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${isDarkMode
                                    ? 'from-cyan-400 to-cyan-300'
                                    : 'from-cyan-700 to-cyan-600'
                                }`}>Edit Product</h1>
                            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Update product details and images</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleViewProduct}
                                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${isDarkMode
                                        ? 'border-cyan-500 text-cyan-400 hover:bg-cyan-900/30'
                                        : 'border-cyan-600 text-cyan-700 hover:bg-cyan-100'
                                    }`}
                            >
                                <FaEye /> View Product
                            </button>
                            <button
                                onClick={handleDeleteProduct}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 disabled:opacity-50 transition-all duration-300"
                            >
                                <FaTrash /> Delete Product
                            </button>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        <span
                            onClick={handleBackToAdmin}
                            className={`transition-colors cursor-pointer ${isDarkMode ? 'hover:text-cyan-400' : 'hover:text-cyan-700'
                                }`}
                        >
                            Admin Panel
                        </span>
                        <span className={isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}>›</span>
                        <span
                            onClick={() => navigate('/admin')}
                            className={`transition-colors cursor-pointer ${isDarkMode ? 'hover:text-cyan-400' : 'hover:text-cyan-700'
                                }`}
                        >
                            Products
                        </span>
                        <span className={isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}>›</span>
                        <span
                            onClick={handleViewProduct}
                            className={`transition-colors cursor-pointer ${isDarkMode ? 'hover:text-cyan-400' : 'hover:text-cyan-700'
                                }`}
                        >
                            {product?.title || 'Product'}
                        </span>
                        <span className={isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}>›</span>
                        <span className={`font-medium ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'
                            }`}>Edit</span>
                    </div>
                </div>

                {/* Edit Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className={`rounded-2xl shadow-xl overflow-hidden border transition-colors duration-300 ${isDarkMode
                            ? 'bg-gray-900 border-gray-800'
                            : 'bg-white border-gray-200'
                        }`}
                >
                    <form onSubmit={handleProductSubmit} className="p-6 md:p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Column - Product Info */}
                            <div className="space-y-6">
                                <h2 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-800'
                                    }`}>
                                    <FaBox className={isDarkMode ? 'text-cyan-400' : 'text-cyan-700'} /> Product Information
                                </h2>

                                {/* Product Title */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'
                                        }`}>
                                        Product Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={productForm.title}
                                        onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                                        className={`w-full px-4 py-3 rounded-lg focus:ring-2 transition-colors placeholder-gray-500 ${isDarkMode
                                                ? 'bg-gray-800 border border-gray-700 text-white focus:ring-cyan-500 focus:border-cyan-500'
                                                : 'bg-white border border-gray-300 text-gray-900 focus:ring-cyan-600 focus:border-cyan-600'
                                            }`}
                                        placeholder="Enter product title"
                                    />
                                </div>

                                {/* Price and Stock */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'
                                            }`}>
                                            <FaMoneyBill className="inline mr-2" /> Price (EGP) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            value={productForm.price}
                                            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                            className={`w-full px-4 py-3 rounded-lg focus:ring-2 transition-colors placeholder-gray-500 ${isDarkMode
                                                    ? 'bg-gray-800 border border-gray-700 text-white focus:ring-cyan-500 focus:border-cyan-500'
                                                    : 'bg-white border border-gray-300 text-gray-900 focus:ring-cyan-600 focus:border-cyan-600'
                                                }`}
                                            placeholder="Enter price"
                                        />
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'
                                            }`}>
                                            <FaBoxOpen className="inline mr-2" /> Stock Quantity *
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            required
                                            value={productForm.stock}
                                            onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                                            className={`w-full px-4 py-3 rounded-lg focus:ring-2 transition-colors placeholder-gray-500 ${isDarkMode
                                                    ? 'bg-gray-800 border border-gray-700 text-white focus:ring-cyan-500 focus:border-cyan-500'
                                                    : 'bg-white border border-gray-300 text-gray-900 focus:ring-cyan-600 focus:border-cyan-600'
                                                }`}
                                            placeholder="Enter stock quantity"
                                        />
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'
                                        }`}>
                                        <FaTag className="inline mr-2" /> Category
                                    </label>
                                    <select
                                        value={productForm.category_id}
                                        onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                                        className={`w-full px-4 py-3 rounded-lg focus:ring-2 transition-colors ${isDarkMode
                                                ? 'bg-gray-800 border border-gray-700 text-white focus:ring-cyan-500 focus:border-cyan-500'
                                                : 'bg-white border border-gray-300 text-gray-900 focus:ring-cyan-600 focus:border-cyan-600'
                                            }`}
                                    >
                                        <option value="" className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>Select Category</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id} className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'
                                        }`}>
                                        <FaListAlt className="inline mr-2" /> Description
                                    </label>
                                    <textarea
                                        value={productForm.description}
                                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                        rows="5"
                                        className={`w-full px-4 py-3 rounded-lg focus:ring-2 transition-colors placeholder-gray-500 ${isDarkMode
                                                ? 'bg-gray-800 border border-gray-700 text-white focus:ring-cyan-500 focus:border-cyan-500'
                                                : 'bg-white border border-gray-300 text-gray-900 focus:ring-cyan-600 focus:border-cyan-600'
                                            }`}
                                        placeholder="Enter product description"
                                    />
                                </div>
                            </div>

                            {/* Right Column - Images */}
                            <div className="space-y-6">
                                <h2 className={`text-xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-800'
                                    }`}>
                                    <FaCamera className={isDarkMode ? 'text-cyan-400' : 'text-cyan-700'} /> Product Images
                                </h2>

                                {/* Main Image */}
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'
                                        }`}>
                                        Main Image URL *
                                    </label>
                                    <input
                                        type="url"
                                        required
                                        value={productForm.image_url}
                                        onChange={handleMainImageChange}
                                        className={`w-full px-4 py-3 rounded-lg focus:ring-2 transition-colors placeholder-gray-500 mb-3 ${isDarkMode
                                                ? 'bg-gray-800 border border-gray-700 text-white focus:ring-cyan-500 focus:border-cyan-500'
                                                : 'bg-white border border-gray-300 text-gray-900 focus:ring-cyan-600 focus:border-cyan-600'
                                            }`}
                                        placeholder="https://example.com/main-image.jpg"
                                    />

                                    {/* Main Image Preview */}
                                    {mainImagePreview && (
                                        <div className="mt-3">
                                            <p className={`text-sm mb-2 ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'
                                                }`}>Main Image Preview:</p>
                                            <div className={`relative h-48 rounded-lg overflow-hidden border ${isDarkMode ? 'border-cyan-500' : 'border-cyan-600'
                                                }`}>
                                                <img
                                                    src={mainImagePreview}
                                                    alt="Main product preview"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop';
                                                        e.target.className = `w-full h-full object-cover ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`;
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Additional Images */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className={`block text-sm font-medium ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'
                                            }`}>
                                            Additional Images
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addAdditionalImage}
                                            className={`text-sm flex items-center gap-1 transition-colors ${isDarkMode
                                                    ? 'text-cyan-400 hover:text-cyan-300'
                                                    : 'text-cyan-700 hover:text-cyan-800'
                                                }`}
                                        >
                                            <FaPlus /> Add Image URL
                                        </button>
                                    </div>

                                    {/* Additional Images List */}
                                    <div className="space-y-3">
                                        {productForm.additionalImages.map((image, index) => (
                                            <div key={index} className="space-y-2">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="url"
                                                        value={image}
                                                        onChange={(e) => handleAdditionalImageChange(index, e.target.value)}
                                                        className={`flex-1 px-4 py-2 rounded-lg focus:ring-2 transition-colors placeholder-gray-500 ${isDarkMode
                                                                ? 'bg-gray-800 border border-gray-700 text-white focus:ring-cyan-500 focus:border-cyan-500'
                                                                : 'bg-white border border-gray-300 text-gray-900 focus:ring-cyan-600 focus:border-cyan-600'
                                                            }`}
                                                        placeholder="https://example.com/additional-image.jpg"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAdditionalImage(index)}
                                                        className={`p-2 rounded-lg transition-colors border ${isDarkMode
                                                                ? 'text-red-400 hover:bg-red-900/30 border-red-500'
                                                                : 'text-red-600 hover:bg-red-100 border-red-400'
                                                            }`}
                                                        title="Remove image"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>

                                                {/* Additional Image Preview */}
                                                {additionalPreviews[index] && (
                                                    <div className="ml-1">
                                                        <div className={`relative h-32 rounded-lg overflow-hidden border ${isDarkMode ? 'border-cyan-500' : 'border-cyan-600'
                                                            }`}>
                                                            <img
                                                                src={additionalPreviews[index]}
                                                                alt={`Additional preview ${index + 1}`}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop';
                                                                    e.target.className = `w-full h-full object-cover ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`;
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Image Tips */}
                                <div className={`rounded-lg p-4 border ${isDarkMode
                                        ? 'bg-gradient-to-r from-cyan-900/30 to-cyan-800/30 border-cyan-500'
                                        : 'bg-gradient-to-r from-cyan-100 to-cyan-50 border-cyan-300'
                                    }`}>
                                    <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'
                                        }`}>Image Guidelines</h3>
                                    <ul className={`text-xs space-y-1 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'
                                        }`}>
                                        <li>• Use high-quality images (minimum 800x600 pixels)</li>
                                        <li>• Supported formats: JPG, PNG, WebP</li>
                                        <li>• Main image should be the primary product view</li>
                                        <li>• Additional images can show different angles or features</li>
                                        <li>• Ensure images have white or transparent backgrounds</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className={`mt-8 pt-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
                            }`}>
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    <p>Product ID: <span className={`font-mono ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'
                                        }`}>{id}</span></p>
                                    <p>Editing: <span className={`font-medium ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'
                                        }`}>{product?.title}</span></p>
                                </div>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className={`px-6 py-3 border rounded-lg transition-colors w-full sm:w-auto ${isDarkMode
                                                ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                                                : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`px-6 py-3 text-white rounded-lg disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto ${isDarkMode
                                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
                                                : 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800'
                                            }`}
                                    >
                                        {isLoading ? (
                                            <>
                                                <FaSpinner className="animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <FaSave />
                                                Save Changes & Return
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </motion.div>

                {/* Quick Stats */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`rounded-xl shadow p-4 border transition-colors duration-300 ${isDarkMode
                            ? 'bg-gray-900 border-gray-800'
                            : 'bg-white border-gray-200'
                        }`}>
                        <p className={`text-sm ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'
                            }`}>Current Price</p>
                        <p className={`text-xl font-bold ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'
                            }`}>EGP {parseFloat(productForm.price || 0).toFixed(2)}</p>
                    </div>
                    <div className={`rounded-xl shadow p-4 border transition-colors duration-300 ${isDarkMode
                            ? 'bg-gray-900 border-gray-800'
                            : 'bg-white border-gray-200'
                        }`}>
                        <p className={`text-sm ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'
                            }`}>Current Stock</p>
                        <p className={`text-xl font-bold ${parseInt(productForm.stock || 0) > 10
                                ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                                : parseInt(productForm.stock || 0) > 0
                                    ? (isDarkMode ? 'text-amber-400' : 'text-amber-600')
                                    : (isDarkMode ? 'text-red-400' : 'text-red-600')
                            }`}>
                            {productForm.stock || 0} units
                        </p>
                    </div>
                    <div className={`rounded-xl shadow p-4 border transition-colors duration-300 ${isDarkMode
                            ? 'bg-gray-900 border-gray-800'
                            : 'bg-white border-gray-200'
                        }`}>
                        <p className={`text-sm ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'
                            }`}>Images Count</p>
                        <p className={`text-xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-700'
                            }`}>
                            {1 + (productForm.additionalImages?.length || 0)} images
                        </p>
                    </div>
                </div>

                {/* Quick Navigation */}
                <div className="mt-6 flex flex-wrap gap-4 justify-center">
                    <button
                        onClick={handleBackToAdmin}
                        className={`inline-flex items-center gap-2 transition-colors ${isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'
                            }`}
                    >
                        <FaArrowLeft />
                        Back to Admin Dashboard
                    </button>
                    <span className={isDarkMode ? 'text-gray-600' : 'text-gray-300'}>|</span>
                    <button
                        onClick={handleViewProduct}
                        className={`inline-flex items-center gap-2 transition-colors ${isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'
                            }`}
                    >
                        <FaEye />
                        View Product Details
                    </button>
                </div>
            </div>
        </div>
    );
}