// ProductDetailsAdmin.jsx - ADMIN VERSION OF PRODUCT DETAILS
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

    const [product, setProduct] = useState(null);
    const [mainImage, setMainImage] = useState('');
    const [allImages, setAllImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-cyan-500 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">Loading product details...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="text-gray-600 mb-4">
                        <FaBox className="text-6xl mx-auto" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">Product Not Found</h3>
                    <p className="text-gray-400 mb-6">The product you're looking for doesn't exist.</p>
                    <button
                        onClick={() => navigate('/admin')}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition"
                    >
                        Go Back to Admin
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/admin')}
                        className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors"
                    >
                        <FaArrowLeft /> Back to Admin Panel
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Product Details</h1>
                    <div className="flex gap-3">
                        <button
                            onClick={handleEditProduct}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300"
                        >
                            <FaEdit /> Edit Product
                        </button>
                        <button
                            onClick={handleDeleteProduct}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-300"
                        >
                            <FaTrash /> Delete
                        </button>
                    </div>
                </div>

                {/* Product Details Card */}
                <div className="bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-800">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-8">
                        {/* Product Images */}
                        <div className="space-y-4">
                            {/* Main Image */}
                            <div className="relative h-64 md:h-96 rounded-xl overflow-hidden bg-gray-800">
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
                                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-700"
                                                >
                                                    <FaChevronLeft className="text-gray-300" />
                                                </button>
                                                <button
                                                    onClick={handleNextImage}
                                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gray-800/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors border border-gray-700"
                                                >
                                                    <FaChevronRight className="text-gray-300" />
                                                </button>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <FaImage className="text-4xl text-gray-600" />
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
                                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${currentImageIndex === index ? 'border-cyan-500' : 'border-gray-700'} hover:border-cyan-400 transition-colors`}
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
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <FaImage />
                                <span>{allImages.length} image{allImages.length !== 1 ? 's' : ''}</span>
                            </div>
                        </div>

                        {/* Product Information */}
                        <div className="space-y-6">
                            {/* Product Title and Category */}
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{product.title}</h2>
                                <div className="flex items-center gap-2">
                                    <FaTag className="text-gray-500" />
                                    <span className="text-gray-400">{product.category.name}</span>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-r from-cyan-900/30 to-cyan-800/30 rounded-lg border border-cyan-800/50">
                                    <FaMoneyBill className="text-cyan-400 text-xl" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Price</p>
                                    <p className="text-2xl font-bold text-cyan-400">EGP {product.price.toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Stock Status */}
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-lg border border-green-800/50">
                                    <FaBox className="text-green-400 text-xl" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Stock Status</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-lg font-semibold ${product.stock > 10 ? 'text-green-400' : product.stock > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                                            {product.stock} units available
                                        </span>
                                        {product.stock === 0 && (
                                            <span className="px-2 py-1 bg-red-900/50 text-red-300 rounded-full text-xs font-medium">
                                                Out of Stock
                                            </span>
                                        )}
                                        {product.stock > 0 && product.stock <= 10 && (
                                            <span className="px-2 py-1 bg-amber-900/50 text-amber-300 rounded-full text-xs font-medium">
                                                Low Stock
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Sales */}
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-800/50">
                                    <FaShoppingCart className="text-purple-400 text-xl" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Sales</p>
                                    <p className="text-lg font-semibold text-white">{product.sales || 0} units sold</p>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg border border-gray-700">
                                        <FaCalendar className="text-gray-400 text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Created</p>
                                        <p className="text-sm font-medium text-gray-300">
                                            {new Date(product.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg border border-gray-700">
                                        <FaCalendar className="text-gray-400 text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Last Updated</p>
                                        <p className="text-sm font-medium text-gray-300">
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
                            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                                <p className="text-sm text-gray-500 mb-1">Product ID</p>
                                <p className="font-mono text-sm text-gray-300 break-all">{product.id}</p>
                            </div>
                        </div>
                    </div>

                    {/* Product Description */}
                    <div className="border-t border-gray-800 p-6 md:p-8">
                        <h3 className="text-lg font-semibold text-white mb-4">Product Description</h3>
                        <div className="prose max-w-none">
                            <p className="text-gray-400 leading-relaxed whitespace-pre-line">
                                {product.description || 'No description available for this product.'}
                            </p>
                        </div>
                    </div>

                    {/* Additional Stats */}
                    <div className="border-t border-gray-800 p-6 md:p-8">
                        <h3 className="text-lg font-semibold text-white mb-4">Product Statistics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/30 p-4 rounded-xl border border-cyan-800/50">
                                <p className="text-sm text-cyan-400 font-medium">Inventory Value</p>
                                <p className="text-2xl font-bold text-white">
                                    EGP {(product.price * product.stock).toFixed(2)}
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 p-4 rounded-xl border border-green-800/50">
                                <p className="text-sm text-green-400 font-medium">Potential Revenue</p>
                                <p className="text-2xl font-bold text-white">
                                    EGP {(product.price * product.sales || 0).toFixed(2)}
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 p-4 rounded-xl border border-purple-800/50">
                                <p className="text-sm text-purple-400 font-medium">Stock Alert</p>
                                <p className="text-2xl font-bold text-white">
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
                        className="px-6 py-3 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                        Back to Dashboard
                    </button>
                    <button
                        onClick={handleEditProduct}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300"
                    >
                        Edit Product Details
                    </button>
                </div>
            </div>
        </div>
    );
}