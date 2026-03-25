// modals/PromoCodeModal.jsx - Promo code add/edit modal
import React from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaSpinner, FaCheck } from 'react-icons/fa';

export default function PromoCodeModal({
    isOpen,
    onClose,
    isDarkMode,
    editingPromoCode,
    promoCodeForm,
    setPromoCodeForm,
    isLoading,
    onSubmit
}) {
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
                            {editingPromoCode ? 'Edit Promo Code' : 'Add Promo Code'}
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
    );
}