import React, { useState, useCallback, memo, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FaEnvelope,
    FaPhone,
    FaMapMarkerAlt,
    FaPaperPlane,
    FaSpinner
} from 'react-icons/fa';

// Contact form component for user inquiries with Gmail integration
// Handles form state, validation, and email composition
const Contact = memo(function Contact() {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        return savedTheme ? savedTheme === 'dark' : true;
    });

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

    // Form state management with initial values
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        inquiryType: 'general'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handle input changes with proper state updates
    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    // Inquiry type mapping for labels
    const inquiryTypeLabels = useMemo(() => ({
        'general': 'General Inquiry',
        'support': 'Customer Support',
        'sales': 'Sales & Partnerships',
        'feedback': 'Feedback & Suggestions',
        'press': 'Press & Media'
    }), []);

    // Get readable label for inquiry type
    const getInquiryTypeLabel = useCallback((type) => {
        return inquiryTypeLabels[type] || 'General Inquiry';
    }, [inquiryTypeLabels]);

    // Inquiry type options for the form
    const inquiryTypes = useMemo(() => [
        { value: 'general', label: 'General Inquiry' },
        { value: 'support', label: 'Customer Support' },
        { value: 'sales', label: 'Sales & Partnerships' },
        { value: 'feedback', label: 'Feedback & Suggestions' },
        { value: 'press', label: 'Press & Media' }
    ], []);

    // Handle form submission and Gmail composition
    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Prepare email content with formatting
        const emailBody = `
Dear Yousef Hatem Developer,

You have received a new contact form submission from your website:

===========================================
CONTACT FORM DETAILS
===========================================

📋 Inquiry Type: ${getInquiryTypeLabel(formData.inquiryType)}
👤 Full Name: ${formData.name}
📧 Email Address: ${formData.email}
📞 Phone Number: ${formData.phone || 'Not provided'}
📝 Subject: ${formData.subject}

===========================================
MESSAGE
===========================================

${formData.message}

===========================================
SENDER INFORMATION
===========================================
📧 Reply to: ${formData.email}
📱 Contact: ${formData.phone || 'Phone not provided'}
⏰ Submitted: ${new Date().toLocaleString()}
🌐 Source: Website Contact Form

===========================================
Thank you for your attention!

Best regards,
${formData.name}
        `.trim();

        // Encode email content for URL
        const encodedSubject = encodeURIComponent(`[Website Contact] ${formData.subject}`);
        const encodedBody = encodeURIComponent(emailBody);

        // Create Gmail compose URL
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=yousef.hatem.developer@gmail.com&su=${encodedSubject}&body=${encodedBody}`;

        // Open Gmail in new tab with noopener for security
        window.open(gmailUrl, '_blank', 'noopener,noreferrer');

        // Reset form after submission
        const resetTimer = setTimeout(() => {
            setIsSubmitting(false);
            setFormData({
                name: '',
                email: '',
                phone: '',
                subject: '',
                message: '',
                inquiryType: 'general'
            });
        }, 1000);

        return () => clearTimeout(resetTimer);
    }, [formData, getInquiryTypeLabel]);

    // Contact information data
    const contactInfo = useMemo(() => [
        {
            icon: FaEnvelope,
            title: 'Email',
            content: 'yousef.hatem.developer@gmail.com',
            link: 'mailto:yousef.hatem.developer@gmail.com',
            color: 'cyan'
        },
        {
            icon: FaPhone,
            title: 'Phone',
            content: '+021 14082 1819',
            link: 'tel:+021140821819',
            color: 'cyan'
        },
        {
            icon: FaMapMarkerAlt,
            title: 'Location',
            content: 'Egypt',
            link: null,
            color: 'cyan'
        }
    ], []);

    return (
        // Main contact section with SEO-friendly structure
        <main
            className={`py-16 px-5 lg:px-30 transition-colors duration-300
                ${isDarkMode 
                    ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900' 
                    : 'bg-gradient-to-br from-gray-100 via-white to-gray-100'}`}
            aria-label="Contact Form Section"
        >
            <div className='max-w-4xl mx-auto'>
                {/* Page header with animated introduction */}
                <motion.header
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className='text-center mb-12'
                >
                    <div className='inline-flex items-center justify-center gap-3 mb-6'>
                        <div className='flex items-center gap-2' aria-hidden="true">
                            <span className={`w-3 h-3 rounded-full animate-pulse transition-colors duration-300
                                ${isDarkMode ? 'bg-cyan-500' : 'bg-cyan-700'}`}></span>
                            <span className={`w-3 h-3 rounded-full animate-pulse delay-150 transition-colors duration-300
                                ${isDarkMode ? 'bg-cyan-400' : 'bg-cyan-600'}`}></span>
                            <span className={`w-3 h-3 rounded-full animate-pulse delay-300 transition-colors duration-300
                                ${isDarkMode ? 'bg-cyan-500' : 'bg-cyan-700'}`}></span>
                        </div>
                        <span className={`font-semibold tracking-wider transition-colors duration-300
                            ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                            CONTACT US
                        </span>
                    </div>
                    <h1 className={`text-3xl lg:text-4xl font-bold mb-6 transition-colors duration-300
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Get in Touch
                    </h1>
                    <p className={`text-lg max-w-2xl mx-auto transition-colors duration-300
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Fill out the form and we'll open Gmail with your message ready to send
                    </p>
                </motion.header>

                {/* Contact form container */}
                <motion.article
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className={`rounded-3xl p-8 lg:p-12 shadow-xl border transition-colors duration-300
                        ${isDarkMode 
                            ? 'bg-gray-900 border-gray-800' 
                            : 'bg-white border-gray-200'}`}
                >
                    <form
                        onSubmit={handleSubmit}
                        className='space-y-6'
                        noValidate
                    >
                        {/* Inquiry type selection */}
                        <fieldset>
                            <legend className={`block text-sm font-semibold mb-3 transition-colors duration-300
                                ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                What can we help you with?
                            </legend>
                            <div className='grid grid-cols-2 lg:grid-cols-3 gap-3' role="radiogroup">
                                {inquiryTypes.map((type) => (
                                    <label
                                        key={type.value}
                                        className='relative cursor-pointer'
                                        htmlFor={`inquiry-${type.value}`}
                                    >
                                        <input
                                            type="radio"
                                            id={`inquiry-${type.value}`}
                                            name="inquiryType"
                                            value={type.value}
                                            checked={formData.inquiryType === type.value}
                                            onChange={handleInputChange}
                                            className='sr-only'
                                            aria-label={type.label}
                                        />
                                        <div className={`p-3 rounded-xl border-2 text-center text-sm font-medium transition-all duration-300 hover:scale-105 
                                            ${formData.inquiryType === type.value
                                                ? isDarkMode
                                                    ? 'border-cyan-500 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white'
                                                    : 'border-cyan-600 bg-gradient-to-r from-cyan-700 to-cyan-800 text-white'
                                                : isDarkMode
                                                    ? 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                                                    : 'border-gray-200 bg-gray-100 text-gray-600 hover:border-gray-300'
                                            }`}>
                                            {type.label}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        {/* Name and Email fields */}
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div>
                                <label
                                    htmlFor="name"
                                    className={`block text-sm font-semibold mb-2 transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                                >
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors duration-300 focus:ring-2 placeholder:text-gray-500
                                        ${isDarkMode 
                                            ? 'border-gray-700 focus:border-cyan-500 text-white bg-gray-800 focus:ring-cyan-500/20' 
                                            : 'border-gray-300 focus:border-cyan-600 text-gray-900 bg-white focus:ring-cyan-600/20'}`}
                                    placeholder='Enter your full name'
                                    aria-required="true"
                                    autoComplete="name"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="email"
                                    className={`block text-sm font-semibold mb-2 transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                                >
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors duration-300 focus:ring-2 placeholder:text-gray-500
                                        ${isDarkMode 
                                            ? 'border-gray-700 focus:border-cyan-500 text-white bg-gray-800 focus:ring-cyan-500/20' 
                                            : 'border-gray-300 focus:border-cyan-600 text-gray-900 bg-white focus:ring-cyan-600/20'}`}
                                    placeholder='your.email@example.com'
                                    aria-required="true"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Phone and Subject fields */}
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                            <div>
                                <label
                                    htmlFor="phone"
                                    className={`block text-sm font-semibold mb-2 transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                                >
                                    Phone Number (Optional)
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors duration-300 focus:ring-2 placeholder:text-gray-500
                                        ${isDarkMode 
                                            ? 'border-gray-700 focus:border-cyan-500 text-white bg-gray-800 focus:ring-cyan-500/20' 
                                            : 'border-gray-300 focus:border-cyan-600 text-gray-900 bg-white focus:ring-cyan-600/20'}`}
                                    placeholder='+20 11 4082 1819'
                                    autoComplete="tel"
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="subject"
                                    className={`block text-sm font-semibold mb-2 transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                                >
                                    Subject *
                                </label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    required
                                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors duration-300 focus:ring-2 placeholder:text-gray-500
                                        ${isDarkMode 
                                            ? 'border-gray-700 focus:border-cyan-500 text-white bg-gray-800 focus:ring-cyan-500/20' 
                                            : 'border-gray-300 focus:border-cyan-600 text-gray-900 bg-white focus:ring-cyan-600/20'}`}
                                    placeholder='Brief subject of your message'
                                    aria-required="true"
                                />
                            </div>
                        </div>

                        {/* Message textarea */}
                        <div>
                            <label
                                htmlFor="message"
                                className={`block text-sm font-semibold mb-2 transition-colors duration-300
                                    ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                            >
                                Message *
                            </label>
                            <textarea
                                id="message"
                                name="message"
                                rows="6"
                                value={formData.message}
                                onChange={handleInputChange}
                                required
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-colors duration-300 resize-none focus:ring-2 placeholder:text-gray-500
                                    ${isDarkMode 
                                        ? 'border-gray-700 focus:border-cyan-500 text-white bg-gray-800 focus:ring-cyan-500/20' 
                                        : 'border-gray-300 focus:border-cyan-600 text-gray-900 bg-white focus:ring-cyan-600/20'}`}
                                placeholder='Tell us more about your inquiry...'
                                aria-required="true"
                            ></textarea>
                        </div>

                        {/* Submit button */}
                        <div className='pt-6'>
                            <motion.button
                                type="submit"
                                disabled={isSubmitting}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 focus:outline-none focus:ring-4 disabled:opacity-75 disabled:cursor-not-allowed
                                    ${isSubmitting
                                        ? isDarkMode
                                            ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-white'
                                            : 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white'
                                        : isDarkMode
                                            ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-600 hover:to-cyan-700 shadow-lg hover:shadow-xl focus:ring-cyan-500/20'
                                            : 'bg-gradient-to-r from-cyan-700 to-cyan-800 text-white hover:from-cyan-800 hover:to-cyan-900 shadow-lg hover:shadow-xl focus:ring-cyan-700/20'
                                    }`}
                                aria-label={isSubmitting ? "Opening Gmail" : "Send message via Gmail"}
                            >
                                {isSubmitting ? (
                                    <>
                                        <FaSpinner className="animate-spin mr-2 inline" aria-hidden="true" />
                                        Opening Gmail...
                                    </>
                                ) : (
                                    <>
                                        <FaPaperPlane className="mr-2 mb-1 inline" aria-hidden="true" />
                                        Send Message via Gmail
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </form>

                    {/* Contact information section */}
                    <motion.footer
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className={`mt-12 pt-8 border-t transition-colors duration-300
                            ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}
                    >
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                            {contactInfo.map((info) => {
                                const IconComponent = info.icon;
                                return (
                                    <div
                                        key={info.title}
                                        className='text-center'
                                        itemScope
                                        itemType="https://schema.org/ContactPoint"
                                    >
                                        <div
                                            className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-r flex items-center justify-center mb-4 transition-colors duration-300
                                                ${isDarkMode 
                                                    ? 'from-cyan-900/50 to-cyan-800/50' 
                                                    : 'from-cyan-200/60 to-cyan-100/60'}`}
                                            aria-hidden="true"
                                        >
                                            <IconComponent className={`text-xl transition-colors duration-300
                                                ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`} />
                                        </div>
                                        <h2 className={`font-semibold mb-2 transition-colors duration-300
                                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {info.title}
                                        </h2>
                                        {info.link ? (
                                            <a
                                                href={info.link}
                                                className={`transition-colors duration-300
                                                    ${isDarkMode 
                                                        ? 'text-cyan-400 hover:text-cyan-300' 
                                                        : 'text-cyan-700 hover:text-cyan-800'}`}
                                                aria-label={`Contact via ${info.title}: ${info.content}`}
                                            >
                                                {info.content}
                                            </a>
                                        ) : (
                                            <p className={`transition-colors duration-300
                                                ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}>
                                                {info.content}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.footer>
                </motion.article>
            </div>
        </main>
    );
});

export default Contact;