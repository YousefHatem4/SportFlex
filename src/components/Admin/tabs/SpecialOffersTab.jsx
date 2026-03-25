// tabs/SpecialOffersTab.jsx - Special offers management tab
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaGift, FaSpinner } from 'react-icons/fa';
import { supabase } from '../../../supabaseClient';
import SpecialOfferModal from '../modals/SpecialOfferModal';

export default function SpecialOffersTab({
    isDarkMode,
    searchQuery,
    setSearchQuery,
    isLoading,
    isInitializing,
    specialOffers,
    formatDate,
    formatDateTime,
    refreshData
}) {
    const [showSpecialOfferModal, setShowSpecialOfferModal] = useState(false);
    const [editingSpecialOffer, setEditingSpecialOffer] = useState(null);
    const [specialOfferForm, setSpecialOfferForm] = useState({
        banner_text: '',
        is_active: true,
        start_date: '',
        end_date: ''
    });

    const handleSpecialOfferSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const offerData = {
                banner_text: specialOfferForm.banner_text,
                is_active: specialOfferForm.is_active,
                start_date: specialOfferForm.start_date || null,
                end_date: specialOfferForm.end_date || null,
                updated_at: new Date().toISOString(),
            };

            if (editingSpecialOffer) {
                const { data, error } = await supabase
                    .from('special_offers')
                    .update(offerData)
                    .eq('id', editingSpecialOffer.id)
                    .select()
                    .single();
                if (error) throw error;
                toast.success('Special offer updated successfully');
            } else {
                offerData.created_by = session.user.id;
                const { data, error } = await supabase
                    .from('special_offers')
                    .insert([offerData])
                    .select()
                    .single();
                if (error) throw error;
                toast.success('Special offer added successfully');
            }

            await refreshData();
            resetSpecialOfferForm();
            setShowSpecialOfferModal(false);
        } catch (error) {
            console.error('Error saving special offer:', error);
            toast.error('Failed to save special offer');
        }
    };

    const handleEditSpecialOffer = (offer) => {
        setEditingSpecialOffer(offer);
        setSpecialOfferForm({
            banner_text: offer.banner_text,
            is_active: offer.is_active,
            start_date: offer.start_date ? offer.start_date.substring(0, 16) : '',
            end_date: offer.end_date ? offer.end_date.substring(0, 16) : ''
        });
        setShowSpecialOfferModal(true);
    };

    const handleDeleteSpecialOffer = async (offerId) => {
        if (!window.confirm('Are you sure you want to delete this special offer?')) return;
        try {
            const { error } = await supabase
                .from('special_offers')
                .delete()
                .eq('id', offerId);
            if (error) throw error;
            await refreshData();
            toast.success('Special offer deleted successfully');
        } catch (error) {
            console.error('Error deleting special offer:', error);
            toast.error('Failed to delete special offer');
        }
    };

    const resetSpecialOfferForm = () => {
        setSpecialOfferForm({
            banner_text: '',
            is_active: true,
            start_date: '',
            end_date: ''
        });
        setEditingSpecialOffer(null);
    };

    const filteredSpecialOffers = specialOffers.filter(offer =>
        offer.banner_text.toLowerCase().includes(searchQuery.toLowerCase())
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
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Special Offers Management</h1>
                    <p className={`transition-colors duration-300
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage banner offers displayed on the website</p>
                </div>
                <button
                    onClick={() => {
                        resetSpecialOfferForm();
                        setShowSpecialOfferModal(true);
                    }}
                    className={`flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg
                        ${isDarkMode
                            ? 'bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700'
                            : 'bg-gradient-to-r from-orange-700 to-pink-700 hover:from-orange-800 hover:to-pink-800'}`}
                >
                    <FaGift /> Add Special Offer
                </button>
            </div>

            {/* Offers Grid */}
            {isInitializing ? (
                <div className="flex justify-center items-center h-64">
                    <FaSpinner className={`animate-spin text-4xl ${isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}`} />
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredSpecialOffers.map((offer) => (
                        <div key={offer.id} className={`rounded-xl shadow-lg p-6 border transition-colors duration-300
                            ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className={`font-bold text-lg transition-colors duration-300
                                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Banner Text</h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                            ${offer.is_active
                                                ? isDarkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700'
                                                : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                                            }`}>
                                            {offer.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className={`p-4 rounded-lg border-l-4 transition-colors duration-300
                                        ${isDarkMode
                                            ? 'text-gray-300 bg-gray-800 border-orange-500'
                                            : 'text-gray-700 bg-gray-50 border-orange-700'}`}>
                                        {offer.banner_text}
                                    </p>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => handleEditSpecialOffer(offer)}
                                        className={`p-2 rounded-lg transition-colors
                                            ${isDarkMode ? 'text-cyan-400 hover:bg-cyan-900/30' : 'text-cyan-700 hover:bg-cyan-100'}`}
                                        title="Edit"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSpecialOffer(offer.id)}
                                        className={`p-2 rounded-lg transition-colors
                                            ${isDarkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-700 hover:bg-red-100'}`}
                                        title="Delete"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className={`transition-colors duration-300
                                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <span className="font-medium">Created:</span> {formatDate(offer.created_at)}
                                </div>
                                {offer.start_date && (
                                    <div className={`transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        <span className="font-medium">Starts:</span> {formatDateTime(offer.start_date)}
                                    </div>
                                )}
                                {offer.end_date && (
                                    <div className={`transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        <span className="font-medium">Ends:</span> {formatDateTime(offer.end_date)}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <SpecialOfferModal
                isOpen={showSpecialOfferModal}
                onClose={() => {
                    setShowSpecialOfferModal(false);
                    resetSpecialOfferForm();
                }}
                isDarkMode={isDarkMode}
                editingSpecialOffer={editingSpecialOffer}
                specialOfferForm={specialOfferForm}
                setSpecialOfferForm={setSpecialOfferForm}
                isLoading={isLoading}
                onSubmit={handleSpecialOfferSubmit}
            />
        </motion.div>
    );
}