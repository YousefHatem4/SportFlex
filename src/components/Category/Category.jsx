import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../supabaseClient';
import toast from 'react-hot-toast';
import { FaTags, FaShoppingBag } from 'react-icons/fa';

export default function Category() {
    const [categories, setCategories] = useState([]);
    const [productsCount, setProductsCount] = useState({});
    const [loading, setLoading] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme ? savedTheme === 'dark' : true;
    });
    const navigate = useNavigate();

    // Listen for theme changes
    useEffect(() => {
        const checkTheme = () => {
            const savedTheme = localStorage.getItem('theme');
            setIsDarkMode(savedTheme ? savedTheme === 'dark' : true);
        };

        window.addEventListener('storage', checkTheme);

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const isDark = document.documentElement.classList.contains('dark');
                    setIsDarkMode(isDark);
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });

        return () => {
            window.removeEventListener('storage', checkTheme);
            observer.disconnect();
        };
    }, []);

    // Fetch categories and product counts from database
    useEffect(() => {
        fetchCategories();
        document.title = 'Categories - SportFlex Store';
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);

            const { data: categoriesData, error: categoriesError } = await supabase
                .from('categories')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (categoriesError) throw categoriesError;

            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select('category_id, id');

            if (productsError) throw productsError;

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
        navigate(`/products?category=${categoryId}`);
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors duration-300
                ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                <div className="text-center">
                    <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4
                        ${isDarkMode ? 'border-cyan-500' : 'border-cyan-700'}`}></div>
                    <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>Loading categories...</p>
                </div>
            </div>
        );
    }

    return <>
        <section className={`px-5 lg:px-30 py-16 transition-colors duration-300
            ${isDarkMode
                ? 'bg-gradient-to-b from-gray-900 via-black to-gray-900'
                : 'bg-gradient-to-b from-gray-100 via-white to-gray-100'}`}>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className='px-2 sm:px-0 mb-12'
            >
                <div className='flex items-center gap-5 mb-4'>
                    <div className={`w-[20px] h-[40px] rounded-lg transition-colors duration-300
                        ${isDarkMode
                            ? 'bg-gradient-to-r from-cyan-500 to-cyan-400'
                            : 'bg-gradient-to-r from-cyan-700 to-cyan-600'}`}>
                    </div>
                    <h1 className={`font-bold text-sm sm:text-base bg-gradient-to-r bg-clip-text text-transparent
                        ${isDarkMode
                            ? 'from-cyan-400 to-cyan-300'
                            : 'from-cyan-700 to-cyan-600'}`}>
                        SportFlex Categories
                    </h1>
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full transition-colors duration-300
                        ${isDarkMode
                            ? 'bg-gradient-to-r from-cyan-900/50 to-cyan-800/50 text-cyan-400'
                            : 'bg-gradient-to-r from-cyan-200/60 to-cyan-100/60 text-cyan-800'}`}>
                        {categories.length} categories
                    </span>
                </div>
                <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 transition-colors duration-300
                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Browse Our Collections
                </h1>
                <p className={`text-base lg:text-lg transition-colors duration-300
                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Discover premium sportFlex for every activity and lifestyle
                </p>
            </motion.div>

            {categories.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                >
                    <div className={`w-24 h-24 mx-auto mb-6 transition-colors duration-300
                        ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                        <FaTags className="text-8xl" />
                    </div>
                    <h3 className={`text-2xl font-semibold mb-2 transition-colors duration-300
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        No Categories Available
                    </h3>
                    <p className={`mb-6 transition-colors duration-300
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Categories will be added soon!
                    </p>
                    <Link
                        to="/products"
                        className={`inline-flex items-center px-6 py-3 text-white font-medium rounded-lg transition-colors duration-300
                            ${isDarkMode
                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
                                : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'}`}
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
                            className={`group relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 cursor-pointer border
                                ${isDarkMode
                                    ? 'bg-gray-900 border-gray-800'
                                    : 'bg-white border-gray-200'}`}
                        >
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
                                ${isDarkMode
                                    ? 'bg-gradient-to-br from-transparent via-transparent to-cyan-500/5'
                                    : 'bg-gradient-to-br from-transparent via-transparent to-cyan-200/30'}`}>
                            </div>

                            <div className='relative p-6 lg:p-8 flex flex-col items-center text-center'>
                                <div className={`relative mb-6 overflow-hidden rounded-xl p-4 group-hover:transition-all duration-300
                                    ${isDarkMode
                                        ? 'bg-gradient-to-br from-gray-800 to-gray-900 group-hover:from-gray-700 group-hover:to-gray-800'
                                        : 'bg-gradient-to-br from-gray-100 to-gray-50 group-hover:from-gray-200 group-hover:to-gray-100'}`}>

                                    <img
                                        src={category.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop'}
                                        className='w-16 h-16 lg:w-20 lg:h-20 object-cover object-center mx-auto group-hover:scale-110 transition-all duration-300'
                                        alt={category.name}
                                        onError={(e) => {
                                            e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop';
                                        }}
                                    />

                                    <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300
                                        ${isDarkMode
                                            ? 'bg-gradient-to-r from-cyan-500 to-cyan-400'
                                            : 'bg-gradient-to-r from-cyan-700 to-cyan-600'}`}>
                                    </div>
                                </div>

                                <h3 className={`font-semibold text-lg lg:text-xl group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300
                                    ${isDarkMode
                                        ? 'text-white group-hover:from-cyan-400 group-hover:to-cyan-300'
                                        : 'text-gray-900 group-hover:from-cyan-700 group-hover:to-cyan-600'}`}>
                                    {category.name}
                                </h3>

                                <div className="mt-2">
                                    <span className={`px-3 py-1 text-xs font-medium rounded-full transition-colors duration-300
                                        ${isDarkMode
                                            ? 'bg-gradient-to-r from-cyan-900/50 to-cyan-800/50 text-cyan-400'
                                            : 'bg-gradient-to-r from-cyan-200/60 to-cyan-100/60 text-cyan-800'}`}>
                                        {productsCount[category.id] || 0} products
                                    </span>
                                </div>

                                {category.description && (
                                    <p className={`text-sm mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 line-clamp-2
                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {category.description}
                                    </p>
                                )}
                            </div>

                            <div className={`absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-500'
                                    : 'bg-gradient-to-r from-cyan-700 via-cyan-600 to-cyan-700'}`}>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {categories.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className='flex justify-center mt-8 lg:mt-12'
                >
                    <Link
                        to="/products"
                        className={`inline-flex items-center gap-2 px-6 py-3 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300 shadow-md
                            ${isDarkMode
                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
                                : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'}`}
                    >
                        <FaShoppingBag />
                        View All Products
                    </Link>
                </motion.div>
            )}
        </section>
    </>
}