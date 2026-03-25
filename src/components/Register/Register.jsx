import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useFormik } from 'formik';
import { Link, useNavigate } from 'react-router-dom';
import { userContext } from '../../Context/userContext';
import { supabase } from '../../supabaseClient';
import {
    FaSpinner,
    FaEnvelope,
    FaLock,
    FaArrowRight,
    FaUser,
    FaPhone,
    FaCheck,
    FaShieldAlt,
    FaGift,
    FaTruck,
    FaStar,
    FaExclamationTriangle,
    FaInfoCircle
} from 'react-icons/fa';
import {
    registerValidationSchema,
    registerRateLimiter,
    sanitizeInput,
    validatePasswordStrength,
    generateCSRFToken,
    validateCSRFToken
} from '../../utils/security';

const BENEFITS = [
    {
        id: 'benefit-gift',
        icon: FaGift,
        title: 'Welcome Gift',
        description: 'Get 15% off your first order'
    },
    {
        id: 'benefit-shipping',
        icon: FaTruck,
        title: 'Free Shipping',
        description: 'On all orders over $50'
    },
    {
        id: 'benefit-access',
        icon: FaStar,
        title: 'Exclusive Access',
        description: 'Early access to new collections'
    },
    {
        id: 'benefit-security',
        icon: FaShieldAlt,
        title: 'Secure Account',
        description: 'Bank-level security protection'
    }
];

const PASSWORD_REQUIREMENTS = [
    'At least 8 characters long',
    'At least one uppercase letter (A-Z)',
    'At least one lowercase letter (a-z)',
    'At least one number (0-9)',
    'At least one special character (!@#$%^&*)',
    'No common passwords or patterns',
    'No sequential characters (123, abc)',
    'No repeated characters (aaa, 111)'
];

const DISPOSABLE_DOMAINS = [
    'tempmail.com',
    'throwaway.com',
    'mailinator.com',
    'guerrillamail.com',
    'sharklasers.com',
    'grr.la',
    'yopmail.com',
    '10minutemail.com',
    'temp-mail.org',
    'fakeinbox.com',
    'maildrop.cc',
    'getairmail.com',
    'trashmail.com',
    'spambox.us',
    'mailcatch.com',
    'tempinbox.com'
];

const COMMON_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];

const REDIRECT_HOME_DELAY_MS = 2000;
const REDIRECT_LOGIN_DELAY_MS = 3000;

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

