import React, { memo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FaUserCheck,
    FaShippingFast,
    FaCrown,
    FaStar,
    FaHeart,
    FaShieldAlt,
    FaRocket,
    FaGlobe,
    FaSeedling,
    FaFlag,
    FaPlane,
    FaTrophy,
    FaShoppingBag,
    FaEnvelope,
    FaBullseye,
    FaEye,
    FaCheck,
    FaHandshake,
    FaLightbulb,
    FaCommentDots
} from 'react-icons/fa';

const STATS_DATA = [
    { id: 'stats-1', number: '50K+', label: 'Happy Customers', icon: FaUserCheck },
    { id: 'stats-2', number: '1M+', label: 'Orders Delivered', icon: FaShippingFast },
    { id: 'stats-3', number: '500+', label: 'Premium Brands', icon: FaCrown },
    { id: 'stats-4', number: '99%', label: 'Satisfaction Rate', icon: FaStar }
];

const VALUES_DATA = [
    {
        id: 'value-1',
        icon: FaHeart,
        title: 'Customer First',
        description: "Every decision we make is guided by what's best for our customers."
    },
    {
        id: 'value-2',
        icon: FaShieldAlt,
        title: 'Trust & Security',
        description: 'We prioritize security and transparency in all our interactions.'
    },
    {
        id: 'value-3',
        icon: FaRocket,
        title: 'Innovation',
        description: 'We continuously evolve to bring you the latest in e-commerce.'
    },
    {
        id: 'value-4',
        icon: FaGlobe,
        title: 'Sustainability',
        description: 'Building a better future through responsible business practices.'
    }
];

const JOURNEY_DATA = [
    {
        id: 'journey-1',
        year: '2020',
        title: 'The Beginning',
        description: 'Started with a vision to revolutionize online shopping',
        icon: FaSeedling
    },
    {
        id: 'journey-2',
        year: '2021',
        title: 'First Milestone',
        description: 'Reached 10,000+ happy customers and 100+ brand partnerships',
        icon: FaFlag
    },
    {
        id: 'journey-3',
        year: '2023',
        title: 'Major Expansion',
        description: 'Launched international shipping and mobile app',
        icon: FaPlane
    },
    {
        id: 'journey-4',
        year: '2025',
        title: 'Leading Innovation',
        description: 'Now serving 50,000+ customers with cutting-edge technology',
        icon: FaTrophy
    }
];

function getInitialTheme() {
    if (typeof window === 'undefined') {
        return true;
    }

    const savedTheme = window.localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true;
}

function useDarkModeState() {
    const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof document === 'undefined') {
            return undefined;
        }

        const syncTheme = () => {
            const savedTheme = window.localStorage.getItem('theme');
            const nextTheme = savedTheme
                ? savedTheme === 'dark'
                : document.documentElement.classList.contains('dark');

            setIsDarkMode((prev) => (prev === nextTheme ? prev : nextTheme));
        };

        const handleStorage = () => {
            syncTheme();
        };

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.attributeName === 'class') {
                    syncTheme();
                    break;
                }
            }
        });

        window.addEventListener('storage', handleStorage);
        observer.observe(document.documentElement, { attributes: true });

        return () => {
            window.removeEventListener('storage', handleStorage);
            observer.disconnect();
        };
    }, []);

    return isDarkMode;
}

