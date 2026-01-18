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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Loading product details...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-gray-400 mb-4">
                        <FaBox className="text-6xl mx-auto" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-3">Product Not Found</h3>
                    <p className="text-gray-500 mb-6">The product you're looking for doesn't exist.</p>
                    <button
                        onClick={() => navigate('/admin')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-teal-600 transition"
                    >
                        Go Back to Admin
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/admin')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        <FaArrowLeft /> Back to Admin Panel
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Product Details</h1>
                    <div className="flex gap-3">
                        <button
                            onClick={handleEditProduct}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-300"
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
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-8">
                        {/* Product Images */}
                        <div className="space-y-4">
                            {/* Main Image */}
                            <div className="relative h-64 md:h-96 rounded-xl overflow-hidden bg-gray-100">
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
                                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
                                                >
                                                    <FaChevronLeft className="text-gray-700" />
                                                </button>
                                                <button
                                                    onClick={handleNextImage}
                                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
                                                >
                                                    <FaChevronRight className="text-gray-700" />
                                                </button>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <FaImage className="text-4xl text-gray-300" />
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
                                            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${currentImageIndex === index ? 'border-blue-500' : 'border-gray-200'} hover:border-blue-400 transition-colors`}
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
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <FaImage />
                                <span>{allImages.length} image{allImages.length !== 1 ? 's' : ''}</span>
                            </div>
                        </div>

                        {/* Product Information */}
                        <div className="space-y-6">
                            {/* Product Title and Category */}
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{product.title}</h2>
                                <div className="flex items-center gap-2">
                                    <FaTag className="text-gray-400" />
                                    <span className="text-gray-600">{product.category.name}</span>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg">
                                    <FaMoneyBill className="text-blue-500 text-xl" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Price</p>
                                    <p className="text-2xl font-bold text-blue-600">EGP {product.price.toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Stock Status */}
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                                    <FaBox className="text-green-500 text-xl" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Stock Status</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-lg font-semibold ${product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                                            {product.stock} units available
                                        </span>
                                        {product.stock === 0 && (
                                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                                Out of Stock
                                            </span>
                                        )}
                                        {product.stock > 0 && product.stock <= 10 && (
                                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                                                Low Stock
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Sales */}
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                                    <FaShoppingCart className="text-purple-500 text-xl" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Sales</p>
                                    <p className="text-lg font-semibold text-gray-800">{product.sales || 0} units sold</p>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                                        <FaCalendar className="text-gray-500 text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Created</p>
                                        <p className="text-sm font-medium text-gray-800">
                                            {new Date(product.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                                        <FaCalendar className="text-gray-500 text-xl" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Last Updated</p>
                                        <p className="text-sm font-medium text-gray-800">
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
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Product ID</p>
                                <p className="font-mono text-sm text-gray-700 break-all">{product.id}</p>
                            </div>
                        </div>
                    </div>

                    {/* Product Description */}
                    <div className="border-t border-gray-200 p-6 md:p-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Description</h3>
                        <div className="prose max-w-none">
                            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                {product.description || 'No description available for this product.'}
                            </p>
                        </div>
                    </div>

                    {/* Additional Stats */}
                    <div className="border-t border-gray-200 p-6 md:p-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Statistics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                                <p className="text-sm text-blue-600 font-medium">Inventory Value</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    EGP {(product.price * product.stock).toFixed(2)}
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                                <p className="text-sm text-green-600 font-medium">Potential Revenue</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    EGP {(product.price * product.sales || 0).toFixed(2)}
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                                <p className="text-sm text-purple-600 font-medium">Stock Alert</p>
                                <p className="text-2xl font-bold text-gray-800">
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
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Back to Dashboard
                    </button>
                    <button
                        onClick={handleEditProduct}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-300"
                    >
                        Edit Product Details
                    </button>
                </div>
            </div>
        </div>
    );
}