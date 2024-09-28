import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/DashboardLayout';
import React from 'react';

const ITEMS_PER_PAGE = 10;
const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({ product_name: '', category_id: '', supplier_id: '', price: '', cost_price: '', stock: '', reorder_level: '', barcode: '', description: '' });
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
  
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const handleView = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const closesModal = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
    };
   
 

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        } else {
            fetchProducts();
            fetchSuppliers();
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

    const fetchProducts = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await axios.get('http://localhost:5000/api/products', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 200 && Array.isArray(res.data.data)) {
                const data = res.data.data;
                setProducts(data);
                setFilteredProducts(data);
                setTotalItems(data.length);
            } else {
                setProducts([]);
                setFilteredProducts([]);
                setTotalItems(0);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
            setFilteredProducts([]);
            setTotalItems(0);
        }
    };

    const fetchSuppliers = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await axios.get('http://localhost:5000/api/suppliers', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 200 && Array.isArray(res.data.data)) {
                setSuppliers(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };
    const fetchCategories = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await axios.get('http://localhost:5000/api/categories', {
                headers: { Authorization: `Bearer ${token}` }, // Correct syntax for Bearer token
            });

            if (res.status === 200 && Array.isArray(res.data.data)) {
                setCategories(res.data.data); // Set the categories data if fetched successfully
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        const filtered = products.filter(item =>
            item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredProducts(filtered);
        setTotalItems(filtered.length);
        setCurrentPage(1);
    }, [searchTerm, products]);

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
                await axios.put(`http://localhost:5000/api/products/${editId}`, formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setNotificationMessage('Product berhasil diperbarui!');
            } else {
                await axios.post('http://localhost:5000/api/products', formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setNotificationMessage('Product berhasil ditambahkan!');
            }

            setFormData({ product_name: '', category_id: '', supplier_id: '', price: '', cost_price: '', stock: '', reorder_level: '', barcode: '', description: '' });
            setEditId(null);
            fetchProducts();
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
        const productToEdit = products.find(item => item.id === id);
        setFormData({
            product_name: productToEdit.product_name,
            category_id: productToEdit.category_id,
            supplier_id: productToEdit.supplier_id,
            price: productToEdit.price,
            cost_price: productToEdit.cost_price,
            stock: productToEdit.stock,
            reorder_level: productToEdit.reorder_level,
            barcode: productToEdit.barcode,
            description: productToEdit.description,
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
            await axios.delete(`http://localhost:5000/api/products/${itemToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotificationMessage('Product berhasil dihapus!');
            setConfirmDeleteModalOpen(false);
            fetchProducts();
        } catch (error) {
            setNotificationMessage('Terjadi kesalahan saat menghapus product!');
            setConfirmDeleteModalOpen(false);
        }
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setConfirmDeleteModalOpen(false);
        
    };

    const paginatedItems = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return (
        <DashboardLayout>
            <div className="max-w-5xxl mx-auto p-6 shadow-md rounded-lg">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Manajemen Produk</h2>

                <form className="space-y-6 mb-8" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Nama Produk</label>
                    <input
                        name="product_name"
                        type="text"
                        value={formData.product_name}
                        onChange={handleInputChange}
                        placeholder="Nama Produk"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Supplier</label>
                    <select
                        name="supplier_id"
                        value={formData.supplier_id}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                    >
                        <option value="">Pilih Supplier</option>
                        {suppliers.map(supplier => (
                            <option key={supplier.id} value={supplier.id}>{supplier.supplier_name}</option>
                        ))}
                    </select>
                </div>

                {/* Add selectbox for category */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Kategori</label>
                    <select
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                    >
                        <option value="">Pilih Kategori</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.id}>{category.category_name}</option>
                        ))}
                    </select>
                </div>

                {/* Add input fields for price, cost_price, stock, reorder_level, barcode, and description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Harga Jual</label>
                    <input
                        name="price"
                        type="number"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="Harga Jual"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Harga Beli</label>
                    <input
                        name="cost_price"
                        type="number"
                        value={formData.cost_price}
                        onChange={handleInputChange}
                        placeholder="Harga Beli"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Stok</label>
                    <input
                        name="stock"
                        type="number"
                        value={formData.stock}
                        onChange={handleInputChange}
                        placeholder="Stok"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Reorder Level</label>
                    <input
                        name="reorder_level"
                        type="number"
                        value={formData.reorder_level}
                        onChange={handleInputChange}
                        placeholder="Reorder Level"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Barcode</label>
                    <input
                        name="barcode"
                        type="text"
                        value={formData.barcode}
                        onChange={handleInputChange}
                        placeholder="Barcode"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
                <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Deskripsi Produk"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
            </div>
            <div>
                <button
                    type="submit"
                    className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    {editId ? 'Update Produk' : 'Tambah Produk'}
                </button>
            </div>
        </form>

                <div className="overflow-x-auto">
                    <div className="flex justify-between items-center mb-4">   
                        <input
                            type="text"
                            placeholder="Cari Produk..."
                            className="border border-gray-300 rounded-md px-2 py-1"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Produk</th>
                            
                            
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga Jual</th>
                               
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                               
                              
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedItems.map(product => (
                                <tr key={product.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">{product.product_name}</td>
                                   
                                    <td className="px-6 py-4 whitespace-nowrap">{product.price}</td>
                                   
                                    <td className="px-6 py-4 whitespace-nowrap">{product.stock}</td>
                                    
                                    
                                    <td className="px-6 py-4 whitespace-nowrap">{product.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button onClick={() => handleEdit(product.id)} className="text-blue-600 hover:text-blue-900">Edit</button>
                                        <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900 ml-4">Delete</button>
                                        <button onClick={() => handleView(product)} className="text-green-600 hover:text-green-900 ml-4">View</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {isModalOpen && selectedProduct && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 z-60" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold">Product Details</h2>
                        <p><strong>Name:</strong> {selectedProduct.product_name}</p>
                        <p><strong>Category:</strong> {selectedProduct.category_name}</p>
                        <p><strong>Supplier:</strong> {selectedProduct.supplier_name}</p>
                        <p><strong>Price:</strong> {selectedProduct.price}</p>
                        <p><strong>Cost Price:</strong> {selectedProduct.cost_price}</p>
                        <p><strong>Stock:</strong> {selectedProduct.stock}</p>
                        <p><strong>Reorder Level:</strong> {selectedProduct.reorder_level}</p>
                        <p><strong>Description:</strong> {selectedProduct.description}</p>
                        <p><strong>Barcode:</strong></p>
                        <img 
                            src={`/api/generate-barcode?barcode=${encodeURIComponent(selectedProduct.barcode)}`} 
                            alt="Barcode" 
                            style={{ width: '200px', height: '40px' }}
                        />
                                                
                        <button onClick={closesModal} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">Close</button>
                    </div>
                    <div className="fixed inset-0 bg-black opacity-50" onClick={closesModal}></div>
                </div>
            )}
                </div>

                <div className="flex justify-between mt-4">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-300 rounded-md disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-300 rounded-md disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>

                {/* Notification modal */}
                {modalOpen && (
                    <div className="fixed z-10 inset-0 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen">
                            <div className="bg-white rounded-lg p-6 w-1/3">
                                <h3 className="text-lg font-semibold">{notificationMessage}</h3>
                                <button onClick={closeModal} className="mt-4 text-indigo-600">Close</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirm delete modal */}
                {confirmDeleteModalOpen && (
                    <div className="fixed z-10 inset-0 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen">
                            <div className="bg-white rounded-lg p-6 w-1/3">
                                <h3 className="text-lg font-semibold">Are you sure you want to delete this product?</h3>
                                <div className="flex justify-end mt-4">
                                    <button onClick={confirmDelete} className="text-red-600">Yes</button>
                                    <button onClick={closeModal} className="ml-4 text-gray-600">No</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
