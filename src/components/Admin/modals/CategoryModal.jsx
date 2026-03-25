// modals/CategoryModal.jsx - Category add/edit modal
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaSpinner, FaCheck, FaUpload } from 'react-icons/fa';

export default function CategoryModal({
    isOpen,
    onClose,
    isDarkMode,
    editingCategory,
    categoryForm,
    setCategoryForm,
    isLoading,
    uploading,
    uploadProgress,
    handleCategoryImageUpload,
    removeCategoryImage,
    onSubmit
}) {
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    return (
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
                            onClick={onClose}
                            className={`p-2 rounded-full transition-colors
                                ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                        >
                            <FaTimes className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                        </button>
                    </div>

                    <form onSubmit={onSubmit} className="space-y-4">
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
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
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

                                {uploading && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <FaSpinner className="animate-spin text-purple-500" />
                                            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                Uploading... {Math.round(uploadProgress)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            ></div>
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
    );
}