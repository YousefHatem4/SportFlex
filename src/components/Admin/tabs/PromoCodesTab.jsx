// tabs/PromoCodesTab.jsx - Promo codes management tab
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaTicketAlt, FaSpinner } from 'react-icons/fa';
import { supabase } from '../../../supabaseClient';
import PromoCodeModal from '../modals/PromoCodeModal';

export default function PromoCodesTab({
    isDarkMode,
    searchQuery,
    setSearchQuery,
    isLoading,
    isInitializing,
    promoCodes,
    formatDate,
    refreshData
}) {
    const [showPromoCodeModal, setShowPromoCodeModal] = useState(false);
    const [editingPromoCode, setEditingPromoCode] = useState(null);
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

    const handlePromoCodeSubmit = async (e) => {
        e.preventDefault();
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
                toast.success('Promo code added successfully');
            }

            await refreshData();
            resetPromoCodeForm();
            setShowPromoCodeModal(false);
        } catch (error) {
            console.error('Error saving promo code:', error);
            toast.error('Failed to save promo code');
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
            await refreshData();
            toast.success('Promo code deleted successfully');
        } catch (error) {
            console.error('Error deleting promo code:', error);
            toast.error('Failed to delete promo code');
        }
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

    const filteredPromoCodes = promoCodes.filter(promo =>
        promo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        promo.description?.toLowerCase().includes(searchQuery.toLowerCase())
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

            <PromoCodeModal
                isOpen={showPromoCodeModal}
                onClose={() => {
                    setShowPromoCodeModal(false);
                    resetPromoCodeForm();
                }}
                isDarkMode={isDarkMode}
                editingPromoCode={editingPromoCode}
                promoCodeForm={promoCodeForm}
                setPromoCodeForm={setPromoCodeForm}
                isLoading={isLoading}
                onSubmit={handlePromoCodeSubmit}
            />
        </motion.div>
    );
}