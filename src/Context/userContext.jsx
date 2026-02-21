// src/Context/userContext.jsx
import React, { createContext, useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../supabaseClient'

export let userContext = createContext();

export default function UserContextProvider({ children }) {
    const [userToken, setUserToken] = useState(null);
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminData, setAdminData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sessionExpiry, setSessionExpiry] = useState(null);
    const [lastActivity, setLastActivity] = useState(Date.now());

    // Use refs to prevent multiple calls
    const adminCheckInProgress = useRef(false);
    const lastAdminCheck = useRef(0);
    const authInitialized = useRef(false);

    // Security: Handle logout with reason
    const handleLogout = useCallback(async (reason = 'User logout') => {
        try {
            await supabase.auth.signOut();

            // Clear all storage
            setUserToken(null);
            setUser(null);
            setIsAdmin(false);
            setAdminData(null);
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
    }, []);

    // Update last activity timestamp
    const updateLastActivity = useCallback(() => {
        setLastActivity(Date.now());
    }, []);

    // Check admin status with Supabase - with debouncing to prevent multiple calls
    const checkAdminStatus = useCallback(async (userId, force = false) => {
        try {
            if (!userId) {
                setIsAdmin(false);
                setAdminData(null);
                return false;
            }

            // Prevent multiple simultaneous calls
            if (adminCheckInProgress.current) {
                return isAdmin; // Return current state
            }

            // Throttle: Don't check more than once every 5 seconds unless forced
            const now = Date.now();
            if (!force && now - lastAdminCheck.current < 5000) {
                return isAdmin; // Return cached state
            }

            adminCheckInProgress.current = true;
            lastAdminCheck.current = now;

            const { data, error } = await supabase
                .rpc('get_admin_status');

            if (error) {
                console.error('Error checking admin status:', error);
                setIsAdmin(false);
                setAdminData(null);
                return false;
            }

            const isUserAdmin = data?.is_admin || false;
            setIsAdmin(isUserAdmin);
            setAdminData(data);

            // Store in sessionStorage as cache (remove console.log)
            if (isUserAdmin) {
                sessionStorage.setItem('isAdmin', 'true');
                sessionStorage.setItem('adminEmail', data?.email);
            } else {
                sessionStorage.removeItem('isAdmin');
                sessionStorage.removeItem('adminEmail');
            }

            return isUserAdmin;
        } catch (error) {
            console.error('Admin check error:', error);
            setIsAdmin(false);
            setAdminData(null);
            return false;
        } finally {
            adminCheckInProgress.current = false;
        }
    }, [isAdmin]); // Add isAdmin to dependencies

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

                // Re-check admin status only if needed
                const cachedAdmin = sessionStorage.getItem('isAdmin') === 'true';
                if (cachedAdmin) {
                    // If cached as admin, verify but don't force
                    await checkAdminStatus(data.session.user.id);
                }

                return true;
            }
        } catch (error) {
            console.error('Session refresh error:', error);
            handleLogout('Session refresh failed');
            return false;
        }
    }, [handleLogout, checkAdminStatus]);

    useEffect(() => {
        // Prevent double initialization
        if (authInitialized.current) return;

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

                        // Check admin status from cache first, then from Supabase
                        const cachedAdmin = sessionStorage.getItem('isAdmin') === 'true';
                        if (cachedAdmin) {
                            setIsAdmin(true);
                        }

                        // Still verify but don't wait for it
                        checkAdminStatus(session.user.id).then(adminStatus => {
                            // Update if different from cached
                            if (adminStatus !== cachedAdmin) {
                                setIsAdmin(adminStatus);
                            }
                        });

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
                authInitialized.current = true;
            }
        };

        initializeAuth();

        // Listen for auth changes with debouncing
        let authTimeout;
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // Debounce auth state changes
            clearTimeout(authTimeout);
            authTimeout = setTimeout(async () => {
                switch (event) {
                    case 'SIGNED_IN':
                        if (session) {
                            setUserToken(session.access_token);
                            setUser(session.user);

                            // Check admin status (throttled automatically)
                            checkAdminStatus(session.user.id, true); // Force first check

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
                        }
                        break;

                    case 'SIGNED_OUT':
                        handleLogout('User signed out');
                        break;

                    case 'TOKEN_REFRESHED':
                        if (session) {
                            setUserToken(session.access_token);
                            localStorage.setItem('userToken', session.access_token);
                            // Only re-check admin if necessary
                            const cachedAdmin = sessionStorage.getItem('isAdmin') === 'true';
                            if (cachedAdmin) {
                                checkAdminStatus(session.user.id);
                            }
                        }
                        break;

                    case 'USER_UPDATED':
                        if (session) {
                            setUser(session.user);
                            // Only re-check admin if email changed
                            const oldEmail = localStorage.getItem('userEmail');
                            if (oldEmail !== session.user.email) {
                                checkAdminStatus(session.user.id);
                            }
                        }
                        break;

                    default:
                        break;
                }
            }, 300); // 300ms debounce
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

        return () => {
            clearTimeout(authTimeout);
            subscription.unsubscribe();
            activityEvents.forEach(event => {
                document.removeEventListener(event, updateLastActivity);
            });
            document.removeEventListener('visibilitychange', handleVisibilityChange);

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
            adminData,
            sessionExpiry,
            lastActivity,
            loginTime: localStorage.getItem('loginTime'),
            userEmail: user?.email || localStorage.getItem('userEmail')
        };
    }, [userToken, isAdmin, adminData, sessionExpiry, lastActivity, user]);

    return (
        <userContext.Provider value={{
            userToken,
            setUserToken,
            user,
            setUser,
            isAdmin,
            adminData,
            loading,
            logout: handleLogout,
            validateSession,
            refreshSession,
            isAuthenticated,
            getUserRole,
            getSecurityInfo,
            checkAdminStatus
        }}>
            {children}
        </userContext.Provider>
    )
}