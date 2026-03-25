// src/App.jsx
import { Suspense, lazy } from 'react'
import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import UserContextProvider from './Context/userContext'
import Loading from './components/Loading/Loading'

const Layout = lazy(() => import('./components/Layout/Layout'))
const Home = lazy(() => import('./components/Home/Home'))
const Register = lazy(() => import('./components/Register/Register'))
const Cart = lazy(() => import('./components/Cart/Cart'))
const About = lazy(() => import('./components/About/About'))
const Category = lazy(() => import('./components/Category/Category'))
const Contact = lazy(() => import('./components/Contact/Contact'))
const Login = lazy(() => import('./components/Login/Login'))
const NotFound = lazy(() => import('./components/NotFound/NotFound'))
const Products = lazy(() => import('./components/Products/Products'))
const Wishlist = lazy(() => import('./components/Wishlist/Wishlist'))
const ProductDetails = lazy(() => import('./components/ProductDetails/ProductDetails'))
const Checkout = lazy(() => import('./components/CheckOut/Checkout'))
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute/ProtectedRoute'))
const AdminProtectedRoute = lazy(() => import('./components/AdminProtectedRoute/AdminProtectedRoute'))
const Admin = lazy(() => import('./components/Admin/Admin'))
const OrderDetails = lazy(() => import('./components/OrderDetails/OrderDetails'))
const ProductDetailsAdmin = lazy(() => import('./components/ProductdetailsAdmin/ProductdetailsAdmin'))
const ProductEditAdmin = lazy(() => import('./components/ProductEditAdmin/ProductEditAdmin'))

const withSuspense = (element) => (
  <Suspense fallback={<Loading />}>
    {element}
  </Suspense>
);

const routers = createBrowserRouter([
  {
    path: "",
    element: withSuspense(<Layout />),
    children: [
      { index: true, element: withSuspense(<Home />) },
      { path: 'register', element: withSuspense(<Register />) },
      { path: 'cart', element: withSuspense(<ProtectedRoute><Cart /></ProtectedRoute>) },
      { path: 'about', element: withSuspense(<About />) },
      { path: 'category', element: withSuspense(<Category />) },
      { path: 'contact', element: withSuspense(<Contact />) },
      { path: 'login', element: withSuspense(<Login />) },
      { path: 'Products', element: withSuspense(<Products />) },
      { path: 'wishlist', element: withSuspense(<ProtectedRoute><Wishlist /></ProtectedRoute>) },
      { path: 'checkout', element: withSuspense(<ProtectedRoute><Checkout /></ProtectedRoute>) },
      { path: 'admin', element: withSuspense(<AdminProtectedRoute><Admin /></AdminProtectedRoute>) },
      { path: 'order/:orderId', element: withSuspense(<AdminProtectedRoute><OrderDetails /></AdminProtectedRoute>) },
      { path: 'productdetails/:id', element: withSuspense(<ProductDetails />) },
      {
        path: 'productdetailsadmin/:id', element: withSuspense(<AdminProtectedRoute><ProductDetailsAdmin /></AdminProtectedRoute>) },
      {
        path: 'editproductdetailsadmin/:id', element: withSuspense(<AdminProtectedRoute><ProductEditAdmin /></AdminProtectedRoute>) },
      { path: '*', element: withSuspense(<NotFound />) },
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
