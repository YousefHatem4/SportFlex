// tabs/CategoriesTab.jsx - Categories management tab
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaTag, FaSpinner, FaUpload, FaTimes } from 'react-icons/fa';
import { supabase } from '../../../supabaseClient';
import CategoryModal from '../modals/CategoryModal';

export default function CategoriesTab({
    isDarkMode,
    searchQuery,
    setSearchQuery,
    isLoading,
    isInitializing,
    categories,
    products,
    setProducts,
    stats,
    formatDate,
    refreshData,
    uploading,
    uploadProgress,
    handleCategoryImageUpload,
    removeCategoryImage
}) {
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryForm, setCategoryForm] = useState({
        name: '',
        description: '',
        image_url: '',
        is_active: true
    });

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
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
                toast.success('Category added successfully');
            }

            await refreshData();
            resetCategoryForm();
            setShowCategoryModal(false);
        } catch (error) {
            console.error('Error saving category:', error);
            toast.error(error.message || 'Failed to save category');
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

            const { error: updateError } = await supabase
                .from('products')
                .update({
                    category_id: null,
                    category: 'Uncategorized',
                    updated_at: new Date().toISOString()
                })
                .eq('category_id', categoryId);
            if (updateError) throw updateError;

            await refreshData();
            toast.success('Category deleted successfully');
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Failed to delete category');
        }
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

    const filteredCategories = categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
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

            <CategoryModal
                isOpen={showCategoryModal}
                onClose={() => {
                    setShowCategoryModal(false);
                    resetCategoryForm();
                }}
                isDarkMode={isDarkMode}
                editingCategory={editingCategory}
                categoryForm={categoryForm}
                setCategoryForm={setCategoryForm}
                isLoading={isLoading}
                uploading={uploading}
                uploadProgress={uploadProgress}
                handleCategoryImageUpload={(e) => handleCategoryImageUpload(e, setCategoryForm, categoryForm)}
                removeCategoryImage={() => removeCategoryImage(setCategoryForm, categoryForm)}
                onSubmit={handleCategorySubmit}
            />
        </motion.div>
    );
}