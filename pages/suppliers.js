import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/DashboardLayout';
import React from 'react';

const ITEMS_PER_PAGE = 10;
const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    const [formData, setFormData] = useState({ supplier_name: '', contact_person: '', phone: '', email: '', address: '' });
    const [editId, setEditId] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();
    const idleTimer = useState(null); // Reference for the idle timer

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        } else {
            fetchSuppliers();
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

    const fetchSuppliers = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found in localStorage');
            return;
        }

        try {
            const res = await axios.get('http://202.10.41.174:5000/api/suppliers', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.status === 200 && Array.isArray(res.data.data)) {
                const data = res.data.data;
                setSuppliers(data);
                setFilteredSuppliers(data);
                setTotalItems(data.length);
            } else {
                setSuppliers([]);
                setFilteredSuppliers([]);
                setTotalItems(0);
            }
        } catch (error) {
            setSuppliers([]);
            setFilteredSuppliers([]);
            setTotalItems(0);
        }
    };

    useEffect(() => {
        const filtered = suppliers.filter(item =>
            item.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredSuppliers(filtered);
        setTotalItems(filtered.length);
        setCurrentPage(1); // Reset to the first page when searching
    }, [searchTerm, suppliers]);

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
                await axios.put(`http://202.10.41.174:5000/api/suppliers/${editId}`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setNotificationMessage('Supplier berhasil diperbarui!');
            } else {
                await axios.post('http://202.10.41.174:5000/api/suppliers', formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setNotificationMessage('Supplier berhasil ditambahkan!');
            }
    
            setFormData({ supplier_name: '', contact_person: '', phone: '', email: '', address: '' });
            setEditId(null);
            fetchSuppliers();
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
        const supplierToEdit = suppliers.find(item => item.id === id);
        setFormData({
            supplier_name: supplierToEdit.supplier_name,
            contact_person: supplierToEdit.contact_person,
            phone: supplierToEdit.phone,
            email: supplierToEdit.email,
            address: supplierToEdit.address
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
            await axios.delete(`http://202.10.41.174:5000/api/suppliers/${itemToDelete}`, {
                headers: {
                    'Authorization': `Bearer ${token}` 
                }
            });
            setNotificationMessage('Supplier berhasil dihapus!');
            setConfirmDeleteModalOpen(false);
            fetchSuppliers();
        } catch (error) {
            setNotificationMessage('Terjadi kesalahan saat menghapus supplier!');
            setConfirmDeleteModalOpen(false);
        }
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setConfirmDeleteModalOpen(false);
    };

    const paginatedItems = filteredSuppliers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return (
        <DashboardLayout>
            <div className="max-w-5xxl mx-auto p-6 shadow-md rounded-lg">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Manajemen Supplier</h2>

                {/* Form */}
                <form className="space-y-6 mb-8" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Supplier</label>
                            <input
                                name="supplier_name"
                                type="text"
                                value={formData.supplier_name}
                                onChange={handleInputChange}
                                placeholder="Nama Supplier"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                            <input
                                name="contact_person"
                                type="text"
                                value={formData.contact_person}
                                onChange={handleInputChange}
                                placeholder="Contact Person"
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
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Address</label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="Address"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            ></textarea>
                       </div> 
                    </div>
                    <div className="flex justify-end">
                    <button
                            type="submit"
                            className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {editId ? 'Update Supplier' : 'Tambah Supplier'}
                        </button>
                </div>
            </form>

            {/* Search Bar */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Cari Supplier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>

            {/* Table */}
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Supplier</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedItems.map((supplier) => (
                        <tr key={supplier.id}>
                            <td className="px-6 py-4 whitespace-nowrap">{supplier.supplier_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{supplier.contact_person}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{supplier.phone}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{supplier.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <button onClick={() => handleEdit(supplier.id)} className="text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                                <button onClick={() => handleDelete(supplier.id)} className="text-red-600 hover:text-red-900">Hapus</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination */}
            <div className="mt-4">
                <button
                    onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className="mr-2 px-4 py-2 border border-gray-300 rounded-md"
                >
                    Prev
                </button>
                <span>{currentPage} / {totalPages}</span>
                <button
                    onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-2 px-4 py-2 border border-gray-300 rounded-md"
                >
                    Next
                </button>
            </div>
        </div>

        {/* Notifications */}
        {modalOpen && (
            <div className="fixed z-10 inset-0 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="bg-white rounded-lg p-6 shadow-lg">
                        <h3 className="text-lg font-medium">{notificationMessage}</h3>
                        <div className="mt-4 flex justify-end">
                            <button onClick={closeModal} className="px-4 py-2 bg-indigo-600 text-white rounded-md">OK</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Confirm Delete Modal */}
        {confirmDeleteModalOpen && (
            <div className="fixed z-10 inset-0 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="bg-white rounded-lg p-6 shadow-lg">
                        <h3 className="text-lg font-medium">Apakah Anda yakin ingin menghapus supplier ini?</h3>
                        <div className="mt-4 flex justify-end">
                            <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-md mr-2">Hapus</button>
                            <button onClick={closeModal} className="px-4 py-2 bg-gray-300 rounded-md">Batal</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </DashboardLayout>
);
}