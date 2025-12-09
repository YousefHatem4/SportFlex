// ProductDetails.jsx - UPDATED WITH DATABASE INTEGRATION
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

            // Get product with images using our function
            const { data: productData, error: productError } = await supabase
                .rpc('get_product_with_images', { product_uuid: id });

            if (productError) throw productError;

            if (!productData || productData.length === 0) {
                toast.error('Product not found');
                navigate('/products');
                return;
            }

            const product = productData[0];
            console.log('Product data:', product);

            // Combine main image with additional images
            const imagesArray = [];

            // Add main image first
            if (product.main_image_url) {
                imagesArray.push({
                    id: 'main',
                    image_url: product.main_image_url,
                    display_order: 0
                });
            }

            // Add additional images
            if (product.images && Array.isArray(product.images)) {
                product.images.forEach(img => {
                    imagesArray.push({
                        id: img.id,
                        image_url: img.image_url,
                        display_order: img.display_order || imagesArray.length
                    });
                });
            }

            // Sort by display order
            imagesArray.sort((a, b) => a.display_order - b.display_order);

            setProduct({
                _id: product.product_id,
                title: product.title,
                description: product.description,
                category: {
                    name: product.category_name || 'Uncategorized',
                    _id: product.category_id
                },
                price: parseFloat(product.price),
                ratingsAverage: product.ratings_average || 4.5,
                stock: product.stock,
                imageCover: product.main_image_url,
                images: imagesArray.map(img => img.image_url),
                allImagesData: imagesArray // Store full image data
            });

            setAllImages(imagesArray);
            if (imagesArray.length > 0) {
                setMainImage(imagesArray[0].image_url);
            }

        } catch (error) {
            console.error('Error fetching product details:', error);
            toast.error('Failed to load product details');
        } finally {
            setLoading(false);
        }
    };

    // ALTERNATIVE METHOD - Using direct queries if function doesn't work
    const fetchProductDetailsAlternative = async () => {
        try {
            setLoading(true);

            // Get product
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
                ratingsAverage: productData.ratingsAverage || 4.5,
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

        } catch (error) {
            console.error('Error updating wishlist:', error);
            toast.error('Failed to update wishlist');
        }
    };

    useEffect(() => {
        if (id) {
            fetchProductDetails();
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [id]);

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

    return <>
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
                    <div className='flex items-center mt-3 md:mt-4'>
                        <i className="fa-solid fa-star text-amber-500"></i>
                        <p className='text-gray-600 text-sm ms-2'>({product.ratingsAverage})</p>
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
                                <p className='text-xs text-gray-600'>
                                    Free 30 Days Delivery Returns. <span className='underline cursor-pointer hover:text-blue-500 transition-colors duration-300'>Details</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </>
}