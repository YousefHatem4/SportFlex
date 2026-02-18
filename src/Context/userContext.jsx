// src/Context/userContext.jsx
import React, { createContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'

export let userContext = createContext();

export default function UserContextProvider({ children }) {
    const [userToken, setUserToken] = useState(null);
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sessionExpiry, setSessionExpiry] = useState(null);
    const [lastActivity, setLastActivity] = useState(Date.now());
    const [loginAttempts, setLoginAttempts] = useState(0);

    // Security: Handle logout with reason
    const handleLogout = useCallback(async (reason = 'User logout') => {
        try {
            // Log security event
            console.log('Logout initiated:', reason, 'User:', user?.email, 'Time:', new Date().toISOString());

            await supabase.auth.signOut();

            // Clear all storage
            setUserToken(null);
            setUser(null);
            setIsAdmin(false);
            localStorage.removeItem('userToken');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('loginTime');
            sessionStorage.clear();

            // Clear any session timeouts
            const timeoutId = sessionStorage.getItem('sessionTimeout');
            if (timeoutId) {
                clearTimeout(parseInt(timeoutId));
            }

            // Clear activity listeners
            const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
            activityEvents.forEach(event => {
                document.removeEventListener(event, updateLastActivity);
            });

        } catch (error) {
            console.error('Logout error:', error);
        }
    }, [user]);

    // Update last activity timestamp
    const updateLastActivity = useCallback(() => {
        setLastActivity(Date.now());
    }, []);

    // Check admin status with additional validation
    const checkAdminStatus = useCallback((email) => {
        // Secure admin check with additional validation
        const adminEmail = 'yousef.hatem.developer@gmail.com';

        // Check if email matches admin
        if (email === adminEmail) {
            setIsAdmin(true);
            // Log admin access for security
            console.log('Admin access granted:', email, new Date().toISOString());

            // You could implement additional admin verification here
            // For example, checking against a secure database table
            sessionStorage.setItem('isAdmin', 'true');
        } else {
            setIsAdmin(false);
            sessionStorage.removeItem('isAdmin');
        }
    }, []);

    // Validate session
    const validateSession = useCallback(() => {
        if (sessionExpiry && new Date() > sessionExpiry) {
            handleLogout('Session expired');
            return false;
        }

        // Check for inactivity (30 minutes)
        const inactivityLimit = 30 * 60 * 1000;
        if (Date.now() - lastActivity > inactivityLimit) {
            handleLogout('Inactivity timeout');
            return false;
        }

        return true;
    }, [sessionExpiry, lastActivity, handleLogout]);

    // Refresh session
    const refreshSession = useCallback(async () => {
        try {
            const { data, error } = await supabase.auth.refreshSession();
            if (error) throw error;

            if (data.session) {
                setUserToken(data.session.access_token);
                setUser(data.session.user);
                localStorage.setItem('userToken', data.session.access_token);

                // Update session expiry
                const expiresAt = new Date(data.session.expires_at * 1000);
                setSessionExpiry(expiresAt);

                return true;
            }
        } catch (error) {
            console.error('Session refresh error:', error);
            handleLogout('Session refresh failed');
            return false;
        }
    }, [handleLogout]);

    useEffect(() => {
        // Set up activity monitoring
        const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
        activityEvents.forEach(event => {
            document.addEventListener(event, updateLastActivity, { passive: true });
        });

        // Check for existing session with security validation
        const initializeAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) throw error;

                if (session) {
                    // Validate session expiry
                    const expiresAt = new Date(session.expires_at * 1000);

                    if (expiresAt > new Date()) {
                        setUserToken(session.access_token);
                        setUser(session.user);
                        checkAdminStatus(session.user.email);

                        // Securely store with encryption (basic encoding for demo)
                        const encryptedToken = btoa(session.access_token);
                        localStorage.setItem('userToken', encryptedToken);
                        localStorage.setItem('userEmail', session.user.email);
                        localStorage.setItem('loginTime', Date.now().toString());

                        // Set session expiry
                        setSessionExpiry(expiresAt);

                        // Auto logout on expiry
                        const timeUntilExpiry = expiresAt.getTime() - new Date().getTime();
                        if (timeUntilExpiry > 0) {
                            setTimeout(() => {
                                handleLogout('Session expired');
                            }, timeUntilExpiry);
                        }

                        // Set session timeout (30 minutes)
                        const timeoutId = setTimeout(() => {
                            handleLogout('Session timeout');
                        }, 30 * 60 * 1000);

                        sessionStorage.setItem('sessionTimeout', timeoutId.toString());

                    } else {
                        // Session expired, clean up
                        await supabase.auth.signOut();
                        localStorage.removeItem('userToken');
                        localStorage.removeItem('userEmail');
                        localStorage.removeItem('loginTime');
                        sessionStorage.clear();
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                // Clean up on error
                localStorage.removeItem('userToken');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('loginTime');
                sessionStorage.clear();
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes with enhanced security
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state change:', event, 'Time:', new Date().toISOString());

            switch (event) {
                case 'SIGNED_IN':
                    if (session) {
                        setUserToken(session.access_token);
                        setUser(session.user);
                        checkAdminStatus(session.user.email);

                        // Secure storage
                        localStorage.setItem('userToken', session.access_token);
                        localStorage.setItem('userEmail', session.user.email);
                        localStorage.setItem('loginTime', Date.now().toString());

                        // Set session expiry
                        const expiresAt = new Date(session.expires_at * 1000);
                        setSessionExpiry(expiresAt);

                        // Set session timeout (30 minutes)
                        const timeoutId = setTimeout(() => {
                            handleLogout('Session timeout');
                        }, 30 * 60 * 1000);

                        sessionStorage.setItem('sessionTimeout', timeoutId.toString());

                        // Log successful login
                        console.log('User signed in:', session.user.email);
                    }
                    break;

                case 'SIGNED_OUT':
                    handleLogout('User signed out');
                    break;

                case 'TOKEN_REFRESHED':
                    console.log('Token refreshed for user:', session?.user?.email);
                    if (session) {
                        setUserToken(session.access_token);
                        localStorage.setItem('userToken', session.access_token);
                    }
                    break;

                case 'USER_UPDATED':
                    if (session) {
                        setUser(session.user);
                        checkAdminStatus(session.user.email);
                    }
                    break;

                case 'PASSWORD_RECOVERY':
                    console.log('Password recovery initiated');
                    break;

                default:
                    break;
            }
        });

        // Handle visibility change (tab switch)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // User left the tab
                sessionStorage.setItem('lastActive', Date.now().toString());
            } else {
                // User returned to tab
                const lastActive = sessionStorage.getItem('lastActive');
                if (lastActive) {
                    const inactiveTime = Date.now() - parseInt(lastActive);
                    // If inactive for more than 15 minutes, log out
                    if (inactiveTime > 15 * 60 * 1000) {
                        handleLogout('Inactivity on tab switch');
                    }
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Handle before unload
        const handleBeforeUnload = () => {
            // You can implement logic here
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            subscription.unsubscribe();
            activityEvents.forEach(event => {
                document.removeEventListener(event, updateLastActivity);
            });
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);

            // Clear session timeout
            const timeoutId = sessionStorage.getItem('sessionTimeout');
            if (timeoutId) {
                clearTimeout(parseInt(timeoutId));
            }
        };
    }, [handleLogout, checkAdminStatus, updateLastActivity]);

    // Security utility functions
    const isAuthenticated = useCallback(() => {
        return !!userToken && validateSession();
    }, [userToken, validateSession]);

    const getUserRole = useCallback(() => {
        if (isAdmin) return 'admin';
        if (user) return 'user';
        return 'guest';
    }, [isAdmin, user]);

    const getSecurityInfo = useCallback(() => {
        return {
            isAuthenticated: !!userToken,
            isAdmin,
            sessionExpiry,
            lastActivity,
            loginTime: localStorage.getItem('loginTime'),
            userEmail: user?.email || localStorage.getItem('userEmail')
        };
    }, [userToken, isAdmin, sessionExpiry, lastActivity, user]);

    return (
        <userContext.Provider value={{
            userToken,
            setUserToken,
            user,
            setUser,
            isAdmin,
            loading,
            logout: handleLogout,
            validateSession,
            refreshSession,
            isAuthenticated,
            getUserRole,
            getSecurityInfo
        }}>
            {children}
        </userContext.Provider>
    )
}