// tabs/ShippingTab.jsx - Shipping costs management tab
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaTruck, FaSpinner } from 'react-icons/fa';
import { supabase } from '../../../supabaseClient';
import ShippingModal from '../modals/ShippingModal';

export default function ShippingTab({
    isDarkMode,
    searchQuery,
    setSearchQuery,
    isLoading,
    isInitializing,
    shippingCosts,
    formatDate,
    refreshData
}) {
    const [showShippingModal, setShowShippingModal] = useState(false);
    const [editingShipping, setEditingShipping] = useState(null);
    const [shippingForm, setShippingForm] = useState({
        governorate: '',
        governorate_ar: '',
        cost: '',
        delivery_days: 3,
        is_active: true,
        notes: ''
    });

    const handleShippingSubmit = async (e) => {
        e.preventDefault();
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
                toast.success('Shipping cost updated successfully');
            } else {
                shippingData.created_by = session.user.id;
                const { data, error } = await supabase
                    .from('shipping_costs')
                    .insert([shippingData])
                    .select()
                    .single();
                if (error) throw error;
                toast.success('Shipping cost added successfully');
            }

            await refreshData();
            resetShippingForm();
            setShowShippingModal(false);
        } catch (error) {
            console.error('Error saving shipping cost:', error);
            toast.error(error.message || 'Failed to save shipping cost');
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
            await refreshData();
            toast.success('Shipping cost deleted successfully');
        } catch (error) {
            console.error('Error deleting shipping cost:', error);
            toast.error('Failed to delete shipping cost');
        }
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

    const filteredShipping = shippingCosts.filter(shipping =>
        shipping.governorate.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shipping.governorate_ar?.toLowerCase().includes(searchQuery.toLowerCase())
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

            <ShippingModal
                isOpen={showShippingModal}
                onClose={() => {
                    setShowShippingModal(false);
                    resetShippingForm();
                }}
                isDarkMode={isDarkMode}
                editingShipping={editingShipping}
                shippingForm={shippingForm}
                setShippingForm={setShippingForm}
                isLoading={isLoading}
                onSubmit={handleShippingSubmit}
            />
        </motion.div>
    );
}