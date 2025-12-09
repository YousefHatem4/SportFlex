// src/Context/userContext.jsx
import React, { createContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export let userContext = createContext();

export default function UserContextProvider({ children }) {
    const [userToken, setUserToken] = useState(null);
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setUserToken(session.access_token);
                setUser(session.user);
                checkAdminStatus(session.user.email);
                localStorage.setItem('userToken', session.access_token);
            }
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                setUserToken(session.access_token);
                setUser(session.user);
                checkAdminStatus(session.user.email);
                localStorage.setItem('userToken', session.access_token);
            } else {
                setUserToken(null);
                setUser(null);
                setIsAdmin(false);
                localStorage.removeItem('userToken');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkAdminStatus = (email) => {
        // Check if user is admin
        if (email === 'yousef.hatem.developer@gmail.com') {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
        }
    };

    return (
        <userContext.Provider value={{
            userToken,
            setUserToken,
            user,
            setUser,
            isAdmin,
            loading
        }}>
            {children}
        </userContext.Provider>
    )
}