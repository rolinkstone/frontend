import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/DashboardLayout';
import React from 'react';

const ITEMS_PER_PAGE = 10;
const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

export default function PaymentsPage() {
    const [payments, setPayments] = useState([]);
    const [filteredPayments, setFilteredPayments] = useState([]);
    const [formData, setFormData] = useState({
        sale_id: '',
        payment_date: '',
        amount: '',
        payment_method: '',
        transaction_reference: '',
        status: '',
    });
    const [editId, setEditId] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
    const router = useRouter();
    const idleTimer = useState(null); // Reference for the idle timer

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        } else {
            fetchPayments();
        }

        resetIdleTimer();
        window.addEventListener('mousemove', resetIdleTimer);
        window.addEventListener('keydown', resetIdleTimer);

        return () => {
            clearTimeout(idleTimer.current);
            window.removeEventListener('mousemove', resetIdleTimer);
            window.removeEventListener('keydown', resetIdleTimer);
        };
    }, [router]);

    const fetchPayments = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found in localStorage');
            return;
        }

        try {
            const res = await axios.get('http://202.10.41.174:5000/api/payments', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.status === 200 && Array.isArray(res.data.data)) {
                const data = res.data.data;
                setPayments(data);
                setFilteredPayments(data);
                setTotalItems(data.length);
            } else {
                console.warn('Unexpected response structure:', res);
                setPayments([]);
                setFilteredPayments([]);
                setTotalItems(0);
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
            setPayments([]);
            setFilteredPayments([]);
            setTotalItems(0);
        }
    };

    useEffect(() => {
        const filtered = payments.filter(item =>
            item.transaction_reference.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredPayments(filtered);
        setTotalItems(filtered.length);
        setCurrentPage(1); // Reset to the first page when searching
    }, [searchTerm, payments]);

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
                await axios.put(`http://202.10.41.174:5000/api/payments/${editId}`, formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setNotificationMessage('Payment berhasil diperbarui!');
            } else {
                await axios.post('http://202.10.41.174:5000/api/payments', formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setNotificationMessage('Payment berhasil ditambahkan!');
            }

            setFormData({
                sale_id: '',
                payment_date: '',
                amount: '',
                payment_method: '',
                transaction_reference: '',
                status: '',
            });
            setEditId(null);
            fetchPayments();
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
        localStorage.removeItem('token');
        router.push('/login');
        setNotificationMessage('Anda telah logout karena tidak ada aktivitas selama 10 menit.');
        setModalOpen(true);
    };

    const handleEdit = (id) => {
        const paymentToEdit = payments.find(item => item.id === id);
        setFormData({
            sale_id: paymentToEdit.sale_id,
            payment_date: paymentToEdit.payment_date,
            amount: paymentToEdit.amount,
            payment_method: paymentToEdit.payment_method,
            transaction_reference: paymentToEdit.transaction_reference,
            status: paymentToEdit.status,
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
            await axios.delete(`http://202.10.41.174:5000/api/payments/${itemToDelete}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotificationMessage('Payment berhasil dihapus!');
            setConfirmDeleteModalOpen(false);
            fetchPayments();
        } catch (error) {
            setNotificationMessage('Terjadi kesalahan saat menghapus payment!');
            setConfirmDeleteModalOpen(false);
        }
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setConfirmDeleteModalOpen(false);
    };

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
        const sortedPayments = [...filteredPayments].sort((a, b) => {
            if (a[key] < b[key]) {
                return direction === 'ascending' ? -1 : 1;
            }
            if (a[key] > b[key]) {
                return direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        setFilteredPayments(sortedPayments);
    };

    const paginatedItems = filteredPayments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return (
        <DashboardLayout>
            <div className="max-w-5xxl mx-auto p-6 shadow-md rounded-lg">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Manajemen Pembayaran</h2>

                <form className="space-y-6 mb-8" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Sale ID</label>
                            <input
                                name="sale_id"
                                type="text"
                                value={formData.sale_id}
                                onChange={handleInputChange}
                                placeholder="Sale ID"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tanggal Pembayaran</label>
                            <input
                                name="payment_date"
                                type="datetime-local"
                                value={formData.payment_date}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Jumlah</label>
                            <input
                                name="amount"
                                type="number"
                                value={formData.amount}
                                onChange={handleInputChange}
                                placeholder="Jumlah"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Metode Pembayaran</label>
                            <select
                                name="payment_method"
                                value={formData.payment_method}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                <option value="Cash">Cash</option>
                                <option value="Credit Card">Credit Card</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Referensi Transaksi</label>
                            <input
                                name="transaction_reference"
                                type="text"
                                value={formData.transaction_reference}
                                onChange={handleInputChange}
                                placeholder="Referensi Transaksi"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                <option value="Pending">Pending</option>
                                <option value="Completed">Completed</option>
                                <option value="Failed">Failed</option>
                            </select>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        {editId ? 'Update Payment' : 'Add Payment'}
                    </button>
                </form>

                <input
                    type="text"
                    placeholder="Search by Transaction Reference"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-4 p-2 border border-gray-300 rounded-md"
                />

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('id')}>Payment ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('sale_id')}>Sale ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('payment_date')}>Tanggal Pembayaran</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('amount')}>Jumlah</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('payment_method')}>Metode Pembayaran</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('transaction_reference')}>Referensi Transaksi</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('status')}>Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedItems.map((payment) => (
                            <tr key={payment.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.sale_id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(payment.payment_date).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.amount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.payment_method}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.transaction_reference}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.status}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onClick={() => handleEdit(payment.id)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                    <button onClick={() => handleDelete(payment.id)} className="text-red-600 hover:text-red-900 ml-4">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="mt-4">
                    <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-gray-200 rounded-md mr-2">Previous</button>
                    <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage * ITEMS_PER_PAGE >= totalItems} className="px-4 py-2 bg-gray-200 rounded-md">Next</button>
                </div>

                {/* Notification Modal */}
                {modalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded shadow-md">
                            <h3 className="font-bold">{notificationMessage}</h3>
                            <button onClick={closeModal} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded">Close</button>
                        </div>
                    </div>
                )}

                {/* Confirm Delete Modal */}
                {confirmDeleteModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded shadow-md">
                            <h3 className="font-bold">Are you sure you want to delete this payment?</h3>
                            <button onClick={confirmDelete} className="mt-4 bg-red-600 text-white px-4 py-2 rounded">Yes, Delete</button>
                            <button onClick={closeModal} className="mt-4 bg-gray-200 text-black px-4 py-2 rounded ml-2">Cancel</button>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
