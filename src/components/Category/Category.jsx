// Category.jsx - UPDATED WITH DATABASE INTEGRATION
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';

export default function Category() {
    const [categories, setCategories] = useState([]);
    const [productsCount, setProductsCount] = useState({});
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Fetch categories and product counts from database
    useEffect(() => {
        fetchCategories();
        document.title = 'Categories - SportFlex Store';
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);

            // Fetch active categories
            const { data: categoriesData, error: categoriesError } = await supabase
                .from('categories')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (categoriesError) throw categoriesError;

            // Fetch product counts for each category
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select('category_id, id');

            if (productsError) throw productsError;

            // Count products per category
            const counts = {};
            productsData?.forEach(product => {
                if (product.category_id) {
                    counts[product.category_id] = (counts[product.category_id] || 0) + 1;
                }
            });

            setCategories(categoriesData || []);
            setProductsCount(counts);

        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryClick = (categoryId) => {
        // Navigate to products page with category parameter
        navigate(`/products?category=${categoryId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading categories...</p>
                </div>
            </div>
        );
    }

    return <>
        {/* Category section */}
        <section className='px-5 lg:px-30 py-16 bg-gradient-to-b from-blue-50/30 via-white to-teal-50/30'>
            {/* title */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className='px-2 sm:px-0 mb-12'
            >
                <div className='flex items-center gap-5 mb-4'>
                    <div className='bg-gradient-to-r from-blue-500 to-teal-400 w-[20px] h-[40px] rounded-lg'></div>
                    <h1 className='bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent font-bold text-sm sm:text-base'>SportFlex Categories</h1>
                    <span className="bg-gradient-to-r from-blue-100 to-teal-100 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {categories.length} categories
                    </span>
                </div>
                <h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 text-gray-800'>Browse Our Collections</h1>
                <p className='text-gray-600 text-base lg:text-lg'>Discover premium sportFlex for every activity and lifestyle</p>
            </motion.div>

            {/* Categories Grid */}
            {categories.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                >
                    <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
                        <i className="fas fa-tags text-8xl"></i>
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-800 mb-2">No Categories Available</h3>
                    <p className="text-gray-600 mb-6">Categories will be added soon!</p>
                    <Link
                        to="/products"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-teal-600 transition-colors duration-300"
                    >
                        Browse All Products
                    </Link>
                </motion.div>
            ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8'>
                    {categories.map((category, index) => (
                        <motion.div
                            key={category.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => handleCategoryClick(category.id)}
                            className='group relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 cursor-pointer border border-gray-100'
                        >
                            {/* Background gradient overlay */}
                            <div className='absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500'></div>

                            {/* Content container */}
                            <div className='relative p-6 lg:p-8 flex flex-col items-center text-center'>
                                {/* Image container with modern styling */}
                                <div className='relative mb-6 overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-teal-50 p-4 group-hover:from-blue-100 group-hover:to-teal-100 transition-all duration-300'>
                                    <img
                                        src={category.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop'}
                                        className='w-16 h-16 lg:w-20 lg:h-20 object-cover object-center mx-auto group-hover:scale-110 transition-all duration-300'
                                        alt={category.name}
                                        onError={(e) => {
                                            e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop';
                                        }}
                                    />
                                    {/* Decorative circle */}
                                    <div className='absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-400 to-teal-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
                                </div>

                                {/* Category name */}
                                <h3 className='font-semibold text-lg lg:text-xl text-gray-800 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-teal-500 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300'>
                                    {category.name}
                                </h3>

                                {/* Product count */}
                                <div className="mt-2">
                                    <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-teal-100 text-blue-700 text-xs font-medium rounded-full">
                                        {productsCount[category.id] || 0} products
                                    </span>
                                </div>

                                {/* Subtle description */}
                                {category.description && (
                                    <p className='text-sm text-gray-500 mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 line-clamp-2'>
                                        {category.description}
                                    </p>
                                )}
                            </div>

                            {/* Bottom border accent */}
                            <div className='absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-teal-400 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left'></div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Back to Products Button */}
            {categories.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className='flex justify-center mt-8 lg:mt-12'
                >
                    <Link
                        to="/products"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-teal-600 hover:shadow-lg transition-all duration-300 shadow-md"
                    >
                        <i className="fas fa-shopping-bag"></i>
                        View All Products
                    </Link>
                </motion.div>
            )}
        </section>
    </>
}