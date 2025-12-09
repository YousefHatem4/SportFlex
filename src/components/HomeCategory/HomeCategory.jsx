// HomeCategory.jsx - UPDATED WITH DATABASE INTEGRATION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function HomeCategory() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Fetch categories from database
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('is_active', true)
                .order('name')
                .limit(8); // Limit to 8 categories for homepage

            if (error) throw error;

            setCategories(data || []);

        } catch (error) {
            console.error('Error fetching categories:', error);
            // Fallback to static data if database fails
            const staticCategories = [
                { id: "1", name: "Running Shoes" },
                { id: "2", name: "Basketball Gear" },
                { id: "3", name: "Yoga Wear" },
                { id: "4", name: "Training Equipment" },
                { id: "5", name: "Football Gear" },
                { id: "6", name: "Tennis Wear" },
                { id: "7", name: "Swimwear" },
                { id: "8", name: "Outdoor Sports" }
            ];
            setCategories(staticCategories);
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
            <div>
                <h3 className='font-semibold text-lg mb-4 text-gray-800'>SportFlex Categories</h3>
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <div key={n} className="my-2">
                            <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <h3 className='font-semibold text-lg mb-4 text-gray-800'>SportFlex Categories</h3>
            <ul className='space-y-2'>
                {categories.map((category) => (
                    <li
                        key={category.id}
                        onClick={() => handleCategoryClick(category.id)}
                        className='my-2 text-gray-600 hover:text-blue-500 transition-colors duration-200 cursor-pointer flex items-center gap-2 group'
                    >
                        {/* Optional icon before category name */}
                        <i className="fas fa-chevron-right text-xs text-gray-400 group-hover:text-blue-500 transition-colors duration-200"></i>
                        <span className='group-hover:translate-x-1 transition-transform duration-200'>
                            {category.name}
                        </span>
                    </li>
                ))}
            </ul>

        
        </div>
    );
}