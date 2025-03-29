import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const useApiInterceptor = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401 || error.response?.status === 403) {
                    // Clear localStorage
                    localStorage.clear();
                    // Navigate to home page
                    navigate('/');
                }
                return Promise.reject(error);
            }
        );

        // Cleanup function to remove the interceptor when component unmounts
        return () => {
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, [navigate]);
};

export default useApiInterceptor;