const StatCard = memo(function StatCard({ stat, isDarkMode }) {
    const IconComponent = stat.icon;
    const statGradient = isDarkMode
        ? 'from-cyan-900/30 to-cyan-800/30'
        : 'from-cyan-200/60 to-cyan-100/60';
    const statIconColor = isDarkMode ? 'text-cyan-400' : 'text-cyan-700';

    return (
        <div className="group" role="listitem">
            <div
                className={`backdrop-blur-sm rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border
                    ${isDarkMode ? 'bg-gray-900/80 border-gray-800/50' : 'bg-white/80 border-gray-200'}`}
                aria-labelledby={`stat-${stat.id}`}
            >
                <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${statGradient} flex items-center justify-center mb-4 transition-transform duration-300`}
                    aria-hidden="true"
                >
                    <IconComponent className={`text-lg ${statIconColor}`} aria-hidden="true" />
                </div>
                <div
                    id={`stat-${stat.id}`}
                    className={`text-3xl font-bold mb-2 transition-transform duration-300
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                    {stat.number}
                </div>
                <div
                    className={`font-medium transition-colors duration-300
                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                    {stat.label}
                </div>
            </div>
        </div>
    );
});

const ValueCard = memo(function ValueCard({ value, isDarkMode, iconGradient }) {
    const IconComponent = value.icon;

    return (
        <article
            className={`rounded-2xl p-8 h-full shadow-sm hover:shadow-2xl transition-all duration-500 border
                ${isDarkMode
                    ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-800'
                    : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'}`}
            aria-labelledby={`value-title-${value.id}`}
            role="listitem"
        >
            <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${iconGradient} flex items-center justify-center mb-6 transition-transform duration-300`}
                aria-hidden="true"
            >
                <IconComponent className="text-white text-2xl" aria-hidden="true" />
            </div>
            <h3
                id={`value-title-${value.id}`}
                className={`text-xl font-bold mb-4 transition-colors duration-300
                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
                {value.title}
            </h3>
            <p
                className={`leading-relaxed transition-colors duration-300
                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            >
                {value.description}
            </p>
        </article>
    );
});

const JourneyStep = memo(function JourneyStep({ step, index, isDarkMode }) {
    const IconComponent = step.icon;
    const isEven = index % 2 === 0;

    return (
        <article
            className={`relative mb-12 ${isEven ? 'lg:pr-1/2 lg:pl-12 lg:text-right' : 'lg:pl-1/2 lg:pr-12'}`}
            aria-labelledby={`journey-step-${step.id}`}
        >
            <div
                className={`absolute left-6 lg:left-1/2 w-12 h-12 -translate-x-1/2 rounded-full border-4 flex items-center justify-center z-10 transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-900 border-cyan-500' : 'bg-white border-cyan-600'}`}
                aria-hidden="true"
            >
                <IconComponent
                    className={`text-lg transition-colors duration-300
                        ${isDarkMode ? 'text-cyan-500' : 'text-cyan-600'}`}
                    aria-hidden="true"
                />
            </div>

            <div className={`ml-20 lg:ml-0 ${isEven ? 'lg:mr-8' : 'lg:ml-8'}`}>
                <div
                    className={`rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border
                        ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
                >
                    <div className="inline-flex items-center gap-3 mb-4">
                        <time
                            dateTime={step.year}
                            className={`px-4 py-1 text-white rounded-full text-sm font-bold transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                                    : 'bg-gradient-to-r from-cyan-700 to-cyan-800'}`}
                        >
                            {step.year}
                        </time>
                        <h3
                            id={`journey-step-${step.id}`}
                            className={`text-xl font-bold transition-colors duration-300
                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                            {step.title}
                        </h3>
                    </div>
                    <p
                        className={`transition-colors duration-300
                            ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                        {step.description}
                    </p>
                </div>
            </div>
        </article>
    );
});

const PhilosophyItem = memo(function PhilosophyItem({
    title,
    description,
    icon: IconComponent,
    isDarkMode
}) {
    const iconWrapperClass = isDarkMode
        ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
        : 'bg-gradient-to-r from-cyan-700 to-cyan-800';

    return (
        <div className="flex items-start gap-6">
            <div
                className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${iconWrapperClass}`}
                aria-hidden="true"
            >
                <IconComponent className="text-white text-xl" aria-hidden="true" />
            </div>
            <div>
                <h3
                    className={`text-xl font-bold mb-3 transition-colors duration-300
                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                >
                    {title}
                </h3>
                <p
                    className={`leading-relaxed transition-colors duration-300
                        ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                >
                    {description}
                </p>
            </div>
        </div>
    );
});

function About() {
    const isDarkMode = useDarkModeState();

    const sectionBgClass = isDarkMode ? 'bg-black' : 'bg-white';
    const accentGradientClass = isDarkMode
        ? 'from-cyan-500 to-cyan-600'
        : 'from-cyan-700 to-cyan-800';
    const valueIconGradientClass = accentGradientClass;

    return (
        <main id="main-content" className={`transition-colors duration-300 ${sectionBgClass}`}>
            <section
                className={`relative py-20 lg:py-28 px-5 lg:px-30 overflow-hidden transition-colors duration-300 ${sectionBgClass}`}
                aria-labelledby="hero-title"
                role="region"
            >
                <div
                    className={`absolute top-0 left-0 w-72 h-72 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 transition-colors duration-300
                        ${isDarkMode ? 'bg-cyan-900/20' : 'bg-cyan-200/40'}`}
                    aria-hidden="true"
                    role="presentation"
                />
                <div
                    className={`absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 transition-colors duration-300
                        ${isDarkMode ? 'bg-cyan-800/20' : 'bg-cyan-200/40'}`}
                    aria-hidden="true"
                    role="presentation"
                />

                <div className="relative max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center justify-center gap-3 mb-8">
                            <div className="flex items-center gap-2" aria-hidden="true">
                                <span
                                    className={`w-3 h-3 rounded-full transition-colors duration-300
                                        ${isDarkMode ? 'bg-cyan-500' : 'bg-cyan-700'}`}
                                />
                                <span
                                    className={`w-3 h-3 rounded-full transition-colors duration-300
                                        ${isDarkMode ? 'bg-cyan-400' : 'bg-cyan-600'}`}
                                />
                                <span
                                    className={`w-3 h-3 rounded-full transition-colors duration-300
                                        ${isDarkMode ? 'bg-cyan-500' : 'bg-cyan-700'}`}
                                />
                            </div>
                            <span
                                className={`font-semibold tracking-wider transition-colors duration-300
                                    ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}
                            >
                                OUR STORY
                            </span>
                        </div>

                        <h1 id="hero-title" className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8">
                            <span
                                className={`block mb-2 transition-colors duration-300
                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                                Where Innovation
                            </span>
                            <span
                                className={`bg-gradient-to-r bg-clip-text text-transparent
                                    ${isDarkMode
                                        ? 'from-cyan-400 via-cyan-300 to-cyan-400'
                                        : 'from-cyan-700 via-cyan-600 to-cyan-700'}`}
                            >
                                Meets Excellence
                            </span>
                        </h1>

                        <p
                            className={`text-xl max-w-3xl mx-auto leading-relaxed mb-12 transition-colors duration-300
                                ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                        >
                            We're revolutionizing e-commerce by creating meaningful connections between customers and
                            premium brands through seamless technology and exceptional service.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <div>
                                <Link
                                    to="/products"
                                    className={`inline-flex items-center gap-3 px-8 py-4 text-white rounded-xl hover:shadow-xl transition-all duration-300 font-semibold focus:outline-none focus:ring-4 focus:ring-offset-2
                                        ${isDarkMode
                                            ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 focus:ring-cyan-700 focus:ring-offset-black'
                                            : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900 focus:ring-cyan-600 focus:ring-offset-white'}`}
                                    aria-label="Start shopping our premium products"
                                >
                                    <FaShoppingBag aria-hidden="true" />
                                    <span>Start Shopping</span>
                                </Link>
                            </div>
                            <div>
                                <Link
                                    to="/contact"
                                    className={`inline-flex items-center gap-3 px-8 py-4 border-2 rounded-xl transition-all duration-300 font-semibold focus:outline-none focus:ring-4 focus:ring-offset-2
                                        ${isDarkMode
                                            ? 'bg-gray-900 border-cyan-500 text-cyan-400 hover:bg-gray-800 focus:ring-cyan-700 focus:ring-offset-black'
                                            : 'bg-white border-cyan-700 text-cyan-700 hover:bg-cyan-50 focus:ring-cyan-600 focus:ring-offset-white'}`}
                                    aria-label="Contact our customer support team"
                                >
                                    <FaEnvelope aria-hidden="true" />
                                    <span>Contact Us</span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div
                        className="grid grid-cols-2 lg:grid-cols-4 gap-6"
                        role="list"
                        aria-label="Company achievements and statistics"
                    >
                        {STATS_DATA.map((stat) => (
                            <StatCard key={stat.id} stat={stat} isDarkMode={isDarkMode} />
                        ))}
                    </div>
                </div>
            </section>

            <section
                className={`py-20 px-5 lg:px-30 transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-900/50' : 'bg-gray-100/50'}`}
                aria-labelledby="mission-vision-heading"
                role="region"
            >
                <div className="max-w-6xl mx-auto">
                    <h2 id="mission-vision-heading" className="sr-only">
                        Our Mission and Vision
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                        <article
                            className={`rounded-3xl p-8 lg:p-10 shadow-lg hover:shadow-2xl transition-all duration-500 border
                                ${isDarkMode
                                    ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700'
                                    : 'bg-gradient-to-br from-white to-gray-100 border-gray-200'}`}
                            aria-labelledby="mission-title"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${accentGradientClass}`}
                                    aria-hidden="true"
                                >
                                    <FaBullseye className="text-white text-xl" aria-hidden="true" />
                                </div>
                                <h3
                                    id="mission-title"
                                    className={`text-2xl lg:text-3xl font-bold transition-colors duration-300
                                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                >
                                    Our Mission
                                </h3>
                            </div>
                            <p
                                className={`text-lg leading-relaxed transition-colors duration-300
                                    ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                            >
                                To democratize access to premium products by connecting customers worldwide with trusted
                                brands through a seamless, secure, and delightful shopping experience that exceeds
                                expectations at every touchpoint.
                            </p>
                        </article>

                        <article
                            className={`rounded-3xl p-8 lg:p-10 shadow-lg hover:shadow-2xl transition-all duration-500 border
                                ${isDarkMode
                                    ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700'
                                    : 'bg-gradient-to-br from-white to-gray-100 border-gray-200'}`}
                            aria-labelledby="vision-title"
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${accentGradientClass}`}
                                    aria-hidden="true"
                                >
                                    <FaEye className="text-white text-xl" aria-hidden="true" />
                                </div>
                                <h3
                                    id="vision-title"
                                    className={`text-2xl lg:text-3xl font-bold transition-colors duration-300
                                        ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                >
                                    Our Vision
                                </h3>
                            </div>
                            <p
                                className={`text-lg leading-relaxed transition-colors duration-300
                                    ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                            >
                                To become the world's most trusted e-commerce platform, where quality meets
                                convenience, innovation drives growth, and every customer feels valued, heard, and
                                empowered in their shopping journey.
                            </p>
                        </article>
                    </div>
                </div>
            </section>

            <section
                className={`py-20 px-5 lg:px-30 transition-colors duration-300 ${sectionBgClass}`}
                aria-labelledby="core-values-heading"
                role="region"
            >
                <div className="max-w-6xl mx-auto">
                    <header className="text-center mb-16">
                        <div
                            className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4 transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-cyan-900/50 to-cyan-800/50 text-cyan-400'
                                    : 'bg-gradient-to-r from-cyan-200/60 to-cyan-100/60 text-cyan-800'}`}
                        >
                            CORE VALUES
                        </div>
                        <h2
                            id="core-values-heading"
                            className={`text-3xl lg:text-4xl font-bold mb-6 transition-colors duration-300
                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                            The Principles That Guide Us
                        </h2>
                        <p
                            className={`text-lg max-w-2xl mx-auto transition-colors duration-300
                                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                        >
                            These foundational beliefs shape our culture and drive our decisions
                        </p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" role="list">
                        {VALUES_DATA.map((value) => (
                            <ValueCard
                                key={value.id}
                                value={value}
                                isDarkMode={isDarkMode}
                                iconGradient={valueIconGradientClass}
                            />
                        ))}
                    </div>
                </div>
            </section>

            <section
                className={`py-20 px-5 lg:px-30 transition-colors duration-300
                    ${isDarkMode
                        ? 'bg-gradient-to-b from-gray-900/30 to-gray-800/30'
                        : 'bg-gradient-to-b from-gray-100/50 to-gray-200/50'}`}
                aria-labelledby="journey-heading"
                role="region"
            >
                <div className="max-w-4xl mx-auto">
                    <header className="text-center mb-16">
                        <div
                            className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4 transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-cyan-900/50 to-cyan-800/50 text-cyan-400'
                                    : 'bg-gradient-to-r from-cyan-200/60 to-cyan-100/60 text-cyan-800'}`}
                        >
                            OUR JOURNEY
                        </div>
                        <h2
                            id="journey-heading"
                            className={`text-3xl lg:text-4xl font-bold mb-6 transition-colors duration-300
                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                            Milestones of Growth
                        </h2>
                    </header>

                    <div className="relative">
                        <div
                            className={`absolute left-6 lg:left-1/2 lg:-translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b transition-colors duration-300
                                ${isDarkMode
                                    ? 'from-cyan-700 via-cyan-600 to-cyan-700'
                                    : 'from-cyan-500 via-cyan-600 to-cyan-500'}`}
                            aria-hidden="true"
                        />

                        {JOURNEY_DATA.map((step, index) => (
                            <JourneyStep
                                key={step.id}
                                step={step}
                                index={index}
                                isDarkMode={isDarkMode}
                            />
                        ))}
                    </div>
                </div>
            </section>

            <section
                className={`py-20 px-5 lg:px-30 transition-colors duration-300 ${sectionBgClass}`}
                aria-labelledby="philosophy-heading"
                role="region"
            >
                <div className="max-w-4xl mx-auto">
                    <header className="text-center mb-16">
                        <div
                            className={`inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4 transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-cyan-900/50 to-cyan-800/50 text-cyan-400'
                                    : 'bg-gradient-to-r from-cyan-200/60 to-cyan-100/60 text-cyan-800'}`}
                        >
                            OUR PHILOSOPHY
                        </div>
                        <h2
                            id="philosophy-heading"
                            className={`text-3xl lg:text-4xl font-bold mb-6 transition-colors duration-300
                                ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                        >
                            Simple Principles, Extraordinary Results
                        </h2>
                    </header>

                    <article
                        className={`rounded-3xl p-12 shadow-xl border transition-colors duration-300
                            ${isDarkMode
                                ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700'
                                : 'bg-gradient-to-br from-white to-gray-100 border-gray-200'}`}
                    >
                        <div className="space-y-8">
                            <PhilosophyItem
                                title="Quality Over Quantity"
                                description="We carefully curate every product to ensure it meets our high standards of quality, durability, and design."
                                icon={FaCheck}
                                isDarkMode={isDarkMode}
                            />
                            <PhilosophyItem
                                title="Transparency First"
                                description="We believe in clear communication, honest pricing, and building trust through complete transparency."
                                icon={FaHandshake}
                                isDarkMode={isDarkMode}
                            />
                            <PhilosophyItem
                                title="Continuous Innovation"
                                description="We're always looking for new ways to improve our platform and enhance your shopping experience."
                                icon={FaLightbulb}
                                isDarkMode={isDarkMode}
                            />
                        </div>
                    </article>
                </div>
            </section>

            <section className="py-20 px-5 lg:px-30" aria-labelledby="cta-heading" role="region">
                <div className="max-w-4xl mx-auto text-center">
                    <div
                        className={`relative overflow-hidden rounded-3xl p-12 lg:p-16 transition-colors duration-300
                            ${isDarkMode
                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                                : 'bg-gradient-to-r from-cyan-700 to-cyan-800'}`}
                    >
                        <div
                            className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"
                            aria-hidden="true"
                        />
                        <div
                            className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full translate-x-1/2 translate-y-1/2"
                            aria-hidden="true"
                        />

                        <h2 id="cta-heading" className="text-3xl lg:text-4xl font-bold text-white mb-6 relative z-10">
                            Ready to Experience the Difference?
                        </h2>
                        <p className="text-xl text-white/90 mb-10 relative z-10">
                            Join thousands of satisfied customers who trust us for their shopping needs.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                            <div>
                                <Link
                                    to="/products"
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-all duration-300 font-semibold shadow-lg focus:outline-none focus:ring-4 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-cyan-600"
                                    aria-label="Shop now to explore our premium products"
                                >
                                    <FaShoppingBag aria-hidden="true" />
                                    <span>Shop Now</span>
                                </Link>
                            </div>
                            <div>
                                <Link
                                    to="/contact"
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl hover:bg-white/10 transition-all duration-300 font-semibold focus:outline-none focus:ring-4 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-cyan-600"
                                    aria-label="Contact our team for assistance"
                                >
                                    <FaCommentDots aria-hidden="true" />
                                    <span>Get in Touch</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default memo(About);