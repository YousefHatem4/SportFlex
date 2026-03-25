// modals/ShippingModal.jsx - Shipping add/edit modal
import React from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaSpinner, FaCheck } from 'react-icons/fa';

export default function ShippingModal({
    isOpen,
    onClose,
    isDarkMode,
    editingShipping,
    shippingForm,
    setShippingForm,
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
                            {editingShipping ? 'Edit Shipping Cost' : 'Add Shipping Cost'}
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
    );
}