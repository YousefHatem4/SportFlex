// tabs/ProductsTab.jsx - Products management tab
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaFilter, FaSpinner, FaBox, FaExclamationCircle, FaImage } from 'react-icons/fa';
import { supabase } from '../../../supabaseClient';
import ProductModal from '../modals/ProductModal';

export default function ProductsTab({
    isDarkMode,
    searchQuery,
    setSearchQuery,
    activeFilters,
    setActiveFilters,
    isLoading,
    isInitializing,
    products,
    categories,
    formatDate,
    refreshData,
    navigate,
    uploading,
    uploadProgress,
    handleMainImageUpload,
    handleAdditionalImageUpload,
    removeMainImage,
    removeAdditionalImage
}) {
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState({
        title: '',
        description: '',
        price: '',
        category_id: '',
        stock: '',
        image_url: '',
        additionalImages: []
    });

    const getCategoryName = (categoryId) => {
        if (!categoryId) return 'Uncategorized';
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : 'Uncategorized';
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        // Implementation from original code
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
                    .select(`*, categories(id, name)`)
                    .single();
                if (error) throw error;
                savedProduct = data;
                await handleProductImages(editingProduct.id);
            } else {
                productData.created_by = session.user.id;
                const { data, error } = await supabase
                    .from('products')
                    .insert([productData])
                    .select(`*, categories(id, name)`)
                    .single();
                if (error) throw error;
                savedProduct = data;
                await handleProductImages(savedProduct.id);
            }

            const updatedProduct = await fetchProductWithImages(savedProduct.id);
            await refreshData();
            toast.success(editingProduct ? 'Product updated successfully' : 'Product added successfully');
            resetProductForm();
            setShowProductModal(false);
        } catch (error) {
            console.error('Error saving product:', error);
            toast.error('Failed to save product. ' + error.message);
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
                .select(`*, categories(id, name)`)
                .eq('id', productId)
                .single();
            if (productError) throw productError;
            const { data: images, error: imagesError } = await supabase
                .from('product_images')
                .select('*')
                .eq('product_id', productId)
                .order('display_order', { ascending: true });
            if (imagesError) throw imagesError;
            return { ...product, images: images || [] };
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

            await refreshData();
            toast.success('Product deleted successfully');
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Failed to delete product');
        }
    };

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

    const filteredProducts = products.filter(product =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

    return (
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

            {/* Stats Bar */}
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

            <ProductModal
                isOpen={showProductModal}
                onClose={() => {
                    setShowProductModal(false);
                    resetProductForm();
                }}
                isDarkMode={isDarkMode}
                editingProduct={editingProduct}
                productForm={productForm}
                setProductForm={setProductForm}
                categories={categories}
                isLoading={isLoading}
                uploading={uploading}
                uploadProgress={uploadProgress}
                handleMainImageUpload={(e) => handleMainImageUpload(e, setProductForm, productForm)}
                handleAdditionalImageUpload={(e) => handleAdditionalImageUpload(e, setProductForm, productForm)}
                removeMainImage={() => removeMainImage(setProductForm, productForm)}
                removeAdditionalImage={(index) => removeAdditionalImage(index, setProductForm, productForm)}
                onSubmit={handleProductSubmit}
            />
        </motion.div>
    );
}