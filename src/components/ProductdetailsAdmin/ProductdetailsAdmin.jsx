import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../../supabaseClient';
import {
    FaArrowLeft,
    FaEdit,
    FaTrash,
    FaBox,
    FaTag,
    FaMoneyBill,
    FaTruck,
    FaCalendar,
    FaImage,
    FaStar,
    FaSpinner,
    FaShoppingCart,
    FaTimes,
    FaChevronLeft,
    FaChevronRight
} from 'react-icons/fa';

export default function ProductDetailsAdmin() {
    let { id } = useParams();
    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme ? savedTheme === 'dark' : true;
    });

    const [product, setProduct] = useState(null);
    const [mainImage, setMainImage] = useState('');
    const [allImages, setAllImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

    // Fetch product details
    const fetchProductDetails = async () => {
        try {
            setLoading(true);

            // Get product with categories
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
                navigate('/admin');
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
                id: productData.id,
                title: productData.title,
                description: productData.description,
                category: {
                    name: productData.categories?.name || productData.category || 'Uncategorized',
                    id: productData.category_id || productData.category
                },
                price: parseFloat(productData.price),
                stock: productData.stock,
                imageCover: productData.image_url,
                created_at: productData.created_at,
                updated_at: productData.updated_at,
                sales: productData.sales || 0,
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

    const handleDeleteProduct = async () => {
        if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;

        try {
            // Delete associated images first
            const { error: imagesError } = await supabase
                .from('product_images')
                .delete()
                .eq('product_id', id);

            if (imagesError) throw imagesError;

            // Delete product
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Product deleted successfully');
            navigate('/admin');
        } catch (error) {
            console.error('Error deleting product:', error);
            toast.error('Failed to delete product');
        }
    };

    const handleEditProduct = () => {
        navigate(`/editproductdetailsadmin/${id}`);
    };

    const handlePreviousImage = () => {
        if (allImages.length === 0) return;
        const newIndex = currentImageIndex === 0 ? allImages.length - 1 : currentImageIndex - 1;
        setCurrentImageIndex(newIndex);
        setMainImage(allImages[newIndex].image_url);
    };

    const handleNextImage = () => {
        if (allImages.length === 0) return;
        const newIndex = currentImageIndex === allImages.length - 1 ? 0 : currentImageIndex + 1;
        setCurrentImageIndex(newIndex);
        setMainImage(allImages[newIndex].image_url);
    };

    useEffect(() => {
        if (id) {
            fetchProductDetails();
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [id]);

    useEffect(() => {
        document.title = product?.title ? `${product.title} - Admin Panel` : 'Product Details - Admin';
    }, [product]);

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors duration-300
                ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                <div className="text-center">
                    <FaSpinner className={`animate-spin text-4xl mx-auto mb-4 ${isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}`} />
                    <p className={`font-medium transition-colors duration-300 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading product details...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className={`min-h-screen flex items-center justify-center transition-colors duration-300
                ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                <div className="text-center">
                    <div className={`mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                        <FaBox className="text-6xl mx-auto" />
                    </div>
                    <h3 className={`text-xl font-semibold mb-3 transition-colors duration-300
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Product Not Found</h3>
                    <p className={`mb-6 transition-colors duration-300
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>The product you're looking for doesn't exist.</p>
                    <button
                        onClick={() => navigate('/admin')}
                        className={`px-6 py-3 text-white font-medium rounded-lg transition-colors duration-300
                            ${isDarkMode
                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
                                : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'}`}
                    >
                        Go Back to Admin
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen py-8 transition-colors duration-300
            ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/admin')}
                        className={`flex items-center gap-2 transition-colors duration-300
                            ${isDarkMode ? 'text-gray-400 hover:text-cyan-400' : 'text-gray-600 hover:text-cyan-700'}`}
                    >
                        <FaArrowLeft /> Back to Admin Panel
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className={`text-2xl md:text-3xl font-bold transition-colors duration-300
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Product Details</h1>
                    <div className="flex gap-3">
                        <button
                            onClick={handleEditProduct}
                            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-all duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
                                    : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'}`}
                        >
                            <FaEdit /> Edit Product
                        </button>
                        <button
                            onClick={handleDeleteProduct}
                            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-all duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
                                    : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700'}`}
                        >
                            <FaTrash /> Delete
                        </button>
                    </div>
                </div>

                {/* Product Details Card */}
                <div className={`rounded-2xl shadow-xl overflow-hidden border transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-8">
                        {/* Product Images */}
                        <div className="space-y-4">
                            {/* Main Image */}
                            <div className={`relative h-64 md:h-96 rounded-xl overflow-hidden
                                ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                {allImages.length > 0 ? (
                                    <>
                                        <img
                                            src={mainImage}
                                            alt={product.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.src = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop';
                                            }}
                                        />
                                        {allImages.length > 1 && (
                                            <>
                                                <button
                                                    onClick={handlePreviousImage}
                                                    className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center border transition-colors
                                                        ${isDarkMode
                                                            ? 'bg-gray-800/80 border-gray-700 hover:bg-gray-700'
                                                            : 'bg-white/80 border-gray-200 hover:bg-gray-100'}`}
                                                >
                                                    <FaChevronLeft className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
                                                </button>
                                                <button
                                                    onClick={handleNextImage}
                                                    className={`absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center border transition-colors
                                                        ${isDarkMode
                                                            ? 'bg-gray-800/80 border-gray-700 hover:bg-gray-700'
                                                            : 'bg-white/80 border-gray-200 hover:bg-gray-100'}`}
                                                >
                                                    <FaChevronRight className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
                                                </button>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <FaImage className={`text-4xl ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                                    </div>
                                )}
                            </div>

                            {/* Thumbnail Images */}
                            {allImages.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {allImages.map((image, index) => (
                                        <button
                                            key={image.id}
                                            onClick={() => {
                                                setCurrentImageIndex(index);
                                                setMainImage(image.image_url);
                                            }}
                                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors
                                                ${currentImageIndex === index
                                                    ? isDarkMode ? 'border-cyan-500' : 'border-cyan-700'
                                                    : isDarkMode ? 'border-gray-700 hover:border-cyan-400' : 'border-gray-200 hover:border-cyan-600'
                                                }`}
                                        >
                                            <img
                                                src={image.image_url}
                                                alt={`Thumbnail ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Image Count */}
                            <div className={`flex items-center gap-2 text-sm transition-colors duration-300
                                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                <FaImage />
                                <span>{allImages.length} image{allImages.length !== 1 ? 's' : ''}</span>
                            </div>
                        </div>

                        {/* Product Information */}
                        <div className="space-y-6">
                            {/* Product Title and Category */}
                            <div>
                                <h2 className={`text-2xl md:text-3xl font-bold mb-2 transition-colors duration-300
                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{product.title}</h2>
                                <div className="flex items-center gap-2">
                                    <FaTag className={isDarkMode ? 'text-gray-500' : 'text-gray-400'} />
                                    <span className={`transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{product.category.name}</span>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-lg border transition-colors duration-300
                                    ${isDarkMode
                                        ? 'bg-gradient-to-r from-cyan-900/30 to-cyan-800/30 border-cyan-800/50'
                                        : 'bg-gradient-to-r from-cyan-50 to-cyan-100 border-cyan-200'}`}>
                                    <FaMoneyBill className={`text-xl ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`} />
                                </div>
                                <div>
                                    <p className={`text-sm transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Price</p>
                                    <p className={`text-2xl font-bold transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>EGP {product.price.toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Stock Status */}
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-lg border transition-colors duration-300
                                    ${isDarkMode
                                        ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-800/50'
                                        : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'}`}>
                                    <FaBox className={`text-xl ${isDarkMode ? 'text-green-400' : 'text-green-700'}`} />
                                </div>
                                <div>
                                    <p className={`text-sm transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Stock Status</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-lg font-semibold 
                                            ${product.stock > 10
                                                ? isDarkMode ? 'text-green-400' : 'text-green-700'
                                                : product.stock > 0
                                                    ? isDarkMode ? 'text-amber-400' : 'text-amber-700'
                                                    : isDarkMode ? 'text-red-400' : 'text-red-700'
                                            }`}>
                                            {product.stock} units available
                                        </span>
                                        {product.stock === 0 && (
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium
                                                ${isDarkMode
                                                    ? 'bg-red-900/50 text-red-300'
                                                    : 'bg-red-100 text-red-700'}`}>
                                                Out of Stock
                                            </span>
                                        )}
                                        {product.stock > 0 && product.stock <= 10 && (
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium
                                                ${isDarkMode
                                                    ? 'bg-amber-900/50 text-amber-300'
                                                    : 'bg-amber-100 text-amber-700'}`}>
                                                Low Stock
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Sales */}
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-lg border transition-colors duration-300
                                    ${isDarkMode
                                        ? 'bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-800/50'
                                        : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200'}`}>
                                    <FaShoppingCart className={`text-xl ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`} />
                                </div>
                                <div>
                                    <p className={`text-sm transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Total Sales</p>
                                    <p className={`text-lg font-semibold transition-colors duration-300
                                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{product.sales || 0} units sold</p>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-lg border transition-colors duration-300
                                        ${isDarkMode
                                            ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700'
                                            : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'}`}>
                                        <FaCalendar className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                    </div>
                                    <div>
                                        <p className={`text-sm transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Created</p>
                                        <p className={`text-sm font-medium transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {new Date(product.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-lg border transition-colors duration-300
                                        ${isDarkMode
                                            ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700'
                                            : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'}`}>
                                        <FaCalendar className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                    </div>
                                    <div>
                                        <p className={`text-sm transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Last Updated</p>
                                        <p className={`text-sm font-medium transition-colors duration-300
                                            ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {new Date(product.updated_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Product ID */}
                            <div className={`p-4 rounded-lg border transition-colors duration-300
                                ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                <p className={`text-sm mb-1 transition-colors duration-300
                                    ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Product ID</p>
                                <p className={`font-mono text-sm break-all transition-colors duration-300
                                    ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{product.id}</p>
                            </div>
                        </div>
                    </div>

                    {/* Product Description */}
                    <div className={`border-t p-6 md:p-8 transition-colors duration-300
                        ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                        <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300
                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Product Description</h3>
                        <div className="prose max-w-none">
                            <p className={`leading-relaxed whitespace-pre-line transition-colors duration-300
                                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {product.description || 'No description available for this product.'}
                            </p>
                        </div>
                    </div>

                    {/* Additional Stats */}
                    <div className={`border-t p-6 md:p-8 transition-colors duration-300
                        ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                        <h3 className={`text-lg font-semibold mb-4 transition-colors duration-300
                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Product Statistics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className={`p-4 rounded-xl border transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-br from-cyan-900/30 to-cyan-800/30 border-cyan-800/50'
                                    : 'bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200'}`}>
                                <p className={`text-sm font-medium mb-1 transition-colors duration-300
                                    ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>Inventory Value</p>
                                <p className={`text-2xl font-bold transition-colors duration-300
                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    EGP {(product.price * product.stock).toFixed(2)}
                                </p>
                            </div>
                            <div className={`p-4 rounded-xl border transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-br from-green-900/30 to-green-800/30 border-green-800/50'
                                    : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'}`}>
                                <p className={`text-sm font-medium mb-1 transition-colors duration-300
                                    ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>Potential Revenue</p>
                                <p className={`text-2xl font-bold transition-colors duration-300
                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    EGP {(product.price * product.sales || 0).toFixed(2)}
                                </p>
                            </div>
                            <div className={`p-4 rounded-xl border transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-br from-purple-900/30 to-purple-800/30 border-purple-800/50'
                                    : 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'}`}>
                                <p className={`text-sm font-medium mb-1 transition-colors duration-300
                                    ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>Stock Alert</p>
                                <p className={`text-2xl font-bold transition-colors duration-300
                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {product.stock <= 10 ? 'Low' : 'Good'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
                    <button
                        onClick={() => navigate('/admin')}
                        className={`px-6 py-3 border rounded-lg transition-colors duration-300
                            ${isDarkMode
                                ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                                : 'border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                    >
                        Back to Dashboard
                    </button>
                    <button
                        onClick={handleEditProduct}
                        className={`px-6 py-3 text-white rounded-lg transition-all duration-300
                            ${isDarkMode
                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
                                : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'}`}
                    >
                        Edit Product Details
                    </button>
                </div>
            </div>
        </div>
    );
}