const StatusAlert = React.memo(function StatusAlert({
    type,
    title,
    message,
    isDarkMode,
    icon: IconComponent
}) {
    if (!message) {
        return null;
    }

    const isError = type === 'error';

    return (
        <div
            className={`mb-6 border rounded-xl p-4 animate-fadeIn transition-colors duration-300
                ${isError
                    ? isDarkMode
                        ? 'bg-gradient-to-r from-red-900/30 to-pink-900/30 border-red-500'
                        : 'bg-gradient-to-r from-red-100 to-pink-100 border-red-400'
                    : isDarkMode
                        ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-500'
                        : 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-400'}`}
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300
                            ${isError
                                ? isDarkMode
                                    ? 'bg-gradient-to-r from-red-500 to-pink-500'
                                    : 'bg-gradient-to-r from-red-600 to-pink-600'
                                : isDarkMode
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                    : 'bg-gradient-to-r from-green-600 to-emerald-600'}`}
                        aria-hidden="true"
                    >
                        <IconComponent className="w-5 h-5 text-white" aria-hidden="true" />
                    </div>
                </div>
                <div className="ml-4">
                    <h2
                        className={`text-sm font-semibold transition-colors duration-300
                            ${isError
                                ? isDarkMode
                                    ? 'text-red-400'
                                    : 'text-red-700'
                                : isDarkMode
                                    ? 'text-green-400'
                                    : 'text-green-700'}`}
                    >
                        {title}
                    </h2>
                    <p
                        className={`text-sm mt-1 transition-colors duration-300
                            ${isError
                                ? isDarkMode
                                    ? 'text-red-300'
                                    : 'text-red-600'
                                : isDarkMode
                                    ? 'text-green-300'
                                    : 'text-green-600'}`}
                    >
                        {message}
                    </p>
                </div>
            </div>
        </div>
    );
});

const PasswordRequirementsModal = React.memo(function PasswordRequirementsModal({
    isDarkMode,
    onClose
}) {
    return (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-requirements-title"
        >
            <div
                className={`rounded-2xl p-6 max-w-md border transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-900 border-cyan-500' : 'bg-white border-cyan-600'}`}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2
                        id="password-requirements-title"
                        className={`text-xl font-bold transition-colors duration-300
                            ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}
                    >
                        Password Requirements
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`transition-colors duration-300
                            ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                        aria-label="Close password requirements"
                    >
                        ✕
                    </button>
                </div>

                <ul className="space-y-2">
                    {PASSWORD_REQUIREMENTS.map((item) => (
                        <li key={item} className="flex items-center space-x-2">
                            <FaCheck
                                className={`text-sm transition-colors duration-300
                                    ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}
                                aria-hidden="true"
                            />
                            <span
                                className={`transition-colors duration-300
                                    ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}
                            >
                                {item}
                            </span>
                        </li>
                    ))}
                </ul>

                <button
                    type="button"
                    onClick={onClose}
                    className={`w-full mt-6 py-3 text-white font-semibold rounded-xl transition-colors duration-300
                        ${isDarkMode
                            ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                            : 'bg-gradient-to-r from-cyan-700 to-cyan-800'}`}
                >
                    Got it
                </button>
            </div>
        </div>
    );
});

const BenefitCard = React.memo(function BenefitCard({ benefit, isDarkMode }) {
    const IconComponent = benefit.icon;

    return (
        <article
            className={`backdrop-blur-sm rounded-xl p-4 border transition-all duration-300
                ${isDarkMode
                    ? 'bg-gray-800/50 border-cyan-500/30 hover:bg-gray-800/80 hover:border-cyan-500/50'
                    : 'bg-white/80 border-cyan-200 hover:bg-white hover:border-cyan-300'}`}
        >
            <div className="flex items-center space-x-3">
                <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300
                        ${isDarkMode
                            ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                            : 'bg-gradient-to-r from-cyan-700 to-cyan-800'}`}
                    aria-hidden="true"
                >
                    <div className="text-white">
                        <IconComponent className="h-5 w-5" aria-hidden="true" />
                    </div>
                </div>
                <div>
                    <h3
                        className={`font-semibold text-sm transition-colors duration-300
                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                        {benefit.title}
                    </h3>
                    <p
                        className={`text-xs mt-0.5 transition-colors duration-300
                            ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}
                    >
                        {benefit.description}
                    </p>
                </div>
            </div>
        </article>
    );
});

export default function Register() {
    const isDarkMode = useDarkModeState();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(null);
    const [remainingAttempts, setRemainingAttempts] = useState(3);
    const [lockoutTime, setLockoutTime] = useState(null);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

    const navigate = useNavigate();
    const { setUserToken, setUser } = useContext(userContext);

    useEffect(() => {
        document.title = 'Create Account - SportFlex Store';
        generateCSRFToken();
    }, []);

    const signUp = useCallback(
        async (values) => {
            try {
                const sanitizedName = sanitizeInput(values.name);
                const sanitizedEmail = sanitizeInput(values.email);
                const sanitizedPhone = sanitizeInput(values.phone);
                const sanitizedPassword = sanitizeInput(values.password);
                const sanitizedRePassword = sanitizeInput(values.rePassword);

                const rateLimitCheck = registerRateLimiter.check(sanitizedEmail);
                setRemainingAttempts(rateLimitCheck.remaining);

                if (!rateLimitCheck.allowed) {
                    setLockoutTime(rateLimitCheck.resetTime);
                    throw new Error(
                        `Too many registration attempts. Please try again after ${rateLimitCheck.resetTime.toLocaleTimeString()}`
                    );
                }

                const csrfTokenData = sessionStorage.getItem('csrf_token');
                if (!csrfTokenData) {
                    throw new Error('Security validation failed. Please refresh the page.');
                }

                const { token } = JSON.parse(csrfTokenData);
                if (!validateCSRFToken(token)) {
                    throw new Error('Security validation failed. Please refresh the page.');
                }

                const strengthCheck = validatePasswordStrength(sanitizedPassword);
                setPasswordStrength(strengthCheck);

                if (!strengthCheck.isValid) {
                    throw new Error(strengthCheck.message);
                }

                if (sanitizedPassword !== sanitizedRePassword) {
                    throw new Error("Passwords don't match");
                }

                const emailDomain = sanitizedEmail.split('@')[1]?.toLowerCase();
                if (DISPOSABLE_DOMAINS.includes(emailDomain)) {
                    throw new Error(
                        'Please use a permanent email address. Disposable email addresses are not allowed.'
                    );
                }

                if (COMMON_DOMAINS.includes(emailDomain)) {
                    const localPart = sanitizedEmail.split('@')[0];
                    if (localPart.length < 3) {
                        throw new Error('Email local part must be at least 3 characters');
                    }
                }

                setIsLoading(true);
                setErrorMessage('');

                const { data, error } = await supabase.auth.signUp({
                    email: sanitizedEmail,
                    password: sanitizedPassword,
                    options: {
                        data: {
                            full_name: sanitizedName,
                            phone: sanitizedPhone,
                            created_at: new Date().toISOString(),
                            last_login_ip: null,
                            account_status: 'pending_verification',
                            registration_date: new Date().toISOString(),
                            preferred_language: navigator.language || 'en'
                        }
                    }
                });

                if (error) {
                    registerRateLimiter.increment(sanitizedEmail);
                    throw error;
                }

                if (data.session) {
                    setUserToken(data.session.access_token);
                    setUser(data.user);

                    localStorage.setItem('userToken', data.session.access_token);
                    localStorage.setItem('userEmail', sanitizedEmail);
                    localStorage.setItem('registrationTime', Date.now().toString());

                    setSuccessMessage('Registration successful! Welcome to SportFlex!');

                    window.setTimeout(() => {
                        navigate('/');
                    }, REDIRECT_HOME_DELAY_MS);
                } else {
                    setSuccessMessage(
                        'Registration successful! Please check your email to confirm your account. The verification link will expire in 24 hours.'
                    );

                    console.log('New user registration:', sanitizedEmail, ' - Email confirmation sent');

                    window.setTimeout(() => {
                        navigate('/login');
                    }, REDIRECT_LOGIN_DELAY_MS);
                }

                registerRateLimiter.reset(sanitizedEmail);
            } catch (error) {
                console.error('Registration error:', error);
                setErrorMessage(error.message || 'Registration failed. Please try again.');
            } finally {
                setIsLoading(false);
            }
        },
        [navigate, setUser, setUserToken]
    );

    const formik = useFormik({
        initialValues: {
            name: '',
            email: '',
            password: '',
            rePassword: '',
            phone: ''
        },
        validationSchema: registerValidationSchema,
        onSubmit: signUp
    });

    const handlePasswordChange = useCallback(
        (e) => {
            formik.handleChange(e);
            setPasswordStrength(validatePasswordStrength(e.target.value));
        },
        [formik]
    );

    const closePasswordRequirements = useCallback(() => {
        setShowPasswordRequirements(false);
    }, []);

    const openPasswordRequirements = useCallback(() => {
        setShowPasswordRequirements(true);
    }, []);

    const handleAcceptedTermsChange = useCallback((e) => {
        setAcceptedTerms(e.target.checked);
    }, []);

    const passwordStrengthColor = useMemo(() => {
        if (!passwordStrength) {
            return isDarkMode ? 'bg-gray-700' : 'bg-gray-300';
        }

        const score = passwordStrength.strengthScore;
        if (score < 4) return 'bg-red-500';
        if (score < 6) return 'bg-yellow-500';
        if (score < 8) return 'bg-blue-500';
        return 'bg-green-500';
    }, [isDarkMode, passwordStrength]);

    const passwordStrengthText = useMemo(() => {
        if (!passwordStrength) {
            return 'Enter a password';
        }

        const score = passwordStrength.strengthScore;
        if (score < 4) return 'Weak';
        if (score < 6) return 'Fair';
        if (score < 8) return 'Good';
        return 'Strong';
    }, [passwordStrength]);

    const labelClass = useMemo(
        () =>
            `block text-sm font-semibold transition-colors duration-300 ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'
            }`,
        [isDarkMode]
    );

    const getInputClass = useCallback(
        (hasError) =>
            `block w-full pl-10 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 placeholder-gray-500 ${hasError
                ? 'border-red-500'
                : isDarkMode
                    ? 'border-gray-700 bg-gray-800 text-white focus:ring-cyan-500 focus:border-cyan-500 focus:bg-gray-900'
                    : 'border-gray-300 bg-white text-gray-900 focus:ring-cyan-600 focus:border-cyan-600 focus:bg-gray-50'
            }`,
        [isDarkMode]
    );

    const passwordChecks = useMemo(
        () => Object.entries(passwordStrength?.checks || {}).slice(0, 4),
        [passwordStrength]
    );

    return (
        <main
            className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300
                ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}
            aria-labelledby="register-heading"
        >
            {showPasswordRequirements && (
                <PasswordRequirementsModal
                    isDarkMode={isDarkMode}
                    onClose={closePasswordRequirements}
                />
            )}

            <div
                className={`w-full max-w-6xl flex flex-col lg:flex-row overflow-hidden rounded-2xl shadow-2xl border transition-colors duration-300
                    ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
            >
                <section
                    className={`lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center relative overflow-hidden border-r transition-colors duration-300
                        ${isDarkMode
                            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-800'
                            : 'bg-gradient-to-br from-gray-100 via-white to-gray-100 border-gray-200'}`}
                    aria-labelledby="brand-heading"
                >
                    <div className="absolute inset-0 opacity-10" aria-hidden="true">
                        <div
                            className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                                    : 'bg-gradient-to-r from-cyan-600 to-cyan-700'}`}
                        />
                        <div
                            className={`absolute bottom-0 left-0 w-72 h-72 rounded-full blur-3xl transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-500'
                                    : 'bg-gradient-to-r from-cyan-700 to-cyan-600'}`}
                        />
                        <div
                            className={`absolute top-1/3 right-1/4 w-64 h-64 rounded-full blur-3xl transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-cyan-400 to-cyan-300'
                                    : 'bg-gradient-to-r from-cyan-600 to-cyan-500'}`}
                        />
                    </div>

                    <div className="relative z-10">
                        <header className="mb-10 text-center lg:text-left">
                            <div className="inline-flex items-center justify-center lg:justify-start space-x-3 mb-6">
                                <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-colors duration-300
                                        ${isDarkMode
                                            ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                                            : 'bg-gradient-to-r from-cyan-700 to-cyan-800'}`}
                                    aria-hidden="true"
                                >
                                    <span className="text-white font-bold text-xl">SF</span>
                                </div>
                                <div>
                                    <h1
                                        id="brand-heading"
                                        className={`text-3xl lg:text-4xl font-bold transition-colors duration-300
                                            ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                    >
                                        Join SportFlex
                                    </h1>
                                    <p
                                        className={`text-sm mt-1 transition-colors duration-300
                                            ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}
                                    >
                                        Start Your Fitness Journey
                                    </p>
                                </div>
                            </div>

                            <p
                                className={`text-lg lg:text-xl leading-relaxed max-w-lg mx-auto lg:mx-0 transition-colors duration-300
                                    ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}
                            >
                                Create your account today and unlock exclusive benefits, personalized recommendations,
                                and premium sportswear collections tailored just for you.
                            </p>
                        </header>

                        <section className="mb-10" aria-labelledby="benefits-heading">
                            <h2
                                id="benefits-heading"
                                className={`text-2xl font-bold mb-6 text-center lg:text-left transition-colors duration-300
                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                                Why Join SportFlex?
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="list" aria-label="Membership benefits">
                                {BENEFITS.map((benefit) => (
                                    <div key={benefit.id} role="listitem">
                                        <BenefitCard benefit={benefit} isDarkMode={isDarkMode} />
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section
                            className={`backdrop-blur-sm rounded-2xl p-6 border transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-cyan-900/30 to-cyan-800/30 border-cyan-500/30'
                                    : 'bg-gradient-to-r from-cyan-100/50 to-cyan-50/50 border-cyan-200'}`}
                            aria-labelledby="setup-heading"
                        >
                            <h3
                                id="setup-heading"
                                className={`font-semibold text-lg mb-4 text-center lg:text-left transition-colors duration-300
                                    ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                                Quick & Easy Setup
                            </h3>

                            <div className="flex items-center justify-center lg:justify-start space-x-6">
                                <div className="text-center">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 transition-colors duration-300
                                            ${isDarkMode
                                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                                                : 'bg-gradient-to-r from-cyan-700 to-cyan-800'}`}
                                    >
                                        <span className="text-white font-bold">1</span>
                                    </div>
                                    <span
                                        className={`text-xs transition-colors duration-300
                                            ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}
                                    >
                                        Register
                                    </span>
                                </div>

                                <div
                                    className={`transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}
                                    aria-hidden="true"
                                >
                                    <FaArrowRight />
                                </div>

                                <div className="text-center">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 transition-colors duration-300
                                            ${isDarkMode
                                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                                                : 'bg-gradient-to-r from-cyan-700 to-cyan-800'}`}
                                    >
                                        <span className="text-white font-bold">2</span>
                                    </div>
                                    <span
                                        className={`text-xs transition-colors duration-300
                                            ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}
                                    >
                                        Verify
                                    </span>
                                </div>

                                <div
                                    className={`transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}
                                    aria-hidden="true"
                                >
                                    <FaArrowRight />
                                </div>

                                <div className="text-center">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 transition-colors duration-300
                                            ${isDarkMode
                                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
                                                : 'bg-gradient-to-r from-cyan-700 to-cyan-800'}`}
                                    >
                                        <span className="text-white font-bold">3</span>
                                    </div>
                                    <span
                                        className={`text-xs transition-colors duration-300
                                            ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}
                                    >
                                        Shop
                                    </span>
                                </div>
                            </div>
                        </section>

                        <div className="mt-6 flex items-center justify-center lg:justify-start space-x-4" aria-label="Trust badges">
                            <div className="flex items-center space-x-1">
                                <FaShieldAlt
                                    className={`text-sm transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}
                                    aria-hidden="true"
                                />
                                <span
                                    className={`text-xs transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}
                                >
                                    256-bit SSL
                                </span>
                            </div>
                            <div
                                className={`w-px h-4 transition-colors duration-300
                                    ${isDarkMode ? 'bg-cyan-800' : 'bg-cyan-200'}`}
                                aria-hidden="true"
                            />
                            <div className="flex items-center space-x-1">
                                <span
                                    className={`text-xs transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}
                                >
                                    GDPR
                                </span>
                            </div>
                            <div
                                className={`w-px h-4 transition-colors duration-300
                                    ${isDarkMode ? 'bg-cyan-800' : 'bg-cyan-200'}`}
                                aria-hidden="true"
                            />
                            <div className="flex items-center space-x-1">
                                <span
                                    className={`text-xs transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}
                                >
                                    PCI DSS
                                </span>
                            </div>
                        </div>

                        <div
                            className={`absolute bottom-8 right-8 opacity-20 transition-colors duration-300
                                ${isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}`}
                            aria-hidden="true"
                        >
                            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                    </div>
                </section>

                <section
                    className={`lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center transition-colors duration-300
                        ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}
                    aria-labelledby="register-heading"
                >
                    <div className="max-w-md mx-auto w-full">
                        <header className="text-center mb-8">
                            <h2
                                id="register-heading"
                                className={`text-3xl lg:text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent mb-3
                                    ${isDarkMode ? 'from-cyan-400 to-cyan-300' : 'from-cyan-700 to-cyan-600'}`}
                            >
                                Create Account
                            </h2>
                            <p
                                className={`transition-colors duration-300
                                    ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                            >
                                Fill in your details to get started
                            </p>
                        </header>

                        <StatusAlert
                            type="error"
                            title="Registration failed"
                            message={errorMessage}
                            isDarkMode={isDarkMode}
                            icon={FaExclamationTriangle}
                        />

                        <StatusAlert
                            type="success"
                            title="Success!"
                            message={successMessage}
                            isDarkMode={isDarkMode}
                            icon={FaCheck}
                        />

                        <div className="mb-4 text-xs text-center" aria-live="polite">
                            <span
                                className={`inline-flex items-center space-x-1 transition-colors duration-300
                                    ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}
                            >
                                <FaShieldAlt className="text-xs" aria-hidden="true" />
                                <span>All data encrypted</span>
                            </span>
                            <span
                                className={`mx-2 transition-colors duration-300
                                    ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}
                            >
                                •
                            </span>
                            <span
                                className={`transition-colors duration-300
                                    ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}
                            >
                                {remainingAttempts} attempts remaining
                            </span>
                            {lockoutTime && (
                                <>
                                    <span
                                        className={`mx-2 transition-colors duration-300
                                            ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}
                                    >
                                        •
                                    </span>
                                    <span
                                        className={`transition-colors duration-300
                                            ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}
                                    >
                                        Lockout until {lockoutTime.toLocaleTimeString()}
                                    </span>
                                </>
                            )}
                        </div>

                        <form className="space-y-5" onSubmit={formik.handleSubmit} noValidate>
                            <div className="group">
                                <label htmlFor="name" className={`${labelClass} mb-2`}>
                                    Full Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaUser
                                            className={`h-5 w-5 transition-colors duration-300
                                                ${isDarkMode
                                                    ? 'text-gray-500 group-focus-within:text-cyan-400'
                                                    : 'text-gray-400 group-focus-within:text-cyan-700'}`}
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        autoComplete="name"
                                        required
                                        value={formik.values.name}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        className={getInputClass(Boolean(formik.touched.name && formik.errors.name))}
                                        placeholder="John Doe"
                                        aria-invalid={Boolean(formik.touched.name && formik.errors.name)}
                                        aria-describedby={
                                            formik.touched.name && formik.errors.name ? 'name-error' : undefined
                                        }
                                    />
                                </div>
                                {formik.touched.name && formik.errors.name && (
                                    <p id="name-error" className="mt-1 text-xs text-red-500">
                                        {formik.errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="group">
                                <label htmlFor="email" className={`${labelClass} mb-2`}>
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaEnvelope
                                            className={`h-5 w-5 transition-colors duration-300
                                                ${isDarkMode
                                                    ? 'text-gray-500 group-focus-within:text-cyan-400'
                                                    : 'text-gray-400 group-focus-within:text-cyan-700'}`}
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={formik.values.email}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        className={getInputClass(Boolean(formik.touched.email && formik.errors.email))}
                                        placeholder="name@example.com"
                                        aria-invalid={Boolean(formik.touched.email && formik.errors.email)}
                                        aria-describedby={
                                            formik.touched.email && formik.errors.email ? 'email-error' : undefined
                                        }
                                    />
                                </div>
                                {formik.touched.email && formik.errors.email && (
                                    <p id="email-error" className="mt-1 text-xs text-red-500">
                                        {formik.errors.email}
                                    </p>
                                )}
                            </div>

                            <div className="group">
                                <label htmlFor="phone" className={`${labelClass} mb-2`}>
                                    Phone Number
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaPhone
                                            className={`h-5 w-5 transition-colors duration-300
                                                ${isDarkMode
                                                    ? 'text-gray-500 group-focus-within:text-cyan-400'
                                                    : 'text-gray-400 group-focus-within:text-cyan-700'}`}
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        autoComplete="tel"
                                        required
                                        value={formik.values.phone}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        className={getInputClass(Boolean(formik.touched.phone && formik.errors.phone))}
                                        placeholder="+1 (555) 123-4567"
                                        aria-invalid={Boolean(formik.touched.phone && formik.errors.phone)}
                                        aria-describedby={
                                            formik.touched.phone && formik.errors.phone ? 'phone-error' : undefined
                                        }
                                    />
                                </div>
                                {formik.touched.phone && formik.errors.phone && (
                                    <p id="phone-error" className="mt-1 text-xs text-red-500">
                                        {formik.errors.phone}
                                    </p>
                                )}
                            </div>

                            <div className="group">
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor="password" className={labelClass}>
                                        Password
                                    </label>
                                    <button
                                        type="button"
                                        onClick={openPasswordRequirements}
                                        className={`text-xs flex items-center space-x-1 transition-colors duration-300
                                            ${isDarkMode
                                                ? 'text-cyan-400 hover:text-cyan-300'
                                                : 'text-cyan-700 hover:text-cyan-800'}`}
                                        aria-label="Open password requirements"
                                    >
                                        <FaInfoCircle className="text-xs" aria-hidden="true" />
                                        <span>Requirements</span>
                                    </button>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaLock
                                            className={`h-5 w-5 transition-colors duration-300
                                                ${isDarkMode
                                                    ? 'text-gray-500 group-focus-within:text-cyan-400'
                                                    : 'text-gray-400 group-focus-within:text-cyan-700'}`}
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        value={formik.values.password}
                                        onChange={handlePasswordChange}
                                        onBlur={formik.handleBlur}
                                        className={getInputClass(Boolean(formik.touched.password && formik.errors.password))}
                                        placeholder="Create a strong password"
                                        aria-invalid={Boolean(formik.touched.password && formik.errors.password)}
                                        aria-describedby={
                                            formik.touched.password && formik.errors.password ? 'password-error' : undefined
                                        }
                                    />
                                </div>

                                {formik.touched.password && formik.errors.password && (
                                    <p id="password-error" className="mt-1 text-xs text-red-500">
                                        {formik.errors.password}
                                    </p>
                                )}

                                {formik.values.password && (
                                    <div className="mt-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <span
                                                className={`text-xs transition-colors duration-300
                                                    ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}
                                            >
                                                Password strength:
                                            </span>
                                            <span
                                                className={`text-xs font-semibold ${!passwordStrength
                                                        ? isDarkMode
                                                            ? 'text-gray-400'
                                                            : 'text-gray-600'
                                                        : passwordStrength.strengthScore < 4
                                                            ? 'text-red-500'
                                                            : passwordStrength.strengthScore < 6
                                                                ? 'text-yellow-500'
                                                                : passwordStrength.strengthScore < 8
                                                                    ? 'text-blue-500'
                                                                    : 'text-green-500'
                                                    }`}
                                            >
                                                {passwordStrengthText}
                                            </span>
                                        </div>

                                        <div
                                            className={`h-2 w-full rounded-full overflow-hidden transition-colors duration-300
                                                ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
                                        >
                                            <div
                                                className={`h-full ${passwordStrengthColor} transition-all duration-300`}
                                                style={{ width: `${(passwordStrength?.strengthScore || 0) * 10}%` }}
                                            />
                                        </div>

                                        <div className="mt-2 grid grid-cols-4 gap-1">
                                            {passwordChecks.map(([key, value]) => (
                                                <div key={key} className="text-center">
                                                    <div
                                                        className={`text-[10px] ${value
                                                                ? 'text-green-500'
                                                                : isDarkMode
                                                                    ? 'text-gray-500'
                                                                    : 'text-gray-400'
                                                            }`}
                                                    >
                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="group">
                                <label htmlFor="rePassword" className={`${labelClass} mb-2`}>
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaLock
                                            className={`h-5 w-5 transition-colors duration-300
                                                ${isDarkMode
                                                    ? 'text-gray-500 group-focus-within:text-cyan-400'
                                                    : 'text-gray-400 group-focus-within:text-cyan-700'}`}
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <input
                                        id="rePassword"
                                        name="rePassword"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        value={formik.values.rePassword}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        className={getInputClass(
                                            Boolean(formik.touched.rePassword && formik.errors.rePassword)
                                        )}
                                        placeholder="Confirm your password"
                                        aria-invalid={Boolean(formik.touched.rePassword && formik.errors.rePassword)}
                                        aria-describedby={
                                            formik.touched.rePassword && formik.errors.rePassword
                                                ? 'repassword-error'
                                                : undefined
                                        }
                                    />
                                </div>

                                {formik.touched.rePassword && formik.errors.rePassword && (
                                    <p id="repassword-error" className="mt-1 text-xs text-red-500">
                                        {formik.errors.rePassword}
                                    </p>
                                )}

                                {formik.values.password &&
                                    formik.values.rePassword &&
                                    formik.values.password === formik.values.rePassword && (
                                        <p className="mt-1 text-xs text-green-500 flex items-center">
                                            <FaCheck className="mr-1 text-xs" aria-hidden="true" />
                                            Passwords match
                                        </p>
                                    )}
                            </div>

                            <div className="flex items-start space-x-3 pt-2">
                                <input
                                    id="terms"
                                    name="terms"
                                    type="checkbox"
                                    required
                                    checked={acceptedTerms}
                                    onChange={handleAcceptedTermsChange}
                                    className={`h-4 w-4 rounded focus:ring-2 mt-1 transition-colors duration-300
                                        ${isDarkMode
                                            ? 'text-cyan-500 focus:ring-cyan-500 border-gray-700 bg-gray-800'
                                            : 'text-cyan-700 focus:ring-cyan-600 border-gray-300 bg-white'}`}
                                />
                                <label
                                    htmlFor="terms"
                                    className={`text-sm transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}
                                >
                                    I agree to the{' '}
                                    <Link
                                        to="/terms"
                                        className={`font-medium transition-colors duration-300
                                            ${isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'}`}
                                    >
                                        Terms of Service
                                    </Link>{' '}
                                    and{' '}
                                    <Link
                                        to="/privacy"
                                        className={`font-medium transition-colors duration-300
                                            ${isDarkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'}`}
                                    >
                                        Privacy Policy
                                    </Link>{' '}
                                    and confirm I am at least 18 years old.
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || remainingAttempts === 0 || !acceptedTerms}
                                className={`w-full py-4 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group mt-2
                                    ${isDarkMode
                                        ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700'
                                        : 'bg-gradient-to-r from-cyan-700 to-cyan-800 hover:from-cyan-800 hover:to-cyan-900'}`}
                                aria-label={isLoading ? 'Creating account' : 'Create account'}
                            >
                                <div className="flex items-center justify-center">
                                    {isLoading ? (
                                        <>
                                            <FaSpinner className="animate-spin h-5 w-5 text-white mr-3" aria-hidden="true" />
                                            <span className="text-white font-semibold">Creating Account...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-white font-semibold text-lg">Create Account</span>
                                            <FaArrowRight
                                                className="ml-3 h-5 w-5 text-white transform group-hover:translate-x-1 transition-transform"
                                                aria-hidden="true"
                                            />
                                        </>
                                    )}
                                </div>
                            </button>

                            <div
                                className={`text-center pt-6 border-t mt-6 transition-colors duration-300
                                    ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}
                            >
                                <p
                                    className={`transition-colors duration-300
                                        ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                                >
                                    Already have an account?{' '}
                                    <Link
                                        to="/login"
                                        className={`font-semibold bg-gradient-to-r bg-clip-text text-transparent hover:from-cyan-300 hover:to-cyan-200 transition-all inline-flex items-center
                                            ${isDarkMode
                                                ? 'from-cyan-400 to-cyan-300'
                                                : 'from-cyan-700 to-cyan-600'}`}
                                    >
                                        Sign in now
                                        <FaArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                                    </Link>
                                </p>
                            </div>
                        </form>

                        <section
                            className={`mt-6 p-4 rounded-xl border transition-colors duration-300
                                ${isDarkMode
                                    ? 'bg-gradient-to-r from-cyan-900/30 to-cyan-800/30 border-cyan-500/30'
                                    : 'bg-gradient-to-r from-cyan-100/50 to-cyan-50/50 border-cyan-200'}`}
                            aria-label="Additional security information"
                        >
                            <div className="flex items-start space-x-3">
                                <FaShieldAlt
                                    className={`h-5 w-5 mt-0.5 flex-shrink-0 transition-colors duration-300
                                        ${isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}`}
                                    aria-hidden="true"
                                />
                                <div>
                                    <p
                                        className={`text-sm transition-colors duration-300
                                            ${isDarkMode ? 'text-cyan-300' : 'text-cyan-800'}`}
                                    >
                                        <span className="font-semibold">Your security is our priority.</span> We use
                                        bank-level encryption to protect your personal information. All data is encrypted
                                        before transmission.
                                    </p>
                                    <div className="mt-2 flex items-center space-x-4 text-xs">
                                        <span className={isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}>
                                            ✓ 256-bit SSL
                                        </span>
                                        <span className={isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}>
                                            ✓ 2FA Ready
                                        </span>
                                        <span className={isDarkMode ? 'text-cyan-400' : 'text-cyan-700'}>
                                            ✓ GDPR Compliant
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div
                            className={`mt-4 text-xs text-center transition-colors duration-300
                                ${isDarkMode ? 'text-cyan-500' : 'text-cyan-700'}`}
                        >
                            Protected by advanced security systems • Google reCAPTCHA may be used
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}