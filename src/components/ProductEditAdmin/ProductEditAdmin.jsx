// ProductEditAdmin.jsx - UPDATED VERSION WITH EXACT WISHLIST THEME
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
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-cyan-500 mx-auto mb-4" />
                    <p className="text-white font-medium">Loading product data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <button
                                onClick={handleBackToAdmin}
                                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-3"
                            >
                                <FaArrowLeft /> Back to Admin Panel
                            </button>
                            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-cyan-300 bg-clip-text text-transparent">Edit Product</h1>
                            <p className="text-gray-400 mt-1">Update product details and images</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleViewProduct}
                                className="flex items-center gap-2 px-4 py-2 border border-cyan-500 text-cyan-400 rounded-lg hover:bg-cyan-900/30 transition-colors"
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
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span
                            onClick={handleBackToAdmin}
                            className="hover:text-cyan-400 transition-colors cursor-pointer"
                        >
                            Admin Panel
                        </span>
                        <span className="text-cyan-500">›</span>
                        <span
                            onClick={() => navigate('/admin')}
                            className="hover:text-cyan-400 transition-colors cursor-pointer"
                        >
                            Products
                        </span>
                        <span className="text-cyan-500">›</span>
                        <span
                            onClick={handleViewProduct}
                            className="hover:text-cyan-400 transition-colors cursor-pointer"
                        >
                            {product?.title || 'Product'}
                        </span>
                        <span className="text-cyan-500">›</span>
                        <span className="text-cyan-300 font-medium">Edit</span>
                    </div>
                </div>

                {/* Edit Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-800"
                >
                    <form onSubmit={handleProductSubmit} className="p-6 md:p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Column - Product Info */}
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <FaBox className="text-cyan-400" /> Product Information
                                </h2>

                                {/* Product Title */}
                                <div>
                                    <label className="block text-sm font-medium text-cyan-300 mb-2">
                                        Product Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={productForm.title}
                                        onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors placeholder-gray-500"
                                        placeholder="Enter product title"
                                    />
                                </div>

                                {/* Price and Stock */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-cyan-300 mb-2">
                                            <FaMoneyBill className="inline mr-2" /> Price (EGP) *
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            required
                                            value={productForm.price}
                                            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors placeholder-gray-500"
                                            placeholder="Enter price"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-cyan-300 mb-2">
                                            <FaBoxOpen className="inline mr-2" /> Stock Quantity *
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            required
                                            value={productForm.stock}
                                            onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors placeholder-gray-500"
                                            placeholder="Enter stock quantity"
                                        />
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-cyan-300 mb-2">
                                        <FaTag className="inline mr-2" /> Category
                                    </label>
                                    <select
                                        value={productForm.category_id}
                                        onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                                    >
                                        <option value="" className="text-gray-500">Select Category</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id} className="bg-gray-800">
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-cyan-300 mb-2">
                                        <FaListAlt className="inline mr-2" /> Description
                                    </label>
                                    <textarea
                                        value={productForm.description}
                                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                        rows="5"
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors placeholder-gray-500"
                                        placeholder="Enter product description"
                                    />
                                </div>
                            </div>

                            {/* Right Column - Images */}
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <FaCamera className="text-cyan-400" /> Product Images
                                </h2>

                                {/* Main Image */}
                                <div>
                                    <label className="block text-sm font-medium text-cyan-300 mb-2">
                                        Main Image URL *
                                    </label>
                                    <input
                                        type="url"
                                        required
                                        value={productForm.image_url}
                                        onChange={handleMainImageChange}
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors placeholder-gray-500 mb-3"
                                        placeholder="https://example.com/main-image.jpg"
                                    />

                                    {/* Main Image Preview */}
                                    {mainImagePreview && (
                                        <div className="mt-3">
                                            <p className="text-sm text-cyan-300 mb-2">Main Image Preview:</p>
                                            <div className="relative h-48 rounded-lg overflow-hidden border border-cyan-500">
                                                <img
                                                    src={mainImagePreview}
                                                    alt="Main product preview"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop';
                                                        e.target.className = 'w-full h-full object-cover bg-gray-800';
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Additional Images */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-cyan-300">
                                            Additional Images
                                        </label>
                                        <button
                                            type="button"
                                            onClick={addAdditionalImage}
                                            className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
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
                                                        className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors placeholder-gray-500"
                                                        placeholder="https://example.com/additional-image.jpg"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAdditionalImage(index)}
                                                        className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors border border-red-500"
                                                        title="Remove image"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>

                                                {/* Additional Image Preview */}
                                                {additionalPreviews[index] && (
                                                    <div className="ml-1">
                                                        <div className="relative h-32 rounded-lg overflow-hidden border border-cyan-500">
                                                            <img
                                                                src={additionalPreviews[index]}
                                                                alt={`Additional preview ${index + 1}`}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop';
                                                                    e.target.className = 'w-full h-full object-cover bg-gray-800';
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
                                <div className="bg-gradient-to-r from-cyan-900/30 to-cyan-800/30 border border-cyan-500 rounded-lg p-4">
                                    <h3 className="text-sm font-medium text-cyan-300 mb-2">Image Guidelines</h3>
                                    <ul className="text-xs text-cyan-400 space-y-1">
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
                        <div className="mt-8 pt-6 border-t border-gray-700">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="text-sm text-gray-400">
                                    <p>Product ID: <span className="font-mono text-cyan-400">{id}</span></p>
                                    <p>Editing: <span className="font-medium text-cyan-300">{product?.title}</span></p>
                                </div>
                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors w-full sm:w-auto"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto"
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
                    <div className="bg-gray-900 rounded-xl shadow p-4 border border-gray-800">
                        <p className="text-sm text-cyan-300">Current Price</p>
                        <p className="text-xl font-bold text-cyan-400">EGP {parseFloat(productForm.price || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-900 rounded-xl shadow p-4 border border-gray-800">
                        <p className="text-sm text-cyan-300">Current Stock</p>
                        <p className={`text-xl font-bold ${parseInt(productForm.stock || 0) > 10 ? 'text-green-400' :
                            parseInt(productForm.stock || 0) > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                            {productForm.stock || 0} units
                        </p>
                    </div>
                    <div className="bg-gray-900 rounded-xl shadow p-4 border border-gray-800">
                        <p className="text-sm text-cyan-300">Images Count</p>
                        <p className="text-xl font-bold text-purple-400">
                            {1 + (productForm.additionalImages?.length || 0)} images
                        </p>
                    </div>
                </div>

                {/* Quick Navigation */}
                <div className="mt-6 flex flex-wrap gap-4 justify-center">
                    <button
                        onClick={handleBackToAdmin}
                        className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        <FaArrowLeft />
                        Back to Admin Dashboard
                    </button>
                    <span className="text-gray-600">|</span>
                    <button
                        onClick={handleViewProduct}
                        className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        <FaEye />
                        View Product Details
                    </button>
                </div>
            </div>
        </div>
    );
}