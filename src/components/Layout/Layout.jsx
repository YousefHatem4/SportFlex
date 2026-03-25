import { memo } from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster } from "react-hot-toast";
import Navbar from '../Navbar/Navbar'
import Footer from '../Footer/Footer'
import ScrollToTop from '../ScrollToTop/ScrollToTop'

const TOASTER_OPTIONS = {
    success: {
        style: { background: "green", color: "white" },
    },
    error: {
        style: { background: "red", color: "white" },
    },
};

function Layout() {
    return (
        <>
            <ScrollToTop />
            <Navbar />
            <Outlet />
            <Toaster
                position="top-right"
                reverseOrder={false}
                toastOptions={TOASTER_OPTIONS}
            />
            <Footer />
        </>
    );
}

export default memo(Layout);
