import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/DashboardLayout';
import React from 'react';

const ITEMS_PER_PAGE = 10;
const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 menit dalam milidetik

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [formData, setFormData] = useState({ category_name: '', description: '' });
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
            fetchCategories();
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

    const fetchCategories = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found in localStorage');
            return;
        }

        try {
            const res = await axios.get('http://localhost:5000/api/categories', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.status === 200 && Array.isArray(res.data.data)) {
                const data = res.data.data;
                setCategories(data);
                setFilteredCategories(data);
                setTotalItems(data.length);
            } else {
                console.warn('Unexpected response structure:', res);
                setCategories([]);
                setFilteredCategories([]);
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
            setCategories([]);
            setFilteredCategories([]);
            setTotalItems(0);
        }
    };

    useEffect(() => {
        const filtered = categories.filter(item =>
            item.category_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCategories(filtered);
        setTotalItems(filtered.length);
        setCurrentPage(1); // Reset to the first page when searching
    }, [searchTerm, categories]);

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
                await axios.put(`http://localhost:5000/api/categories/${editId}`, formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setNotificationMessage('Category berhasil diperbarui!');
            } else {
                await axios.post('http://localhost:5000/api/categories', formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setNotificationMessage('Category berhasil ditambahkan!');
            }

            setFormData({ category_name: '', description: '' });
            setEditId(null);
            fetchCategories();
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
        const categoryToEdit = categories.find(item => item.id === id);
        setFormData({ category_name: categoryToEdit.category_name, description: categoryToEdit.description });
        setEditId(id);
    };

    const handleDelete = (id) => {
        setItemToDelete(id);
        setConfirmDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:5000/api/categories/${itemToDelete}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotificationMessage('Category berhasil dihapus!');
            setConfirmDeleteModalOpen(false);
            fetchCategories();
        } catch (error) {
            setNotificationMessage('Terjadi kesalahan saat menghapus category!');
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
        const sortedCategories = [...filteredCategories].sort((a, b) => {
            if (a[key] < b[key]) {
                return direction === 'ascending' ? -1 : 1;
            }
            if (a[key] > b[key]) {
                return direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        setFilteredCategories(sortedCategories);
    };

    const paginatedItems = filteredCategories.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return (
        <DashboardLayout>
            <div className="max-w-5xxl mx-auto p-6 shadow-md rounded-lg">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Manajemen Kategori</h2>

                <form className="space-y-6 mb-8" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Kategori</label>
                            <input
                                name="category_name"
                                type="text"
                                value={formData.category_name}
                                onChange={handleInputChange}
                                placeholder="Nama Kategori"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Deskripsi"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {editId ? 'Perbarui Kategori' : 'Tambah Kategori'}
                        </button>
                    </div>
                </form>

                <div className="flex justify-between items-center mb-4">   
                        <input
                            type="text"
                            placeholder="Cari Produk..."
                            className="border border-gray-300 rounded-md px-2 py-1"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                        <thead>
                            <tr>
                                <th
                                    className="px-6 py-3 bg-gray-100 border-b border-gray-200 text-gray-600 font-semibold text-sm text-left cursor-pointer"
                                    onClick={() => handleSort('category_name')}
                                >
                                    Nama Kategori {sortConfig.key === 'category_name' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                </th>
                                <th
                                    className="px-6 py-3 bg-gray-100 border-b border-gray-200 text-gray-600 font-semibold text-sm text-left cursor-pointer"
                                    onClick={() => handleSort('description')}
                                >
                                    Deskripsi {sortConfig.key === 'description' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                                </th>
                                <th className="px-6 py-3 bg-gray-100 border-b border-gray-200 text-gray-600 font-semibold text-sm text-left">
                                    Aksi
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedItems.map(category => (
                                <tr key={category.id}>
                                    <td className="px-6 py-4 border-b border-gray-200">{category.category_name}</td>
                                    <td className="px-6 py-4 border-b border-gray-200">{category.description}</td>
                                    <td className="px-6 py-4 border-b border-gray-200">
                                        <button
                                            onClick={() => handleEdit(category.id)}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category.id)}
                                            className="ml-4 text-red-600 hover:text-red-900"
                                        >
                                            Hapus
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-gray-700">
                        Halaman {currentPage} dari {totalPages}
                    </span>
                    <div>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`mx-1 px-3 py-1 rounded-md border ${
                                    currentPage === page
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white text-indigo-600 border-indigo-600'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Modal for notifications */}
                {modalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <p>{notificationMessage}</p>
                            <button
                                onClick={closeModal}
                                className="mt-4 py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                )}

                {/* Confirmation Modal for deletion */}
                {confirmDeleteModalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <p>Anda yakin ingin menghapus kategori ini?</p>
                            <div className="mt-4 flex space-x-4">
                                <button
                                    onClick={confirmDelete}
                                    className="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700"
                                >
                                    Hapus
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700"
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
