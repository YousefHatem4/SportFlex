import React, { useState } from 'react'
import { useFormik } from 'formik'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import Loading from '../Loading/Loading'

export default function VerifyCode() {
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const navigate = useNavigate()

    async function handleVerifyCode(values) {
        try {
            setIsLoading(true)
            setErrorMessage('')
            setSuccessMessage('')

            const { data } = await axios.post(
                'https://ecommerce.routemisr.com/api/v1/auth/verifyResetCode',
                { resetCode: values.code }
            )

            setSuccessMessage('Code verified successfully!')
            setTimeout(() => {
                navigate('/resetpassword')
            }, 1500)

        } catch (error) {
            console.log(error.response?.data?.message || error.message)
            setErrorMessage(error.response?.data?.message || 'Invalid verification code. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const formik = useFormik({
        initialValues: {
            resetCode: "",
        },
        onSubmit: handleVerifyCode
    })

    return (
        <div className="min-h-screen bg-gray-50 flex md:py-10">
            {/* Image Section - Hidden on mobile */}
            <div className="hidden md:block w-1/2 bg-gray-100">
                <img
                    src="Auth_Image.jpg"
                    alt="e-commerce"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Form Section */}
            <div className="w-full md:w-1/2 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <h2 className="text-center text-3xl font-extrabold text-gray-900">
                        Verify Reset Code
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Enter the verification code sent to your email
                    </p>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        {errorMessage && (
                            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">{errorMessage}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {successMessage && (
                            <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-green-700">{successMessage}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form className="space-y-6" onSubmit={formik.handleSubmit}>
                            <div>
                                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                                    Verification Code
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="code"
                                        name="code"
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        autoComplete="one-time-code"
                                        required
                                        value={formik.values.code}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#DB4444] focus:border-[#DB4444] sm:text-sm text-center tracking-widest"
                                        placeholder="6-digit code"
                                        maxLength="6"
                                    />
                                </div>
                                <p className="mt-2 text-sm text-gray-500">
                                    Check your email for the verification code
                                </p>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#DB4444] hover:bg-[#b53737] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#DB4444] transition-colors duration-300"
                                >
                                    {isLoading ? (
                                        <div className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Verifying...
                                        </div>
                                    ) : (
                                        'Verify Code'
                                    )}
                                </button>
                            </div>

                            <div className="text-center text-sm text-gray-500">
                                Didn't receive a code?{' '}
                                <button
                                    type="button"
                                    className="font-medium text-[#DB4444] hover:text-[#b53737] cursor-pointer"
                                    onClick={() => navigate('/forgetpass')}
                                >
                                    Resend code
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}