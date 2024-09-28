// components/DashboardLayout.js
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { FaHome, FaBox, FaUsers, FaShoppingCart, FaCog, FaSignOutAlt, FaTruck, FaListAlt, FaCreditCard,  FaSearch, FaBell, FaAngleDown } from 'react-icons/fa';

export default function DashboardLayout({ children }) {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const handleLogout = () => {
        // Remove the token from local storage
        localStorage.removeItem('token');

        // Redirect to the login page
        router.push('/login');
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className={`transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-16'} bg-gray-800 text-white`}>
                <div className="p-4 flex justify-between">
                    <h1 className={`text-2xl font-bold transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'} whitespace-nowrap`}>
                        Dashboard
                    </h1>
                    <button 
                        className="text-xl text-white hover:text-gray-300" 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        ☰
                    </button>
                </div>
                <nav className="mt-6 space-y-2">
                    <div className="space-y-2">
                        <p className={`text-sm font-semibold uppercase transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                            Home
                        </p>
                        <Link href="/" className="flex items-center py-2 px-4 rounded hover:bg-gray-700 transition-all duration-300">
                            <FaHome className="text-lg" />
                            {isSidebarOpen && <span className="ml-4">Beranda</span>}
                        </Link>
                    </div>

                    <div className="space-y-2">
                        <p className={`text-sm font-semibold uppercase transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                            Master
                        </p>
                        <Link href="/suppliers" className="flex items-center py-2 px-4 rounded hover:bg-gray-700 transition-all duration-300">
                            <FaTruck className="text-lg" />
                            {isSidebarOpen && <span className="ml-4">Suppliers</span>}
                        </Link>
                        <Link href="/categories" className="flex items-center py-2 px-4 rounded hover:bg-gray-700 transition-all duration-300">
                            <FaListAlt className="text-lg" />
                            {isSidebarOpen && <span className="ml-4">Categories</span>}
                        </Link>
                        <Link href="/products" className="flex items-center py-2 px-4 rounded hover:bg-gray-700 transition-all duration-300">
                            <FaBox className="text-lg" />
                            {isSidebarOpen && <span className="ml-4">Products</span>}
                        </Link>
                        <Link href="/customers" className="flex items-center py-2 px-4 rounded hover:bg-gray-700 transition-all duration-300">
                            <FaUsers className="text-lg" />
                            {isSidebarOpen && <span className="ml-4">Customers</span>}
                        </Link>
                    </div>

                    <div className="space-y-2">
                        <p className={`text-sm font-semibold uppercase transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                            Transaksi
                        </p>
                        <Link href="/sales" className="flex items-center py-2 px-4 rounded hover:bg-gray-700 transition-all duration-300">
                            <FaShoppingCart className="text-lg" />
                            {isSidebarOpen && <span className="ml-4">Sales</span>}
                        </Link>
                        <Link href="/payments" className="flex items-center py-2 px-4 rounded hover:bg-gray-700 transition duration-300">
                            <FaCreditCard className="text-lg" /> {/* Changed icon to FaCreditCard */}
                            {isSidebarOpen && <span className="ml-4">Payment</span>}
                        </Link>
                    </div>

                    <div className="space-y-2">
                        <p className={`text-sm font-semibold uppercase transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                            Pengaturan
                        </p>
                        <Link href="#" className="flex items-center py-2 px-4 rounded hover:bg-gray-700 transition-all duration-300">
                            <FaCog className="text-lg" />
                            {isSidebarOpen && <span className="ml-4">User</span>}
                        </Link>
                    </div>

                    <button 
                        onClick={handleLogout} 
                        className="flex items-center py-2 px-4 rounded hover:bg-gray-700 transition-all duration-300 w-full text-left"
                    >
                        <FaSignOutAlt className="text-lg" />
                        {isSidebarOpen && <span className="ml-4">Logout</span>}
                    </button>
                </nav>
            </aside>

            <div className="flex-1 flex flex-col"> 
                {/* Top Menu Bar */}
                <div className="bg-gray-800 p-4 flex items-center justify-between text-white">
                    <div className="flex items-center"> 
                        
                       
                    </div>
                    <div className="flex items-center">
                        <button className="text-white mr-4">
                            <FaBell />
                        </button>
                        <div className="flex items-center">
                            <img 
                                src="https://via.placeholder.com/32" 
                                alt="User profile"
                                className="rounded-full w-8 h-8 mr-2"
                            />
                            <div className="text-white">
                                <p className="text-sm font-semibold">Alina McWard</p>
                                <p className="text-xs">VP People Manage</p>
                                
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <main className="flex-1 p-6 overflow-y-auto bg-white">
                    {children} 
                </main>
            </div>
            </div>
    );
}



