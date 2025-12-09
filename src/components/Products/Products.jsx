// Products.jsx - COMPLETE SOLUTION WITH URL PARAMETER INTEGRATION
import React, { useEffect, useState } from 'react'
import style from './Products.module.css'
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { supabase } from '../../supabaseClient';

export default function Products() {
    const navigate = useNavigate();
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [addedItems, setAddedItems] = useState([]);
    const [wishItems, setWishItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Function to parse URL parameters
    const getUrlParams = () => {
        const searchParams = new URLSearchParams(location.search);
        return {
            category: searchParams.get('category') || 'all',
            search: searchParams.get('search') || ''
        };
    };

    // Check user session and fetch data
    useEffect(() => {
        checkUser();
        fetchCategories();

        // Get parameters from URL
        const params = getUrlParams();

        // Set state from URL parameters
        if (params.category !== 'all') {
            setSelectedCategory(params.category);
        }

        if (params.search) {
            setSearchQuery(params.search);
        }

        // Fetch products with URL parameters
        fetchProducts(params.category, params.search);

        document.title = 'Products - SportFlex Store';
        window.scrollTo(0, 0);
    }, [location]);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);

        if (session?.user) {
            fetchUserCart(session.user.id);
            fetchUserWishlist(session.user.id);
        }
    };

    // Fetch products from database with optional filters
    const fetchProducts = async (categoryId = 'all', search = '') => {
        try {
            setLoading(true);

            let query = supabase
                .from('products')
                .select(`
                    *,
                    categories (
                        id,
                        name
                    )
                `)
                .order('created_at', { ascending: false });

            // Filter by category if selected
            if (categoryId !== 'all' && categoryId !== '') {
                query = query.eq('category_id', categoryId);
            }

            // Filter by search query
            if (search) {
                query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
            }

            const { data, error } = await query;

            if (error) throw error;

            console.log('Products fetched:', data?.length);
            setProducts(data || []);

        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch categories from database
    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;

            console.log('Categories fetched:', data?.length);
            setCategories(data || []);

        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
            setCategories([]);
        }
    };

    // Fetch user's cart items
    const fetchUserCart = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('cart_items')
                .select('product_id')
                .eq('user_id', userId);

            if (error) throw error;

            const cartProductIds = data?.map(item => item.product_id) || [];
            setAddedItems(cartProductIds);
        } catch (error) {
            console.error('Error fetching cart:', error);
        }
    };

    // Fetch user's wishlist items
    const fetchUserWishlist = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('wishlist_items')
                .select('product_id')
                .eq('user_id', userId);

            if (error) throw error;

            const wishlistProductIds = data?.map(item => item.product_id) || [];
            setWishItems(wishlistProductIds);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        }
    };

    const handleAddToCart = async (productId) => {
        try {
            if (!user) {
                toast.error("You must sign in first to add to cart");
                navigate("/login");
                return;
            }

            // Check if product is already in cart
            const { data: existingItem, error: checkError } = await supabase
                .from('cart_items')
                .select('*')
                .eq('user_id', user.id)
                .eq('product_id', productId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }

            if (existingItem) {
                // Update quantity
                const { error: updateError } = await supabase
                    .from('cart_items')
                    .update({ quantity: existingItem.quantity + 1 })
                    .eq('id', existingItem.id);

                if (updateError) throw updateError;
                toast.success("Product quantity updated in cart!");
            } else {
                // Add new item to cart
                const { error: insertError } = await supabase
                    .from('cart_items')
                    .insert({
                        user_id: user.id,
                        product_id: productId,
                        quantity: 1
                    });

                if (insertError) throw insertError;
                toast.success("Product added to cart!");
            }

            // Update local state
            setAddedItems((prev) => [...prev, productId]);

            // Refresh cart count
            fetchUserCart(user.id);

        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error('Failed to add to cart');
        }
    };

    const handleWishlistAction = async (productId) => {
        try {
            if (!user) {
                toast.error("You must sign in first to manage wishlist");
                navigate("/login");
                return;
            }

            // Check if product is already in wishlist
            const { data: existingItem, error: checkError } = await supabase
                .from('wishlist_items')
                .select('*')
                .eq('user_id', user.id)
                .eq('product_id', productId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }

            if (existingItem) {
                // Remove from wishlist
                const { error: deleteError } = await supabase
                    .from('wishlist_items')
                    .delete()
                    .eq('id', existingItem.id);

                if (deleteError) throw deleteError;

                setWishItems(wishItems.filter(id => id !== productId));
                toast.success("Product removed from wishlist!");
            } else {
                // Add to wishlist
                const { error: insertError } = await supabase
                    .from('wishlist_items')
                    .insert({
                        user_id: user.id,
                        product_id: productId
                    });

                if (insertError) throw insertError;

                setWishItems([...wishItems, productId]);
                toast.success("Product added to wishlist!");
            }

            // Refresh wishlist
            fetchUserWishlist(user.id);

        } catch (error) {
            console.error('Error updating wishlist:', error);
            toast.error('Failed to update wishlist');
        }
    };

    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(categoryId);

        // Update URL with category parameter
        const params = new URLSearchParams(location.search);

        if (categoryId === 'all') {
            params.delete('category');
        } else {
            params.set('category', categoryId);
        }

        // Preserve search query if exists
        if (searchQuery) {
            params.set('search', searchQuery);
        }

        navigate(`/products?${params.toString()}`);
        fetchProducts(categoryId, searchQuery);
    };

    const handleSearch = (e) => {
        e.preventDefault();

        // Update URL with search parameter
        const params = new URLSearchParams(location.search);

        if (searchQuery) {
            params.set('search', searchQuery);
        } else {
            params.delete('search');
        }

        // Preserve category if exists
        if (selectedCategory !== 'all') {
            params.set('category', selectedCategory);
        }

        navigate(`/products?${params.toString()}`);
        fetchProducts(selectedCategory, searchQuery);
    };

    const handleClearFilters = () => {
        setSelectedCategory('all');
        setSearchQuery('');

        // Clear all URL parameters
        navigate('/products');
        fetchProducts('all', '');
    };

    // Check if product is in wishlist
    const isInWishlist = (productId) => {
        return wishItems.includes(productId);
    };

    // Check if product is in cart
    const isInCart = (productId) => {
        return addedItems.includes(productId);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading products...</p>
                </div>
            </div>
        );
    }

    return <>
        {/* Products section */}
        <section className='my-10 px-4 sm:px-6 lg:px-30'>
            {/* title */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className='px-2 mb-10 sm:px-0'
            >
                <div className='flex items-center justify-between flex-wrap gap-4 mb-6'>
                    <div className='flex items-center gap-5'>
                        <div className='bg-gradient-to-r from-blue-500 to-teal-400 w-[20px] h-[40px] rounded-lg'></div>
                        <h1 className='bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent font-bold text-sm sm:text-base'>Our Products</h1>
                        <span className="bg-gradient-to-r from-blue-100 to-teal-100 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {products.length} items
                        </span>
                    </div>

                    {/* Filter and Search Controls */}
                    <div className="flex flex-wrap gap-3">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search products..."
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-300 text-sm"
                            >
                                Search
                            </button>
                        </form>

                        <select
                            value={selectedCategory}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                        </select>

                        {(selectedCategory !== 'all' || searchQuery) && (
                            <button
                                onClick={handleClearFilters}
                                className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-300 text-sm"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Active Filters Display */}
                {(selectedCategory !== 'all' || searchQuery) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-4 flex flex-wrap gap-2 items-center"
                    >
                        <span className="text-sm text-gray-600">Active filters:</span>
                        {selectedCategory !== 'all' && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Category: {categories.find(c => c.id === selectedCategory)?.name || 'Selected'}
                                <button
                                    onClick={() => handleCategoryChange('all')}
                                    className="ml-2 text-blue-600 hover:text-blue-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                        {searchQuery && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                Search: "{searchQuery}"
                                <button
                                    onClick={() => {
                                        setSearchQuery('');
                                        handleSearch({ preventDefault: () => { } });
                                    }}
                                    className="ml-2 text-teal-600 hover:text-teal-800"
                                >
                                    ×
                                </button>
                            </span>
                        )}
                    </motion.div>
                )}
            </motion.div>

            {/* Products Grid */}
            {products.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full text-center py-16"
                >
                    <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
                        <i className="fas fa-box-open text-8xl"></i>
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-800 mb-2">No Products Found</h3>
                    <p className="text-gray-600 mb-6">
                        {searchQuery
                            ? `No products found for "${searchQuery}"`
                            : selectedCategory !== 'all'
                                ? `No products found in this category`
                                : 'No products available yet.'
                        }
                    </p>
                    <button
                        onClick={handleClearFilters}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-teal-600 transition-colors duration-300"
                    >
                        View All Products
                    </button>
                </motion.div>
            ) : (
                <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } }
                    }}
                    className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
                >
                    {products.map((product) => (
                        <motion.div
                            key={product.id}
                            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                            whileHover={{ scale: 1.03 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Product Card */}
                            <div className='cursor-pointer product bg-white p-3 sm:p-4 rounded-xl lg:rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full border border-gray-100 hover:-translate-y-2'>
                                {/* Product Image */}
                                <Link to={`/productdetails/${product.id}`}>
                                    <div className="overflow-hidden rounded-lg lg:rounded-xl relative">
                                        <img
                                            src={product.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop'}
                                            alt={product.title}
                                            className="w-full h-40 sm:h-48 lg:h-52 object-cover hover:scale-110 transition-transform duration-500 ease-in-out"
                                            onError={(e) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop';
                                            }}
                                        />
                                        {/* Stock Badge */}
                                        {product.stock <= 10 && product.stock > 0 && (
                                            <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                Only {product.stock} left
                                            </div>
                                        )}
                                        {product.stock === 0 && (
                                            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                Out of Stock
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="mt-3 sm:mt-4 space-y-1">
                                        <span className="inline-block text-xs font-medium text-gray-400 uppercase tracking-widest">
                                            {product.categories?.name || 'Uncategorized'}
                                        </span>
                                        <h3 className="text-sm sm:text-base font-semibold text-gray-800 leading-snug line-clamp-2 hover:bg-gradient-to-r hover:from-blue-600 hover:to-teal-500 hover:bg-clip-text hover:text-transparent transition-all duration-300">
                                            {product.title}
                                        </h3>

                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-blue-600 font-bold text-xs sm:text-sm">EGP {parseFloat(product.price).toFixed(2)}</span>
                                            <div className="flex items-center text-amber-500 text-xs sm:text-sm">
                                                <i className="fas fa-star mr-1"></i>
                                                {product.ratingsAverage || 4.5}
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Stock: {product.stock}
                                        </div>
                                    </div>
                                </Link>

                                {/* Action Buttons */}
                                <div className="mt-3 sm:mt-5 flex justify-between items-center gap-2 sm:gap-3">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleAddToCart(product.id)}
                                        disabled={isInCart(product.id) || product.stock <= 0}
                                        className={`cursor-pointer flex-1 py-2 rounded-lg lg:rounded-xl transition-all duration-300 text-xs sm:text-sm font-semibold shadow 
                                            ${isInCart(product.id)
                                                ? "bg-gray-400 text-white cursor-not-allowed shadow-none"
                                                : product.stock <= 0
                                                    ? "bg-red-100 text-red-600 cursor-not-allowed"
                                                    : "bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:from-blue-600 hover:to-teal-600 hover:shadow-md"}`}
                                    >
                                        {isInCart(product.id)
                                            ? "Added"
                                            : product.stock <= 0
                                                ? "Out of Stock"
                                                : "Add to Cart"}
                                    </motion.button>

                                    <motion.button
                                        whileTap={{ scale: 0.85 }}
                                        onClick={() => handleWishlistAction(product.id)}
                                        className={`cursor-pointer p-2 rounded-full border transition-all duration-300 hover:scale-110
                                            ${isInWishlist(product.id)
                                                ? "bg-gradient-to-r from-rose-50 to-pink-50 border-rose-400 text-rose-500"
                                                : "border-gray-300 text-gray-500 hover:text-rose-500 hover:border-rose-400 hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50"
                                            }`}
                                        title={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                                    >
                                        <i className="fa-solid fa-heart text-sm sm:text-lg"></i>
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </section>
    </>
}