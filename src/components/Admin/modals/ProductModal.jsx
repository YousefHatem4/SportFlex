// modals/ProductModal.jsx - Product add/edit modal
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaSpinner, FaCheck, FaUpload, FaExclamationCircle } from 'react-icons/fa';

export default function ProductModal({
    isOpen,
    onClose,
    isDarkMode,
    editingProduct,
    productForm,
    setProductForm,
    categories,
    isLoading,
    uploading,
    uploadProgress,
    handleMainImageUpload,
    handleAdditionalImageUpload,
    removeMainImage,
    removeAdditionalImage,
    onSubmit
}) {
    const fileInputRef = useRef(null);
    const additionalFileInputRef = useRef(null);

    if (!isOpen) return null;

    return (
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
                            onClick={onClose}
                            className={`p-2 rounded-full transition-colors
                                ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                        >
                            <FaTimes className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                        </button>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-4">
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

                        {/* Main Image Upload */}
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

                        {/* Additional Images Upload */}
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
                                onClick={onClose}
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
    );
}