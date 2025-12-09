import React from 'react'
import style from './Layout.module.css'
import Navbar from '../Navbar/Navbar'
import { Outlet } from 'react-router-dom'
import Footer from '../Footer/Footer'
import { Toaster } from "react-hot-toast";


export default function Layout() {
    return <>

        <Navbar />
        <Outlet></Outlet>
        {/* Toast container (must be included once in your app) */}
        <Toaster
            position="top-right"
            reverseOrder={false}
            toastOptions={{
                success: {
                    style: { background: "green", color: "white" },
                },
                error: {
                    style: { background: "red", color: "white" },
                },
            }}
        />
        <Footer />
    </>
}
