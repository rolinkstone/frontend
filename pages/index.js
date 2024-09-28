// pages/index.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import jwt from 'jsonwebtoken';  // Import jsonwebtoken
import Layout from '../components/DashboardLayout';
import React from 'react';

const Home = () => {
    const router = useRouter();
    const [userId, setUserId] = useState(null); // State to store user ID

    useEffect(() => {
        // Check for the token in local storage
        const token = localStorage.getItem('token');

        // If there is no token, redirect to login
        if (!token) {
            router.push('/login');
        } else {
            // Decode the token to get user ID
            const decodedToken = jwt.decode(token);
            if (decodedToken) {
                setUserId(decodedToken.id);  // Set user ID in state
            }
        }
    }, [router]);

    return (
        <Layout>
            <div className="flex flex-col items-center justify-center">
                <h1 className="text-4xl font-bold mb-4">Selamat Datang di Aplikasi Kasir Versi 1!</h1>
                <p className="text-lg mb-6">Aplikasi ini akan selalu diupdate.</p>
                {userId && <p className="text-lg">User ID: {userId}</p>} {/* Display user ID */}
                <nav>
                    {/* Add your navigation items here */}
                </nav>
            </div>
        </Layout>
    );
};

export default Home;
