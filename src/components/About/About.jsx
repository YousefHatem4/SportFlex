// About.jsx - SIMPLIFIED AND ATTRACTIVE DESIGN
import React from 'react'
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function About() {
    const stats = [
        { number: "50K+", label: "Happy Customers", icon: "fas fa-user-check" },
        { number: "1M+", label: "Orders Delivered", icon: "fas fa-shipping-fast" },
        { number: "500+", label: "Premium Brands", icon: "fas fa-crown" },
        { number: "99%", label: "Satisfaction Rate", icon: "fas fa-star" }
    ];

    const values = [
        {
            icon: "fas fa-heart",
            title: "Customer First",
            description: "Every decision we make is guided by what's best for our customers.",
            color: "from-rose-500 to-pink-500"
        },
        {
            icon: "fas fa-shield-alt",
            title: "Trust & Security",
            description: "We prioritize security and transparency in all our interactions.",
            color: "from-blue-500 to-indigo-500"
        },
        {
            icon: "fas fa-rocket",
            title: "Innovation",
            description: "We continuously evolve to bring you the latest in e-commerce.",
            color: "from-purple-500 to-pink-500"
        },
        {
            icon: "fas fa-globe",
            title: "Sustainability",
            description: "Building a better future through responsible business practices.",
            color: "from-emerald-500 to-teal-500"
        }
    ];

    const journey = [
        { year: "2020", title: "The Beginning", description: "Started with a vision to revolutionize online shopping", icon: "fas fa-seedling" },
        { year: "2021", title: "First Milestone", description: "Reached 10,000+ happy customers and 100+ brand partnerships", icon: "fas fa-flag" },
        { year: "2023", title: "Major Expansion", description: "Launched international shipping and mobile app", icon: "fas fa-plane" },
        { year: "2025", title: "Leading Innovation", description: "Now serving 50,000+ customers with cutting-edge technology", icon: "fas fa-trophy" }
    ];

    return (
        <>
            {/* Hero Section */}
            <section className='relative py-20 lg:py-28 px-5 lg:px-30 overflow-hidden'>
                {/* Background abstract shapes */}
                <div className='absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-100/40 to-transparent rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2'></div>
                <div className='absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-teal-100/30 to-transparent rounded-full blur-3xl translate-x-1/2 translate-y-1/2'></div>

                <div className='relative max-w-6xl mx-auto'>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className='text-center mb-16'
                    >
                        <div className='inline-flex items-center justify-center gap-3 mb-8'>
                            <div className='flex items-center gap-2'>
                                <span className='w-3 h-3 bg-blue-500 rounded-full animate-pulse'></span>
                                <span className='w-3 h-3 bg-teal-500 rounded-full animate-pulse delay-150'></span>
                                <span className='w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-300'></span>
                            </div>
                            <span className='text-blue-600 font-semibold tracking-wider'>OUR STORY</span>
                        </div>

                        <h1 className='text-4xl sm:text-5xl lg:text-6xl font-bold mb-8'>
                            <span className='block mb-2 text-gray-800'>Where Innovation</span>
                            <span className='bg-gradient-to-r from-blue-600 via-teal-500 to-blue-600 bg-clip-text text-transparent'>
                                Meets Excellence
                            </span>
                        </h1>

                        <p className='text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-12'>
                            We're revolutionizing e-commerce by creating meaningful connections between customers and premium brands through seamless technology and exceptional service.
                        </p>

                        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Link to='/products' className='inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-xl hover:shadow-xl transition-all duration-300 font-semibold'>
                                    <i className="fas fa-shopping-bag"></i>
                                    Start Shopping
                                </Link>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Link to='/contact' className='inline-flex items-center gap-3 px-8 py-4 bg-white border-2 border-blue-500 text-blue-500 rounded-xl hover:bg-blue-50 transition-all duration-300 font-semibold'>
                                    <i className="fas fa-envelope"></i>
                                    Contact Us
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Stats Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className='grid grid-cols-2 lg:grid-cols-4 gap-6'
                    >
                        {stats.map((stat, index) => (
                            <div key={index} className='group'>
                                <div className='bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border border-gray-100/50'>
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${index === 0 ? 'from-rose-100 to-pink-100' : index === 1 ? 'from-blue-100 to-indigo-100' : index === 2 ? 'from-amber-100 to-orange-100' : 'from-emerald-100 to-teal-100'} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                        <i className={`${stat.icon} text-lg ${index === 0 ? 'text-rose-500' : index === 1 ? 'text-blue-500' : index === 2 ? 'text-amber-500' : 'text-emerald-500'}`}></i>
                                    </div>
                                    <div className='text-3xl font-bold text-gray-900 mb-2 group-hover:scale-105 transition-transform duration-300'>
                                        {stat.number}
                                    </div>
                                    <div className='text-gray-600 font-medium'>
                                        {stat.label}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className='py-20 px-5 lg:px-30 bg-gray-50/50'>
                <div className='max-w-6xl mx-auto'>
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className='grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12'
                    >
                        {/* Mission */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className='bg-gradient-to-br from-white to-blue-50 rounded-3xl p-8 lg:p-10 shadow-lg hover:shadow-2xl transition-all duration-500 border border-blue-100'
                        >
                            <div className='flex items-center gap-4 mb-6'>
                                <div className='w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 flex items-center justify-center'>
                                    <i className="fas fa-bullseye text-white text-xl"></i>
                                </div>
                                <h3 className='text-2xl lg:text-3xl font-bold text-gray-900'>Our Mission</h3>
                            </div>
                            <p className='text-gray-700 text-lg leading-relaxed'>
                                To democratize access to premium products by connecting customers worldwide with trusted brands through a seamless, secure, and delightful shopping experience that exceeds expectations at every touchpoint.
                            </p>
                        </motion.div>

                        {/* Vision */}
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className='bg-gradient-to-br from-white to-teal-50 rounded-3xl p-8 lg:p-10 shadow-lg hover:shadow-2xl transition-all duration-500 border border-teal-100'
                        >
                            <div className='flex items-center gap-4 mb-6'>
                                <div className='w-12 h-12 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center'>
                                    <i className="fas fa-eye text-white text-xl"></i>
                                </div>
                                <h3 className='text-2xl lg:text-3xl font-bold text-gray-900'>Our Vision</h3>
                            </div>
                            <p className='text-gray-700 text-lg leading-relaxed'>
                                To become the world's most trusted e-commerce platform, where quality meets convenience, innovation drives growth, and every customer feels valued, heard, and empowered in their shopping journey.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Core Values */}
            <section className='py-20 px-5 lg:px-30 bg-white'>
                <div className='max-w-6xl mx-auto'>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className='text-center mb-16'
                    >
                        <span className='inline-block px-4 py-2 bg-gradient-to-r from-blue-100 to-teal-100 text-blue-700 rounded-full text-sm font-semibold mb-4'>
                            CORE VALUES
                        </span>
                        <h2 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-6'>
                            The Principles That Guide Us
                        </h2>
                        <p className='text-gray-600 text-lg max-w-2xl mx-auto'>
                            These foundational beliefs shape our culture and drive our decisions
                        </p>
                    </motion.div>

                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                        {values.map((value, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ scale: 1.05 }}
                                className='group'
                            >
                                <div className='bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 h-full shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100'>
                                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${value.color} flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform duration-300`}>
                                        <i className={`${value.icon} text-white text-2xl`}></i>
                                    </div>
                                    <h4 className='text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300'>
                                        {value.title}
                                    </h4>
                                    <p className='text-gray-600 leading-relaxed'>
                                        {value.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Journey Timeline */}
            <section className='py-20 px-5 lg:px-30 bg-gradient-to-b from-blue-50/30 to-teal-50/30'>
                <div className='max-w-4xl mx-auto'>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className='text-center mb-16'
                    >
                        <span className='inline-block px-4 py-2 bg-gradient-to-r from-blue-100 to-teal-100 text-blue-700 rounded-full text-sm font-semibold mb-4'>
                            OUR JOURNEY
                        </span>
                        <h2 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-6'>
                            Milestones of Growth
                        </h2>
                    </motion.div>

                    <div className='relative'>
                        {/* Vertical line */}
                        <div className='absolute left-6 lg:left-1/2 lg:-translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-300 via-teal-300 to-blue-300'></div>

                        {journey.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className={`relative mb-12 ${index % 2 === 0 ? 'lg:pr-1/2 lg:pl-12 lg:text-right' : 'lg:pl-1/2 lg:pr-12'}`}
                            >
                                {/* Circle on timeline */}
                                <div className='absolute left-6 lg:left-1/2 w-12 h-12 -translate-x-1/2 bg-white rounded-full border-4 border-blue-500 flex items-center justify-center z-10'>
                                    <i className={`${step.icon} text-blue-500`}></i>
                                </div>

                                <div className={`ml-20 lg:ml-0 ${index % 2 === 0 ? 'lg:mr-8' : 'lg:ml-8'}`}>
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        className='bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100'
                                    >
                                        <div className='inline-flex items-center gap-3 mb-4'>
                                            <span className='px-4 py-1 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-full text-sm font-bold'>
                                                {step.year}
                                            </span>
                                            <h4 className='text-xl font-bold text-gray-900'>{step.title}</h4>
                                        </div>
                                        <p className='text-gray-600'>{step.description}</p>
                                    </motion.div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Philosophy */}
            <section className='py-20 px-5 lg:px-30 bg-white'>
                <div className='max-w-4xl mx-auto'>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className='text-center mb-16'
                    >
                        <span className='inline-block px-4 py-2 bg-gradient-to-r from-blue-100 to-teal-100 text-blue-700 rounded-full text-sm font-semibold mb-4'>
                            OUR PHILOSOPHY
                        </span>
                        <h2 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-6'>
                            Simple Principles, Extraordinary Results
                        </h2>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className='bg-gradient-to-br from-blue-50 to-teal-50 rounded-3xl p-12 shadow-xl'
                    >
                        <div className='space-y-8'>
                            <div className='flex items-start gap-6'>
                                <div className='flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 flex items-center justify-center'>
                                    <i className="fas fa-check text-white text-xl"></i>
                                </div>
                                <div>
                                    <h4 className='text-xl font-bold text-gray-900 mb-3'>Quality Over Quantity</h4>
                                    <p className='text-gray-700'>We carefully curate every product to ensure it meets our high standards of quality, durability, and design.</p>
                                </div>
                            </div>

                            <div className='flex items-start gap-6'>
                                <div className='flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center'>
                                    <i className="fas fa-handshake text-white text-xl"></i>
                                </div>
                                <div>
                                    <h4 className='text-xl font-bold text-gray-900 mb-3'>Transparency First</h4>
                                    <p className='text-gray-700'>We believe in clear communication, honest pricing, and building trust through complete transparency.</p>
                                </div>
                            </div>

                            <div className='flex items-start gap-6'>
                                <div className='flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center'>
                                    <i className="fas fa-lightbulb text-white text-xl"></i>
                                </div>
                                <div>
                                    <h4 className='text-xl font-bold text-gray-900 mb-3'>Continuous Innovation</h4>
                                    <p className='text-gray-700'>We're always looking for new ways to improve our platform and enhance your shopping experience.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Final CTA */}
            <section className='py-20 px-5 lg:px-30'>
                <div className='max-w-4xl mx-auto text-center'>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className='relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-teal-500 p-12 lg:p-16'>
                            {/* Decorative elements */}
                            <div className='absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2'></div>
                            <div className='absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2'></div>

                            <h2 className='text-3xl lg:text-4xl font-bold text-white mb-6 relative z-10'>
                                Ready to Experience the Difference?
                            </h2>
                            <p className='text-xl text-white/90 mb-10 relative z-10'>
                                Join thousands of satisfied customers who trust us for their shopping needs.
                            </p>

                            <div className='flex flex-col sm:flex-row gap-4 justify-center relative z-10'>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Link to='/products' className='inline-flex items-center gap-3 px-8 py-4 bg-white text-blue-600 rounded-xl hover:bg-gray-100 transition-all duration-300 font-semibold shadow-lg'>
                                        <i className="fas fa-shopping-bag"></i>
                                        Shop Now
                                    </Link>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Link to='/contact' className='inline-flex items-center gap-3 px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl hover:bg-white/10 transition-all duration-300 font-semibold'>
                                        <i className="fas fa-comment-dots"></i>
                                        Get in Touch
                                    </Link>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>
        </>
    )
}