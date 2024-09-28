import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/DashboardLayout';
import React from 'react';

const ITEMS_PER_PAGE = 10;
const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

export default function CustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [formData, setFormData] = useState({ customer_name: '', email: '', phone: '', address: '', loyalty_points: 0 });
    const [editId, setEditId] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: '' }); // State to handle sorting
    const router = useRouter();
    const idleTimer = useState(null); // Reference for the idle timer

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        } else {
            fetchCustomers();
        }

        // Set idle timeout when component mounts
        resetIdleTimer();

        // Add event listeners to detect user activity
        window.addEventListener('mousemove', resetIdleTimer);
        window.addEventListener('keydown', resetIdleTimer);

        // Cleanup event listeners when component unmounts
        return () => {
            clearTimeout(idleTimer.current);
            window.removeEventListener('mousemove', resetIdleTimer);
            window.removeEventListener('keydown', resetIdleTimer);
        };
    }, [router]);

    const fetchCustomers = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found in localStorage');
            return;
        }

        try {
            const res = await axios.get('http://202.10.41.174:5000/api/customers', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.status === 200 && Array.isArray(res.data.data)) {
                const data = res.data.data;
                setCustomers(data);
                setFilteredCustomers(data);
                setTotalItems(data.length);
            } else {
                console.warn('Unexpected response structure:', res);
                setCustomers([]);
                setFilteredCustomers([]);
                setTotalItems(0);
            }
        } catch (error) {
            if (error.response) {
                console.error('API responded with an error:', error.response.data);
            } else if (error.request) {
                console.error('No response received from the API:', error.request);
            } else {
                console.error('Error setting up the request:', error.message);
            }
            setCustomers([]);
            setFilteredCustomers([]);
            setTotalItems(0);
        }
    };

    useEffect(() => {
        const filtered = customers.filter(item =>
            item.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCustomers(filtered);
        setTotalItems(filtered.length);
        setCurrentPage(1); // Reset to the first page when searching
    }, [searchTerm, customers]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!token) {
            setNotificationMessage('Token tidak ditemukan. Harap login terlebih dahulu.');
            setModalOpen(true);
            return;
        }

        try {
            if (editId) {
                await axios.put(`http://202.10.41.174:5000/api/customers/${editId}`, formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setNotificationMessage('Customer berhasil diperbarui!');
            } else {
                await axios.post('http://202.10.41.174:5000/api/customers', formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setNotificationMessage('Customer berhasil ditambahkan!');
            }

            setFormData({ customer_name: '', email: '', phone: '', address: '', loyalty_points: 0 });
            setEditId(null);
            fetchCustomers();
            setModalOpen(true);
        } catch (error) {
            setNotificationMessage('Terjadi kesalahan saat memproses data!');
            setModalOpen(true);
        }
    };

    const resetIdleTimer = () => {
        clearTimeout(idleTimer.current);
        idleTimer.current = setTimeout(() => {
            destroyToken();
        }, IDLE_TIMEOUT);
    };

    const destroyToken = () => {
        localStorage.removeItem('token'); // Hapus token dari localStorage
        router.push('/login'); // Redirect ke halaman login
        setNotificationMessage('Anda telah logout karena tidak ada aktivitas selama 10 menit.');
        setModalOpen(true);
    };

    const handleEdit = (id) => {
        const customerToEdit = customers.find(item => item.id === id);
        setFormData({ 
            customer_name: customerToEdit.customer_name, 
            email: customerToEdit.email,
            phone: customerToEdit.phone,
            address: customerToEdit.address,
            loyalty_points: customerToEdit.loyalty_points
        });
        setEditId(id);
    };

    const handleDelete = (id) => {
        setItemToDelete(id);
        setConfirmDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://202.10.41.174:5000/api/customers/${itemToDelete}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotificationMessage('Customer berhasil dihapus!');
            setConfirmDeleteModalOpen(false);
            fetchCustomers();
        } catch (error) {
            setNotificationMessage('Terjadi kesalahan saat menghapus customer!');
            setConfirmDeleteModalOpen(false);
        }
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setConfirmDeleteModalOpen(false);
    };

    // Sorting logic
    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        const sortedCustomers = [...filteredCustomers].sort((a, b) => {
            if (a[key] < b[key]) {
                return direction === 'ascending' ? -1 : 1;
            }
            if (a[key] > b[key]) {
                return direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        setFilteredCustomers(sortedCustomers);
    };

    const paginatedItems = filteredCustomers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return (
        <DashboardLayout>
            <div className="max-w-5xxl mx-auto p-6 shadow-md rounded-lg">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Manajemen Customer</h2>

                <form className="space-y-6 mb-8" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Customer</label>
                            <input
                                name="customer_name"
                                type="text"
                                value={formData.customer_name}
                                onChange={handleInputChange}
                                placeholder="Nama Customer"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="Email"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <input
                                name="phone"
                                type="text"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="Phone"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Address</label>
                            <input
                                name="address"
                                type="text"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="Address"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Loyalty Points</label>
                            <input
                                name="loyalty_points"
                                type="number"
                                value={formData.loyalty_points}
                                onChange={handleInputChange}
                                placeholder="Loyalty Points"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {editId ? 'Perbarui Customer' : 'Tambah Customer'}
                        </button>
                    </div>
                </form>

                {/* Sorting and Search */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex space-x-4">
                        <button
                            onClick={() => handleSort('customer_name')}
                            className="text-sm font-medium text-gray-700"
                        >
                            Sort by Name
                        </button>
                        <button
                            onClick={() => handleSort('loyalty_points')}
                            className="text-sm font-medium text-gray-700"
                        >
                            Sort by Loyalty Points
                        </button>
                    </div>
                    <input
                        type="text"
                        placeholder="Cari Customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>

                {/* Customer Table */}
                <table className="min-w-full bg-white rounded-md shadow-md overflow-hidden">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Nama Customer</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Phone</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Address</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Loyalty Points</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedItems.length > 0 ? (
                            paginatedItems.map(customer => (
                                <tr key={customer.id}>
                                    <td className="px-4 py-2 text-sm text-gray-700">{customer.customer_name}</td>
                                    <td className="px-4 py-2 text-sm text-gray-700">{customer.email}</td>
                                    <td className="px-4 py-2 text-sm text-gray-700">{customer.phone}</td>
                                    <td className="px-4 py-2 text-sm text-gray-700">{customer.address}</td>
                                    <td className="px-4 py-2 text-sm text-gray-700">{customer.loyalty_points}</td>
                                    <td className="px-4 py-2">
                                        <button
                                            onClick={() => handleEdit(customer.id)}
                                            className="text-indigo-600 hover:text-indigo-900 text-sm"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(customer.id)}
                                            className="text-red-600 hover:text-red-900 text-sm ml-4"
                                        >
                                            Hapus
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-4 py-2 text-center text-sm text-gray-700">No customers found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="mt-4 flex justify-end">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className={`mr-2 px-3 py-1 border ${currentPage === 1 ? 'border-gray-300 text-gray-300' : 'border-gray-600 text-gray-600 hover:bg-gray-100'}`}
                    >
                        Previous
                    </button>
                    <span className="mx-2">{currentPage} of {totalPages}</span>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className={`ml-2 px-3 py-1 border ${currentPage === totalPages ? 'border-gray-300 text-gray-300' : 'border-gray-600 text-gray-600 hover:bg-gray-100'}`}
                    >
                        Next
                    </button>
                </div>

                {/* Modal for Notifications */}
                {modalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded shadow-md">
                            <p>{notificationMessage}</p>
                            <button
                                onClick={closeModal}
                                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {/* Confirm Delete Modal */}
                {confirmDeleteModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded shadow-md">
                            <p>Apakah anda yakin ingin menghapus customer ini?</p>
                            <div className="mt-4 flex space-x-4">
                                <button
                                    onClick={confirmDelete}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                                >
                                    Hapus
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700"
                                >
                                    Batal
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
