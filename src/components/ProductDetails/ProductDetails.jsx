// ProductDetails.jsx - FIXED FEEDBACK SYSTEM
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

    // Check user session
    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        if (session?.user) {
            fetchUserCart(session.user.id);
            fetchUserWishlist(session.user.id);
        }
    };

    // Fetch product details from database
    const fetchProductDetails = async () => {
        try {
            setLoading(true);

            // Try direct query instead of function
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
            // First try to get from view
            const { data, error } = await supabase
                .from('product_feedback_stats')
                .select('*')
                .eq('product_id', id)
                .single();

            if (error) {
                // If view doesn't exist, calculate manually
                console.log('View not found, calculating manually');
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
            
            // Try to use the function first
            const { data: functionData, error: functionError } = await supabase
                .rpc('get_product_feedback', { product_uuid: id });

            if (!functionError && functionData) {
                setAllFeedbacks(functionData || []);
                return;
            }

            // If function fails, use direct query
            console.log('Function failed, using direct query:', functionError);
            
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
                .eq('product_id', id)
                .order('is_verified_purchase', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform the data to match the expected format
            const transformedFeedbacks = (feedbacks || []).map(fb => ({
                feedback_id: fb.id,
                user_id: fb.user_id,
                user_email: fb.profiles?.email || '',
                user_name: fb.profiles?.full_name || 'Anonymous User',
                user_avatar: fb.profiles?.avatar_url || '',
                rating: fb.rating,
                comment: fb.comment,
                is_verified_purchase: fb.is_verified_purchase,
                created_at: fb.created_at,
                updated_at: fb.updated_at,
                time_ago: getTimeAgo(fb.created_at)
            }));

            setAllFeedbacks(transformedFeedbacks);

        } catch (error) {
            console.error('Error fetching feedbacks:', error);
            setAllFeedbacks([]);
        } finally {
            setLoadingFeedback(false);
        }
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

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
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

    // Handle feedback submission - FIXED VERSION
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
            // Use direct insert/update instead of function
            if (userFeedback) {
                // Update existing feedback
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
                // Insert new feedback
                // First check if user has purchased this product
                const { data: purchaseData } = await supabase
                    .from('order_items')
                    .select(`
                        orders!inner(
                            user_id,
                            status
                        )
                    `)
                    .eq('product_id', id)
                    .eq('orders.user_id', user.id)
                    .eq('orders.status', 'Delivered')
                    .limit(1);

                const isVerifiedPurchase = purchaseData && purchaseData.length > 0;

                const { error } = await supabase
                    .from('product_feedback')
                    .insert({
                        product_id: id,
                        user_id: user.id,
                        rating: feedbackRating,
                        comment: feedbackComment.trim() || null,
                        is_verified_purchase: isVerifiedPurchase,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });

                if (error) throw error;
                toast.success('Thank you for your feedback!');
            }
            
            // Refresh all data
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
        adaptiveHeight: true
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
            <section className='py-5 md:py-20 px-4 sm:px-8 md:px-30 md:ms-10'>
                <div className='flex flex-col lg:flex-row gap-6 md:gap-10'>
                    {/* Thumbnail Images */}
                    <div className='flex flex-row justify-center lg:flex-col gap-2 md:gap-4 order-2 lg:order-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0'>
                        {allImages.slice(0, 4).map((image, index) => (
                            <div
                                key={image.id}
                                onClick={() => {
                                    sliderRef.current.slickGoTo(index);
                                    setMainImage(image.image_url);
                                }}
                                className='rounded-sm flex-shrink-0 flex items-center justify-center'
                            >
                                <img
                                    className={`w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[120px] md:h-[120px] lg:w-[170px] lg:h-[138px] object-cover cursor-pointer border-2 ${mainImage === image.image_url ? 'border-blue-500' : 'border-gray-200'} hover:border-blue-400 transition-colors duration-300`}
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
                    <div className='w-full lg:w-[500px] h-auto lg:h-[600px] order-1 lg:order-2'>
                        {allImages.length > 0 ? (
                            <Slider {...sliderSettings} ref={sliderRef}>
                                {allImages.map((image, index) => (
                                    <div key={image.id} className='rounded-sm flex items-center justify-center'>
                                        <img
                                            className='object-cover w-full h-[300px] sm:h-[400px] md:h-[500px] lg:w-[500px] lg:h-[600px] rounded-lg'
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
                            <div className='w-full h-[300px] sm:h-[400px] md:h-[500px] lg:w-[500px] lg:h-[600px] rounded-lg bg-gray-100 flex items-center justify-center'>
                                <i className="fas fa-image text-4xl text-gray-300"></i>
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className='ms-0 lg:ms-7 order-3 w-full lg:w-auto'>
                        <h1 className='text-xl md:text-2xl text-gray-900 font-bold'>{product.title}</h1>
                        <p className='text-gray-600 mt-1'>{product.category?.name}</p>
                        
                        {/* Updated Ratings Section with Feedback Count */}
                        <div className='flex items-center mt-3 md:mt-4'>
                            {renderStars(feedbackStats.average_rating, 'text-base')}
                            <p className='text-gray-600 text-sm ms-2'>
                                ({feedbackStats.average_rating.toFixed(1)}) • {feedbackStats.total_reviews} review{feedbackStats.total_reviews !== 1 ? 's' : ''}
                            </p>
                            <span className='text-gray-400 text-sm ms-2'>|</span>
                            <span className={`text-sm ms-2 font-medium ${product.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                            {product.stock > 0 && product.stock <= 10 && (
                                <span className='text-amber-600 text-sm ms-2 font-medium'>
                                    • Only {product.stock} left
                                </span>
                            )}
                        </div>
                        
                        <h1 className='text-blue-600 text-xl md:text-2xl mt-3 md:mt-4 font-bold'>EGP {product.price.toFixed(2)}</h1>
                        <p className='text-sm text-gray-700 w-full lg:w-[373px] mt-3 md:mt-5 leading-relaxed'>{product.description}</p>
                        <div className='bg-gradient-to-r from-blue-400 to-teal-400 w-full lg:w-[400px] h-[1px] mt-3 md:mt-5'></div>

                        {/* Action Buttons */}
                        <div className='mt-6 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-6'>
                            <button
                                onClick={() => handleAddToCart(product._id)}
                                disabled={addedItems.includes(product._id) || product.stock <= 0}
                                className={`cursor-pointer flex-1 py-3 sm:py-3 rounded-lg transition-all duration-300 text-sm sm:text-base font-medium 
                                        ${addedItems.includes(product._id)
                                        ? "bg-gray-400 text-white cursor-not-allowed"
                                        : product.stock <= 0
                                            ? "bg-red-400 text-white cursor-not-allowed"
                                            : "bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:from-blue-600 hover:to-teal-600 hover:shadow-lg"}`}
                            >
                                {addedItems.includes(product._id)
                                    ? "Added to Cart"
                                    : product.stock <= 0
                                        ? "Out of Stock"
                                        : "Add to Cart"}
                            </button>

                            <button
                                onClick={() => handleWishlistAction(product._id)}
                                className={`cursor-pointer p-3 sm:p-3 rounded-full border transition-all duration-300 hover:scale-110
                                    ${wishItems.includes(product._id)
                                        ? "bg-gradient-to-r from-rose-50 to-pink-50 border-rose-400 text-rose-500"
                                        : "border-gray-300 text-gray-500 hover:text-rose-500 hover:border-rose-400 hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50"
                                    }`}
                            >
                                <i className="fa-solid fa-heart text-lg"></i>
                            </button>
                        </div>

                        {/* Image Count */}
                        {allImages.length > 1 && (
                            <div className="mt-4 text-center sm:text-left">
                                <p className="text-sm text-gray-600">
                                    {allImages.length} image{allImages.length !== 1 ? 's' : ''} available
                                </p>
                            </div>
                        )}

                        {/* Delivery Info */}
                        <div className='mt-6 md:mt-10 border border-gray-300 rounded-lg w-full lg:w-[400px] shadow-sm'>
                            <div className='flex items-center p-3 md:p-4 border-b border-gray-300'>
                                <i className="fa-solid fa-truck-fast text-lg md:text-xl text-blue-500 me-2 md:me-3"></i>
                                <div>
                                    <h2 className='text-sm font-semibold text-gray-900'>Free Delivery</h2>
                                    <p className='text-xs text-gray-600 underline cursor-pointer hover:text-blue-500 transition-colors duration-300'>
                                        Free delivery on orders over EGP 100
                                    </p>
                                </div>
                            </div>
                            <div className='flex items-center p-3 md:p-4'>
                                <i className="fa-solid fa-rotate-left text-lg md:text-xl text-blue-500 me-2 md:me-3"></i>
                                <div>
                                    <h2 className='text-sm font-semibold text-gray-900'>Return Delivery</h2>
                                    <p className="text-xs text-gray-600">
                                        Free 30 Days Delivery Returns. <span className='underline cursor-pointer hover:text-blue-500 transition-colors duration-300'>Details</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FEEDBACK SECTION */}
                <div className="mt-16 max-w-4xl mx-auto">
                    <div className="border-t border-gray-200 pt-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
                        
                        {/* Overall Rating Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                            <div className="text-center">
                                <div className="text-5xl font-bold text-gray-900 mb-2">
                                    {feedbackStats.average_rating.toFixed(1)}
                                </div>
                                <div className="mb-2">
                                    {renderStars(feedbackStats.average_rating, 'text-xl')}
                                </div>
                                <div className="text-gray-600">
                                    {feedbackStats.total_reviews} review{feedbackStats.total_reviews !== 1 ? 's' : ''}
                                </div>
                            </div>
                            
                            <div className="md:col-span-2">
                                {[5, 4, 3, 2, 1].map((star) => {
                                    const countKey = `${star}_star_count`;
                                    const count = feedbackStats[countKey] || 0;
                                    const percentage = calculateRatingPercentage(count);
                                    return (
                                        <div key={star} className="flex items-center mb-2">
                                            <div className="w-16 text-sm text-gray-600">
                                                {star} star{star !== 1 ? 's' : ''}
                                            </div>
                                            <div className="flex-1 h-2 bg-gray-200 rounded-full mx-3">
                                                <div 
                                                    className="h-full bg-amber-500 rounded-full"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <div className="w-12 text-sm text-gray-600 text-right">
                                                {count} ({percentage}%)
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Add Your Review Button */}
                        <div className="mb-8">
                            {!userFeedback ? (
                                <button
                                    onClick={() => setShowFeedbackForm(true)}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-teal-600 transition"
                                >
                                    <i className="fas fa-pen mr-2"></i>
                                    Write a Review
                                </button>
                            ) : (
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-900">Your Review</h3>
                                            <div className="flex items-center mt-1">
                                                {renderStars(userFeedback.rating)}
                                                <span className="ml-2 text-sm text-gray-600">
                                                    {userFeedback.comment ? '• ' + userFeedback.comment.substring(0, 50) + '...' : ''}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowFeedbackForm(true)}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                        >
                                            Edit Review
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Feedback Form */}
                        {showFeedbackForm && (
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    {userFeedback ? 'Edit Your Review' : 'Write Your Review'}
                                </h3>
                                
                                {/* Star Rating Input */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Your Rating
                                    </label>
                                    <div className="flex items-center space-x-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setFeedbackRating(star)}
                                                className="text-2xl focus:outline-none transition-transform hover:scale-110"
                                            >
                                                <i
                                                    className={`${star <= feedbackRating ? 'fas fa-star text-amber-500' : 'far fa-star text-gray-300'}`}
                                                />
                                            </button>
                                        ))}
                                        <span className="ml-3 text-sm text-gray-600">
                                            {feedbackRating} out of 5
                                        </span>
                                    </div>
                                </div>

                                {/* Comment Input */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Your Review (Optional)
                                    </label>
                                    <textarea
                                        value={feedbackComment}
                                        onChange={(e) => setFeedbackComment(e.target.value)}
                                        placeholder="Share your thoughts about this product..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                        rows="4"
                                        maxLength="1000"
                                    />
                                    <div className="text-xs text-gray-500 mt-1 text-right">
                                        {feedbackComment.length}/1000 characters
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={() => {
                                            setShowFeedbackForm(false);
                                            if (!userFeedback) {
                                                setFeedbackRating(5);
                                                setFeedbackComment('');
                                            }
                                        }}
                                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                        disabled={submittingFeedback}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSubmitFeedback}
                                        disabled={submittingFeedback || feedbackRating < 1}
                                        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-teal-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submittingFeedback ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                                Submitting...
                                            </>
                                        ) : userFeedback ? (
                                            'Update Review'
                                        ) : (
                                            'Submit Review'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Customer Reviews List */}
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Customer Reviews ({allFeedbacks.length})
                            </h3>
                            
                            {loadingFeedback ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                    <p className="text-gray-600">Loading reviews...</p>
                                </div>
                            ) : allFeedbacks.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-lg">
                                    <i className="fas fa-comment-alt text-3xl text-gray-300 mb-3"></i>
                                    <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {allFeedbacks.map((feedback) => (
                                        <div key={feedback.feedback_id || feedback.id} className="border-b border-gray-100 pb-6">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-teal-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                                                        {feedback.user_name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div className="ml-3">
                                                        <h4 className="font-medium text-gray-900">
                                                            {feedback.user_name}
                                                            {feedback.is_verified_purchase && (
                                                                <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                                                    <i className="fas fa-check-circle mr-1"></i>
                                                                    Verified Purchase
                                                                </span>
                                                            )}
                                                        </h4>
                                                        <div className="flex items-center text-sm text-gray-500">
                                                            {renderStars(feedback.rating, 'text-sm')}
                                                            <span className="mx-2">•</span>
                                                            <span>{feedback.time_ago || getTimeAgo(feedback.created_at)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {feedback.comment && (
                                                <div className="mt-3 text-gray-700">
                                                    {feedback.comment}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}