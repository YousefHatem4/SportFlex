// ProductDetails.jsx - IMPROVED FEEDBACK SYSTEM WITH DYNAMIC RATING BARS
// Enhanced for Mobile & Tablet Responsiveness - Removed Delivery Section
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import toast from 'react-hot-toast';
import { supabase } from '../../supabaseClient';

export default function ProductDetails() {
    let { id } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [mainImage, setMainImage] = useState('');
    const [allImages, setAllImages] = useState([]);
    const sliderRef = useRef(null);
    const [addedItems, setAddedItems] = useState([]);
    const [wishItems, setWishItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    // Feedback States
    const [feedbackStats, setFeedbackStats] = useState({
        total_reviews: 0,
        average_rating: 0,
        five_star_count: 0,
        four_star_count: 0,
        three_star_count: 0,
        two_star_count: 0,
        one_star_count: 0
    });
    const [userFeedback, setUserFeedback] = useState(null);
    const [allFeedbacks, setAllFeedbacks] = useState([]);
    const [showFeedbackForm, setShowFeedbackForm] = useState(false);
    const [feedbackRating, setFeedbackRating] = useState(5);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [loadingFeedback, setLoadingFeedback] = useState(true);
    const [sortBy, setSortBy] = useState('most_recent');
    const [deletingFeedback, setDeletingFeedback] = useState(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Check user session and admin status
    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);

        if (session?.user) {
            fetchUserCart(session.user.id);
            fetchUserWishlist(session.user.id);
            checkAdminStatus(session.user.id);
        }
    };

    // Check if user is admin
    const checkAdminStatus = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('admin_roles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error checking admin status:', error);
                return;
            }

            setIsAdmin(!!data);
        } catch (error) {
            console.error('Error checking admin status:', error);
        }
    };

    // Fetch product details from database
    const fetchProductDetails = async () => {
        try {
            setLoading(true);

            const { data: productData, error: productError } = await supabase
                .from('products')
                .select(`
                    *,
                    categories (
                        id,
                        name
                    )
                `)
                .eq('id', id)
                .single();

            if (productError) throw productError;

            if (!productData) {
                toast.error('Product not found');
                navigate('/products');
                return;
            }

            // Get product images
            const { data: imagesData, error: imagesError } = await supabase
                .from('product_images')
                .select('*')
                .eq('product_id', id)
                .order('display_order', { ascending: true });

            if (imagesError) throw imagesError;

            // Combine images
            const imagesArray = [];

            // Always include main image from products table
            if (productData.image_url) {
                imagesArray.push({
                    id: 'main',
                    image_url: productData.image_url,
                    display_order: 0
                });
            }

            // Add additional images
            if (imagesData && imagesData.length > 0) {
                imagesData.forEach(img => {
                    imagesArray.push({
                        id: img.id,
                        image_url: img.image_url,
                        display_order: img.display_order || imagesArray.length
                    });
                });
            }

            // Remove duplicates
            const uniqueImages = imagesArray.filter((img, index, self) =>
                index === self.findIndex((t) => t.image_url === img.image_url)
            );

            // Sort by display order
            uniqueImages.sort((a, b) => a.display_order - b.display_order);

            setProduct({
                _id: productData.id,
                title: productData.title,
                description: productData.description,
                category: {
                    name: productData.categories?.name || productData.category || 'Uncategorized',
                    _id: productData.category_id || productData.category
                },
                price: parseFloat(productData.price),
                ratingsAverage: productData.ratings_average || 4.5,
                stock: productData.stock,
                imageCover: productData.image_url,
                images: uniqueImages.map(img => img.image_url),
                allImagesData: uniqueImages
            });

            setAllImages(uniqueImages);
            if (uniqueImages.length > 0) {
                setMainImage(uniqueImages[0].image_url);
            }

        } catch (error) {
            console.error('Error fetching product details:', error);
            toast.error('Failed to load product details');
        } finally {
            setLoading(false);
        }
    };

    // Fetch feedback statistics
    const fetchFeedbackStats = async () => {
        try {
            const { data, error } = await supabase
                .from('product_feedback_stats')
                .select('*')
                .eq('product_id', id)
                .single();

            if (error) {
                await calculateFeedbackStats();
                return;
            }

            if (data) {
                setFeedbackStats({
                    total_reviews: data.total_reviews || 0,
                    average_rating: parseFloat(data.average_rating) || 0,
                    five_star_count: data.five_star_count || 0,
                    four_star_count: data.four_star_count || 0,
                    three_star_count: data.three_star_count || 0,
                    two_star_count: data.two_star_count || 0,
                    one_star_count: data.one_star_count || 0
                });
            }
        } catch (error) {
            console.error('Error fetching feedback stats:', error);
            await calculateFeedbackStats();
        }
    };

    // Calculate feedback stats manually
    const calculateFeedbackStats = async () => {
        try {
            const { data: feedbacks, error } = await supabase
                .from('product_feedback')
                .select('rating')
                .eq('product_id', id);

            if (error) throw error;

            const total = feedbacks?.length || 0;
            const sum = feedbacks?.reduce((acc, curr) => acc + curr.rating, 0) || 0;
            const avg = total > 0 ? sum / total : 0;

            const counts = {
                5: 0, 4: 0, 3: 0, 2: 0, 1: 0
            };

            feedbacks?.forEach(fb => {
                if (counts[fb.rating] !== undefined) {
                    counts[fb.rating]++;
                }
            });

            setFeedbackStats({
                total_reviews: total,
                average_rating: avg,
                five_star_count: counts[5],
                four_star_count: counts[4],
                three_star_count: counts[3],
                two_star_count: counts[2],
                one_star_count: counts[1]
            });
        } catch (error) {
            console.error('Error calculating feedback stats:', error);
        }
    };

    // Fetch all feedbacks for this product
    const fetchAllFeedbacks = async () => {
        try {
            setLoadingFeedback(true);

            const { data: functionData, error: functionError } = await supabase
                .rpc('get_product_feedback', { product_uuid: id });

            if (!functionError && functionData) {
                const sortedData = sortFeedbacks(functionData || [], sortBy);
                setAllFeedbacks(sortedData);
                return;
            }

            const { data: feedbacks, error } = await supabase
                .from('product_feedback')
                .select(`
                    *,
                    profiles (
                        email,
                        full_name,
                        avatar_url
                    )
                `)
                .eq('product_id', id);

            if (error) throw error;

            const transformedFeedbacks = (feedbacks || []).map(fb => ({
                feedback_id: fb.id,
                user_id: fb.user_id,
                user_email: fb.profiles?.email || '',
                user_name: fb.profiles?.full_name || 'Anonymous User',
                user_avatar: fb.profiles?.avatar_url || '',
                rating: fb.rating,
                comment: fb.comment,
                created_at: fb.created_at,
                updated_at: fb.updated_at,
                time_ago: getTimeAgo(fb.created_at)
            }));

            const sortedData = sortFeedbacks(transformedFeedbacks, sortBy);
            setAllFeedbacks(sortedData);

        } catch (error) {
            console.error('Error fetching feedbacks:', error);
            setAllFeedbacks([]);
        } finally {
            setLoadingFeedback(false);
        }
    };

    // Sort feedbacks based on selected option
    const sortFeedbacks = (feedbacks, sortOption) => {
        const sorted = [...feedbacks];

        switch (sortOption) {
            case 'highest_rating':
                return sorted.sort((a, b) => b.rating - a.rating);
            case 'lowest_rating':
                return sorted.sort((a, b) => a.rating - b.rating);
            case 'most_recent':
                return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            default:
                return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
    };

    // Handle sort change
    const handleSortChange = (e) => {
        const newSortBy = e.target.value;
        setSortBy(newSortBy);
        const sortedFeedbacks = sortFeedbacks(allFeedbacks, newSortBy);
        setAllFeedbacks(sortedFeedbacks);
    };

    // Helper function to calculate time ago
    const getTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return Math.floor(diffInSeconds / 60) + ' minutes ago';
        if (diffInSeconds < 86400) return Math.floor(diffInSeconds / 3600) + ' hours ago';
        if (diffInSeconds < 604800) return Math.floor(diffInSeconds / 86400) + ' days ago';

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Fetch user's feedback for this product
    const fetchUserFeedback = async () => {
        if (!user) {
            setUserFeedback(null);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('product_feedback')
                .select('*')
                .eq('user_id', user.id)
                .eq('product_id', id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching user feedback:', error);
                return;
            }

            setUserFeedback(data || null);
            if (data) {
                setFeedbackRating(data.rating);
                setFeedbackComment(data.comment || '');
            }
        } catch (error) {
            console.error('Error fetching user feedback:', error);
            setUserFeedback(null);
        }
    };

    // Handle feedback submission
    const handleSubmitFeedback = async () => {
        if (!user) {
            toast.error('Please sign in to submit feedback');
            navigate('/login');
            return;
        }

        if (feedbackRating < 1 || feedbackRating > 5) {
            toast.error('Please select a rating between 1 and 5 stars');
            return;
        }

        setSubmittingFeedback(true);
        try {
            if (userFeedback) {
                const { error } = await supabase
                    .from('product_feedback')
                    .update({
                        rating: feedbackRating,
                        comment: feedbackComment.trim() || null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userFeedback.id);

                if (error) throw error;
                toast.success('Feedback updated successfully!');
            } else {
                const { error } = await supabase
                    .from('product_feedback')
                    .insert({
                        product_id: id,
                        user_id: user.id,
                        rating: feedbackRating,
                        comment: feedbackComment.trim() || null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });

                if (error) throw error;
                toast.success('Thank you for your feedback!');
            }

            await Promise.all([
                fetchFeedbackStats(),
                fetchAllFeedbacks(),
                fetchUserFeedback(),
                fetchProductDetails()
            ]);

            setShowFeedbackForm(false);

        } catch (error) {
            console.error('Error submitting feedback:', error);
            toast.error(`Failed to submit feedback: ${error.message}`);
        } finally {
            setSubmittingFeedback(false);
        }
    };

    // Delete feedback (admin only)
    const handleDeleteFeedback = async (feedbackId) => {
        if (!isAdmin) {
            toast.error('You do not have permission to delete feedback');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
            return;
        }

        setDeletingFeedback(feedbackId);
        try {
            const { error } = await supabase
                .from('product_feedback')
                .delete()
                .eq('id', feedbackId);

            if (error) throw error;

            toast.success('Feedback deleted successfully!');

            await Promise.all([
                fetchFeedbackStats(),
                fetchAllFeedbacks(),
                fetchUserFeedback(),
                fetchProductDetails()
            ]);
        } catch (error) {
            console.error('Error deleting feedback:', error);
            toast.error('Failed to delete feedback');
        } finally {
            setDeletingFeedback(null);
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
                const { error: updateError } = await supabase
                    .from('cart_items')
                    .update({ quantity: existingItem.quantity + 1 })
                    .eq('id', existingItem.id);

                if (updateError) throw updateError;
                toast.success("Product quantity updated in cart!");
            } else {
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

            setAddedItems((prev) => [...prev, productId]);
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
                const { error: deleteError } = await supabase
                    .from('wishlist_items')
                    .delete()
                    .eq('id', existingItem.id);

                if (deleteError) throw deleteError;

                setWishItems(wishItems.filter(id => id !== productId));
                toast.success("Product removed from wishlist!");
            } else {
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

        } catch (error) {
            console.error('Error updating wishlist:', error);
            toast.error('Failed to update wishlist');
        }
    };

    useEffect(() => {
        if (id) {
            fetchProductDetails();
            fetchFeedbackStats();
            fetchAllFeedbacks();
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [id]);

    useEffect(() => {
        if (id && user) {
            fetchUserFeedback();
        } else {
            setUserFeedback(null);
        }
    }, [id, user]);

    useEffect(() => {
        document.title = product?.title ? `${product.title} - SportFlex Store` : 'Product Details';
    }, [product]);

    const sliderSettings = {
        dots: false,
        infinite: allImages.length > 1,
        speed: 600,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: allImages.length > 1,
        autoplaySpeed: 3000,
        fade: true,
        arrows: false,
        adaptiveHeight: true,
        beforeChange: (current, next) => setActiveImageIndex(next)
    };

    // Render star rating
    const renderStars = (rating, size = 'text-base') => {
        return (
            <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                    <i
                        key={star}
                        className={`${star <= rating ? 'fas fa-star text-amber-500' : 'far fa-star text-gray-300'} ${size} mx-0.5`}
                    />
                ))}
            </div>
        );
    };

    // Calculate rating percentages
    const calculateRatingPercentage = (count) => {
        if (feedbackStats.total_reviews === 0) return 0;
        return Math.round((count / feedbackStats.total_reviews) * 100);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading product details...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-gray-400 mb-4">
                        <i className="fas fa-box-open text-6xl"></i>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-3">Product Not Found</h3>
                    <p className="text-gray-500 mb-6">The product you're looking for doesn't exist.</p>
                    <button
                        onClick={() => navigate('/products')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-teal-600 transition"
                    >
                        Browse Products
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <section className='py-4 md:py-8 lg:py-16 px-4 sm:px-6 md:px-8 lg:px-30 lg:ms-10'>
                {/* Mobile & Tablet Layout */}
                <div className='block lg:hidden'>
                    {/* Product Images Section - Mobile Optimized */}
                    <div className="mb-6">
                        {/* Main Image Slider */}
                        <div className='w-full h-[280px] sm:h-[350px] relative mb-4'>
                            {allImages.length > 0 ? (
                                <Slider {...sliderSettings} ref={sliderRef}>
                                    {allImages.map((image, index) => (
                                        <div key={image.id} className='rounded-xl overflow-hidden'>
                                            <img
                                                className='object-cover w-full h-[280px] sm:h-[350px]'
                                                src={image.image_url}
                                                alt={`Product image ${index + 1}`}
                                                onError={(e) => {
                                                    e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop';
                                                }}
                                            />
                                        </div>
                                    ))}
                                </Slider>
                            ) : (
                                <div className='w-full h-[280px] sm:h-[350px] rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center'>
                                    <i className="fas fa-image text-5xl text-gray-300"></i>
                                </div>
                            )}

                            {/* Image Indicator Dots */}
                            {allImages.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                                    {allImages.map((_, index) => (
                                        <div
                                            key={index}
                                            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === activeImageIndex ? 'bg-white scale-125' : 'bg-white/50'}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Thumbnail Strip - Horizontal Scroll for Mobile */}
                        {allImages.length > 1 && (
                            <div className="flex space-x-3 overflow-x-auto pb-4 -mx-4 px-4">
                                {allImages.map((image, index) => (
                                    <button
                                        key={image.id}
                                        onClick={() => {
                                            sliderRef.current.slickGoTo(index);
                                            setActiveImageIndex(index);
                                        }}
                                        className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-300 ${activeImageIndex === index ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}
                                    >
                                        <img
                                            className='w-20 h-20 object-cover'
                                            src={image.image_url}
                                            alt={`Thumbnail ${index + 1}`}
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info Card - Mobile Optimized */}
                    <div className="bg-white rounded-2xl shadow-sm p-5 mb-8">
                        {/* Category Badge */}
                        <div className="mb-3">
                            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                                {product.category?.name}
                            </span>
                        </div>

                        {/* Product Title */}
                        <h1 className='text-xl sm:text-2xl font-bold text-gray-900 mb-2 leading-tight'>{product.title}</h1>

                        {/* Rating & Stock Status */}
                        <div className='flex items-center justify-between mb-4'>
                            <div className="flex items-center">
                                {renderStars(feedbackStats.average_rating, 'text-sm sm:text-base')}
                                <span className="ml-2 text-sm text-gray-600">
                                    ({feedbackStats.average_rating.toFixed(1)})
                                </span>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${product.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                            </div>
                        </div>

                        {/* Price */}
                        <div className="mb-4">
                            <div className="text-2xl sm:text-3xl font-bold text-blue-600">EGP {product.price.toFixed(2)}</div>
                            {product.stock > 0 && product.stock <= 10 && (
                                <div className="text-sm text-amber-600 font-medium mt-1">
                                    <i className="fas fa-bolt mr-1"></i>
                                    Only {product.stock} left
                                </div>
                            )}
                        </div>

                        {/* Description - Expanded on Mobile */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-gray-700">Description</h3>
                                <span className="text-xs text-blue-500 font-medium">Details</span>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {product.description}
                            </p>
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-gradient-to-r from-blue-100 to-teal-100 mb-6"></div>

                        {/* Action Buttons - Optimized without delivery section */}
                        <div className='flex gap-3'>
                            <button
                                onClick={() => handleAddToCart(product._id)}
                                disabled={addedItems.includes(product._id) || product.stock <= 0}
                                className={`flex-1 py-3.5 rounded-xl transition-all duration-300 text-base font-semibold flex items-center justify-center gap-2
                                    ${addedItems.includes(product._id)
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : product.stock <= 0
                                            ? "bg-red-100 text-red-400 cursor-not-allowed"
                                            : "bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:from-blue-600 hover:to-teal-600 active:scale-[0.98]"}`}
                            >
                                {addedItems.includes(product._id) ? (
                                    <>
                                        <i className="fas fa-check"></i>
                                        Added
                                    </>
                                ) : product.stock <= 0 ? (
                                    <>
                                        <i className="fas fa-times"></i>
                                        Out of Stock
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-shopping-cart"></i>
                                        Add to Cart
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => handleWishlistAction(product._id)}
                                className={`w-14 flex items-center justify-center rounded-xl border-2 transition-all duration-300 active:scale-95
                                    ${wishItems.includes(product._id)
                                        ? "bg-gradient-to-r from-rose-50 to-pink-50 border-rose-400 text-rose-500"
                                        : "border-gray-300 text-gray-500 hover:text-rose-500 hover:border-rose-400 hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50"
                                    }`}
                            >
                                <i className={`fa-solid fa-heart text-lg ${wishItems.includes(product._id) ? 'fas' : 'far'}`}></i>
                            </button>
                        </div>

                        {/* Image Count - Moved closer to buttons */}
                        {allImages.length > 1 && (
                            <div className="mt-4 text-center">
                                <p className="text-xs text-gray-500">
                                    {allImages.length} image{allImages.length !== 1 ? 's' : ''} available • Swipe to view
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Large Screen Layout - Adjusted without delivery section */}
                <div className='hidden lg:flex flex-col lg:flex-row gap-8 md:gap-10'>
                    {/* Thumbnail Images */}
                    <div className='flex flex-row justify-center lg:flex-col gap-3 md:gap-4 order-2 lg:order-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0'>
                        {allImages.slice(0, 4).map((image, index) => (
                            <div
                                key={image.id}
                                onClick={() => {
                                    sliderRef.current.slickGoTo(index);
                                    setMainImage(image.image_url);
                                }}
                                className='rounded-lg flex-shrink-0 flex items-center justify-center hover:scale-[1.02] transition-transform duration-300'
                            >
                                <img
                                    className={`w-[120px] h-[120px] md:w-[140px] md:h-[140px] lg:w-[170px] lg:h-[138px] object-cover cursor-pointer border-2 ${mainImage === image.image_url ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'} hover:border-blue-400 transition-all duration-300`}
                                    src={image.image_url}
                                    alt={`Thumbnail ${index + 1}`}
                                    onError={(e) => {
                                        e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop';
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Main Image Slider */}
                    <div className='w-full lg:w-[520px] h-auto lg:h-[600px] order-1 lg:order-2'>
                        {allImages.length > 0 ? (
                            <Slider {...sliderSettings} ref={sliderRef}>
                                {allImages.map((image, index) => (
                                    <div key={image.id} className='rounded-xl overflow-hidden'>
                                        <img
                                            className='object-cover w-full h-[500px] lg:w-[520px] lg:h-[600px]'
                                            src={image.image_url}
                                            alt={`Product image ${index + 1}`}
                                            onError={(e) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop';
                                            }}
                                        />
                                    </div>
                                ))}
                            </Slider>
                        ) : (
                            <div className='w-full h-[500px] lg:w-[520px] lg:h-[600px] rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center'>
                                <i className="fas fa-image text-5xl text-gray-300"></i>
                            </div>
                        )}
                    </div>

                    {/* Product Info - Adjusted layout */}
                    <div className='ms-0 lg:ms-8 order-3 w-full lg:w-[420px]'>
                        <div className="mb-4">
                            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-sm font-medium rounded-full mb-3">
                                {product.category?.name}
                            </span>
                            <h1 className='text-2xl lg:text-3xl text-gray-900 font-bold leading-tight'>{product.title}</h1>
                        </div>

                        {/* Rating & Stock - Improved layout */}
                        <div className='flex items-center mb-6'>
                            <div className="flex items-center">
                                {renderStars(feedbackStats.average_rating, 'text-lg')}
                                <div className="ml-3">
                                    <p className='text-gray-700 text-sm font-medium'>
                                        {feedbackStats.average_rating.toFixed(1)} • {feedbackStats.total_reviews} review{feedbackStats.total_reviews !== 1 ? 's' : ''}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className={`text-sm font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                                        </span>
                                        {product.stock > 0 && product.stock <= 10 && (
                                            <>
                                                <span className="text-gray-300">•</span>
                                                <span className='text-sm text-amber-600 font-medium'>
                                                    Only {product.stock} left
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Price Section */}
                        <div className="mb-6">
                            <div className="text-3xl lg:text-4xl font-bold text-blue-600 mb-2">EGP {product.price.toFixed(2)}</div>
                            <div className="h-px bg-gradient-to-r from-blue-100 to-teal-100"></div>
                        </div>

                        {/* Description */}
                        <div className='mb-8'>
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Product Description</h3>
                            <p className='text-gray-700 leading-relaxed'>{product.description}</p>
                        </div>

                        {/* Action Buttons - Centered and improved */}
                        <div className='flex items-center gap-4 mb-6'>
                            <button
                                onClick={() => handleAddToCart(product._id)}
                                disabled={addedItems.includes(product._id) || product.stock <= 0}
                                className={`flex-1 py-4 rounded-xl transition-all duration-300 text-lg font-semibold flex items-center justify-center gap-3
                                        ${addedItems.includes(product._id)
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : product.stock <= 0
                                            ? "bg-red-100 text-red-400 cursor-not-allowed"
                                            : "bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:from-blue-600 hover:to-teal-600 hover:shadow-lg active:scale-[0.98]"}`}
                            >
                                {addedItems.includes(product._id)
                                    ? (
                                        <>
                                            <i className="fas fa-check"></i>
                                            Added to Cart
                                        </>
                                    )
                                    : product.stock <= 0
                                        ? (
                                            <>
                                                <i className="fas fa-times"></i>
                                                Out of Stock
                                            </>
                                        )
                                        : (
                                            <>
                                                <i className="fas fa-shopping-cart"></i>
                                                Add to Cart
                                            </>
                                        )}
                            </button>

                            <button
                                onClick={() => handleWishlistAction(product._id)}
                                className={`w-16 h-16 flex items-center justify-center rounded-xl border-2 transition-all duration-300 hover:scale-110 active:scale-95
                                    ${wishItems.includes(product._id)
                                        ? "bg-gradient-to-r from-rose-50 to-pink-50 border-rose-400 text-rose-500"
                                        : "border-gray-300 text-gray-500 hover:text-rose-500 hover:border-rose-400 hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50"
                                    }`}
                            >
                                <i className={`fa-solid fa-heart text-xl ${wishItems.includes(product._id) ? 'fas' : 'far'}`}></i>
                            </button>
                        </div>

                        {/* Image Count */}
                        {allImages.length > 1 && (
                            <div className="text-center">
                                <p className="text-sm text-gray-500">
                                    {allImages.length} high-quality images available
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* FEEDBACK SECTION - Responsive Design */}
                <div className="mt-8 lg:mt-12 max-w-4xl mx-auto">
                    <div className="border-t border-gray-200 pt-6 lg:pt-8">
                        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-4 lg:mb-6 px-4 lg:px-0">Customer Reviews</h2>

                        {/* Overall Rating Summary */}
                        <div className="bg-white rounded-2xl shadow-sm p-5 lg:p-6 mb-6 mx-4 lg:mx-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                                <div className="text-center md:text-left">
                                    <div className="flex flex-col items-center md:items-start">
                                        <div className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                                            {feedbackStats.average_rating.toFixed(1)}
                                        </div>
                                        <div className="mb-3">
                                            {renderStars(feedbackStats.average_rating, 'text-lg lg:text-xl')}
                                        </div>
                                        <div className="text-gray-600 text-sm">
                                            {feedbackStats.total_reviews} review{feedbackStats.total_reviews !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <div className="space-y-3">
                                        {[5, 4, 3, 2, 1].map((star) => {
                                            const countKey = `${star}_star_count`;
                                            const count = feedbackStats[countKey] || 0;
                                            const percentage = calculateRatingPercentage(count);

                                            if (percentage === 0) return null;

                                            return (
                                                <div key={star} className="flex items-center">
                                                    <div className="w-14 lg:w-20 flex items-center justify-end">
                                                        <span className="text-sm text-gray-700 font-medium mr-2">
                                                            {star}
                                                        </span>
                                                        <i className="fas fa-star text-amber-400 text-sm"></i>
                                                    </div>
                                                    <div className="flex-1 mx-3">
                                                        <div className="h-2 lg:h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="w-12 lg:w-16 text-right">
                                                        <span className="text-sm font-medium text-gray-700">
                                                            {count}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Add Your Review Button */}
                        <div className="mb-6 px-4 lg:px-0">
                            {!userFeedback ? (
                                <button
                                    onClick={() => setShowFeedbackForm(true)}
                                    className="w-full sm:w-auto flex items-center justify-center px-5 py-3.5 bg-gradient-to-r from-blue-500 to-teal-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-teal-600 active:scale-[0.98] transition-all duration-300 shadow-sm"
                                >
                                    <i className="fas fa-pen mr-2"></i>
                                    Write a Review
                                </button>
                            ) : (
                                <div className="bg-gradient-to-r from-blue-50 to-teal-50 p-4 rounded-xl border border-blue-100">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center mb-2">
                                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                                                    <i className="fas fa-user text-sm"></i>
                                                </div>
                                                <h3 className="font-medium text-gray-900">Your Review</h3>
                                                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                    <i className="fas fa-check mr-1"></i>
                                                    Submitted
                                                </span>
                                            </div>
                                            <div className="flex items-center flex-wrap gap-2">
                                                {renderStars(userFeedback.rating, 'text-sm')}
                                                {userFeedback.comment && (
                                                    <span className="text-sm text-gray-600 truncate max-w-[200px]">
                                                        "{userFeedback.comment.substring(0, 50)}..."
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-3 sm:mt-0">
                                            <button
                                                onClick={() => setShowFeedbackForm(true)}
                                                className="w-full sm:w-auto px-4 py-2 text-sm bg-white border border-blue-200 text-blue-600 font-medium rounded-lg hover:bg-blue-50 active:scale-95 transition-all"
                                            >
                                                <i className="fas fa-edit mr-1"></i>
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Feedback Form */}
                        {showFeedbackForm && (
                            <div className="bg-white rounded-xl border border-gray-200 mb-6 mx-4 lg:mx-0">
                                <div className="p-5 lg:p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg lg:text-xl font-semibold text-gray-900">
                                            {userFeedback ? 'Edit Your Review' : 'Write Your Review'}
                                        </h3>
                                        <button
                                            onClick={() => {
                                                setShowFeedbackForm(false);
                                                if (!userFeedback) {
                                                    setFeedbackRating(5);
                                                    setFeedbackComment('');
                                                }
                                            }}
                                            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                                        >
                                            <i className="fas fa-times text-lg"></i>
                                        </button>
                                    </div>

                                    {/* Star Rating Input */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            How would you rate this product?
                                        </label>
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center space-x-1 lg:space-x-2 mb-2">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setFeedbackRating(star)}
                                                        className="p-1"
                                                    >
                                                        <i
                                                            className={`text-2xl lg:text-3xl transition-all duration-200 ${star <= feedbackRating
                                                                ? 'fas fa-star text-amber-500 transform scale-110'
                                                                : 'far fa-star text-gray-300 hover:text-amber-300 hover:scale-110'}`}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="flex items-center mt-2">
                                                <span className="text-lg font-bold text-amber-600 mr-2">
                                                    {feedbackRating}.0
                                                </span>
                                                <span className="text-sm text-gray-600">
                                                    out of 5 stars
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Comment Input */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Share your experience (Optional)
                                        </label>
                                        <div className="relative">
                                            <textarea
                                                value={feedbackComment}
                                                onChange={(e) => setFeedbackComment(e.target.value)}
                                                placeholder="What did you like or dislike? Would you recommend this product to others?"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200 text-sm lg:text-base"
                                                rows="4"
                                                maxLength="1000"
                                            />
                                            <div className="absolute bottom-3 right-3">
                                                <div className={`text-xs px-2 py-1 rounded ${feedbackComment.length > 800 ? 'text-amber-600 bg-amber-50' : 'text-gray-500 bg-gray-100'}`}>
                                                    {feedbackComment.length}/1000
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Form Actions */}
                                    <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => {
                                                setShowFeedbackForm(false);
                                                if (!userFeedback) {
                                                    setFeedbackRating(5);
                                                    setFeedbackComment('');
                                                }
                                            }}
                                            className="w-full sm:w-auto px-5 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-95 transition-all duration-200 font-medium"
                                            disabled={submittingFeedback}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSubmitFeedback}
                                            disabled={submittingFeedback || feedbackRating < 1}
                                            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-500 to-teal-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-teal-600 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                        >
                                            {submittingFeedback ? (
                                                <>
                                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                                    Submitting...
                                                </>
                                            ) : userFeedback ? (
                                                <>
                                                    <i className="fas fa-save mr-2"></i>
                                                    Update Review
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-paper-plane mr-2"></i>
                                                    Submit Review
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Customer Reviews List */}
                        <div className="mt-6 lg:mt-8 px-4 lg:px-0">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                                <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-3 sm:mb-0">
                                    Customer Reviews
                                    <span className="text-gray-500 text-base lg:text-lg font-normal ml-2">
                                        ({allFeedbacks.length})
                                    </span>
                                </h3>
                                {allFeedbacks.length > 0 && (
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-600 hidden sm:block">Sort by:</span>
                                        <select
                                            value={sortBy}
                                            onChange={handleSortChange}
                                            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
                                        >
                                            <option value="most_recent">Most Recent</option>
                                            <option value="highest_rating">Highest Rating</option>
                                            <option value="lowest_rating">Lowest Rating</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {loadingFeedback ? (
                                <div className="text-center py-8">
                                    <div className="inline-flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                        <div className="ml-3 text-left">
                                            <p className="text-gray-700 font-medium">Loading reviews...</p>
                                        </div>
                                    </div>
                                </div>
                            ) : allFeedbacks.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                                        <i className="fas fa-comment-alt text-xl text-blue-500"></i>
                                    </div>
                                    <h4 className="text-base font-semibold text-gray-700 mb-2">No reviews yet</h4>
                                    <p className="text-gray-600 text-sm px-4 mb-6">
                                        Be the first to share your thoughts!
                                    </p>
                                    <button
                                        onClick={() => setShowFeedbackForm(true)}
                                        className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-teal-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-teal-600 active:scale-[0.98] transition-all"
                                    >
                                        <i className="fas fa-pen mr-2"></i>
                                        Write First Review
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {allFeedbacks.slice(0, 5).map((feedback) => (
                                        <div key={feedback.feedback_id || feedback.id}
                                            className="bg-white rounded-xl border border-gray-200 p-4 lg:p-5 hover:border-blue-200 transition-all duration-300">
                                            <div className="flex justify-between">
                                                <div className="flex items-start">
                                                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-100 to-teal-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-base lg:text-lg">
                                                        {feedback.user_name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <div className="ml-3 lg:ml-4">
                                                        <div className="flex flex-wrap items-center gap-1 lg:gap-2 mb-1">
                                                            <h4 className="font-semibold text-gray-900 text-sm lg:text-base">
                                                                {feedback.user_name}
                                                            </h4>
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 lg:gap-2">
                                                            <div className="flex items-center">
                                                                {renderStars(feedback.rating, 'text-xs lg:text-sm')}
                                                                <span className="text-sm font-medium text-gray-700 ml-2">
                                                                    {feedback.rating}.0
                                                                </span>
                                                            </div>
                                                            <span className="text-sm text-gray-500">
                                                                {feedback.time_ago || getTimeAgo(feedback.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Admin Delete Button */}
                                                {isAdmin && (
                                                    <div className="flex-shrink-0 ml-4">
                                                        <button
                                                            onClick={() => handleDeleteFeedback(feedback.feedback_id || feedback.id)}
                                                            disabled={deletingFeedback === (feedback.feedback_id || feedback.id)}
                                                            className="p-2 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Delete this feedback"
                                                        >
                                                            {deletingFeedback === (feedback.feedback_id || feedback.id) ? (
                                                                <i className="fas fa-spinner fa-spin"></i>
                                                            ) : (
                                                                <i className="fas fa-trash"></i>
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {feedback.comment && (
                                                <div className="mt-3 lg:mt-4">
                                                    <p className="text-gray-700 text-sm lg:text-base leading-relaxed">
                                                        {feedback.comment}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Load More Button */}
                            {allFeedbacks.length > 5 && (
                                <div className="mt-6 text-center">
                                    <button className="w-full sm:w-auto px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 active:scale-95 transition-all duration-200">
                                        <i className="fas fa-chevron-down mr-2"></i>
                                        Load More Reviews
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}