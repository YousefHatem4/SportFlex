// src/App.jsx
import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Home from './components/Home/Home'
import Register from './components/Register/Register'
import Cart from './components/Cart/Cart'
import About from './components/About/About'
import Category from './components/Category/Category'
import Contact from './components/Contact/Contact'
import Login from './components/Login/Login'
import NotFound from './components/NotFound/NotFound'
import Products from './components/Products/Products'
import Wishlist from './components/Wishlist/Wishlist'
import UserContextProvider from './Context/userContext'
import ForgetPass from './components/ForgetPass/ForgetPass'
import VerfiyCode from './components/VerfiyCode/VerfiyCode'
import ResetPassword from './components/ResetPassword/ResetPassword'
import ProductDetails from './components/ProductDetails/ProductDetails'
import Checkout from './components/CheckOut/Checkout'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import AdminProtectedRoute from './components/AdminProtectedRoute/AdminProtectedRoute'
import Admin from './components/Admin/Admin'
import OrderDetails from './components/OrderDetails/OrderDetails'

const routers = createBrowserRouter([
  {
    path: "",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'register', element: <Register /> },
      { path: 'cart', element: <ProtectedRoute><Cart /></ProtectedRoute> },
      { path: 'about', element: <About /> },
      { path: 'category', element: <Category /> },
      { path: 'contact', element: <Contact /> },
      { path: 'login', element: <Login /> },
      { path: 'Products', element: <Products /> },
      { path: 'wishlist', element: <ProtectedRoute><Wishlist /></ProtectedRoute> },
      { path: 'forgetpass', element: <ForgetPass /> },
      { path: 'verfiycode', element: <VerfiyCode /> },
      { path: 'resetpassword', element: <ResetPassword /> },
      { path: 'checkout', element: <ProtectedRoute><Checkout /></ProtectedRoute> },
      { path: 'admin', element: <AdminProtectedRoute><Admin /></AdminProtectedRoute> },
      { path: 'order/:orderId', element: <AdminProtectedRoute><OrderDetails /></AdminProtectedRoute> },
      { path: 'productdetails/:id', element: <ProductDetails /> },
      { path: '*', element: <NotFound /> },
    ]
  }
])

function App() {
  return (
    <UserContextProvider>
      <RouterProvider router={routers}></RouterProvider>
    </UserContextProvider>
  )
}

export default App