import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import DashboardLayout from '../components/DashboardLayout';
import jwt from 'jsonwebtoken';  // Import jsonwebtoken
import React from 'react';

const ITEMS_PER_PAGE = 10;
const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds



export default function SalesPage() {
    const [sales, setSales] = useState([]);
    const [filteredSales, setFilteredSales] = useState([]);
    const [userId, setUserId] = useState(null); // State to store user ID
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [formData, setFormData] = useState({
        user_id: '',
        customer_id: '',
        sale_date: '',
        total_amount: '',
        discount: '',
        tax: '',
        final_amount: '',
        payment_method: '',
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
    const idleTimer = useState(null);
    
    // Menampilkan Data ID user
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
                const id = decodedToken.id; // Replace with the correct property name from your token
                setUserId(id); // Set userId state
                setFormData((prevData) => ({
                    ...prevData,
                    user_id: id, // Set user_id in formData directly
                }));
            }
        }
    }, [router]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        } else {
            fetchSales();
            fetchCustomers();
            fetchProducts();
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

    const fetchSales = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found in localStorage');
            return;
        }

        try {
            const res = await axios.get('http://202.10.41.174:5000/api/sales', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.status === 200 && Array.isArray(res.data.data)) {
                const data = res.data.data;
                setSales(data);
                setFilteredSales(data);
                setTotalItems(data.length);
            } else {
                console.warn('Unexpected response structure:', res);
                setSales([]);
                setFilteredSales([]);
                setTotalItems(0);
            }
        } catch (error) {
            console.error('Error fetching sales:', error);
            setSales([]);
            setFilteredSales([]);
            setTotalItems(0);
        }
    };
    const fetchCustomers = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await axios.get('http://202.10.41.174:5000/api/customers', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 200 && Array.isArray(res.data.data)) {
                setCustomers(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };
    const fetchProducts = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await axios.get('http://202.10.41.174:5000/api/products', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 200 && Array.isArray(res.data.data)) {
                setProducts(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };
    useEffect(() => {
        const filtered = sales.filter(item =>
            String(item.customer_id).toLowerCase().includes(searchTerm.toLowerCase()) // Convert to string
        );
        setFilteredSales(filtered);
        setTotalItems(filtered.length);
        setCurrentPage(1);
    }, [searchTerm, sales]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    
    const handleSubmit = async (e) => {
        e.preventDefault();
      
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found in localStorage');
          return;
        }
      
        const formDataCopy = { ...formData };
      
        if (!formDataCopy.total_amount) {
          setNotificationMessage('Total amount is required!');
          return;
        }
      
        const salesItemsData = salesItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          price_item: item.price_item,
          discount: item.discount,
          subtotal: item.subtotal,
        }));
      
        try {
          const res = await axios.post('http://202.10.41.174:5000/api/sales', {
            ...formDataCopy,
            items: salesItemsData,
          }, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
      
          if (res.status === 201) {
            setNotificationMessage('Sales berhasil ditambahkan!');
            setModalOpen(true);
            fetchSales(); // Refresh data sales
            resetForm(); // Reset formulir
          } else {
            console.error('Error adding sales:', res);
          }
        } catch (error) {
          console.error('Error adding sales:', error);
        }
      };
    const resetForm = () => {
        setFormData({
          total_amount: '',
          // tambahkan properti lainnya yang ingin direset
          customer_id: '',
          sale_date: '',
          total_amount: '',
          discount: '', 
          tax: '',
          final_amount: '', 
          payment_method: '', 
          status: ''
        });
        setSalesItems([]); // reset sales items
      };

const handleEdit = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No token found in localStorage');
    return;
  }

  const formDataCopy = { ...formData };

  if (!formDataCopy.total_amount) {
    setNotificationMessage('Total amount is required!');
    return;
  }

  const salesItemsData = salesItems.map((item) => ({
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.price,
    price_item: item.price_item,
    discount: item.discount,
    subtotal: item.subtotal,
  }));

  try {
    const res = await axios.put(`http://202.10.41.174:5000/api/sales/${saleId}`, {
      ...formDataCopy,
      items: salesItemsData,
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 200) {
      setNotificationMessage('Sales berhasil diupdate!');
      setModalOpen(true);
      fetchSales(); // Refresh data sales
      resetForm(); // Reset formulir
    } else {
      console.error('Error updating sales:', res);
    }
  } catch (error) {
    console.error('Error updating sales:', error);
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

  

    const handleDelete = (id) => {
        setItemToDelete(id);
        setConfirmDeleteModalOpen(true);
    };
    
    const confirmDelete = async () => {
        const token = localStorage.getItem('token');
      
        try {
          // Delete the sales item
          await axios.delete(`http://202.10.41.174:5000/api/sales/${itemToDelete}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
      
          handleSuccess();
        } catch (error) {
          handleFailure(error);
        }
      };
      
      const handleSuccess = () => {
        setNotificationMessage('Sales berhasil dihapus!');
        setConfirmDeleteModalOpen(false);
        fetchSales();
        setModalOpen(true);
      };
      
      const handleFailure = (error) => {
        setNotificationMessage('Terjadi kesalahan saat menghapus sales!');
        setConfirmDeleteModalOpen(false);
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
        const sortedSales = [...filteredSales].sort((a, b) => {
            if (a[key] < b[key]) {
                return direction === 'ascending' ? -1 : 1;
            }
            if (a[key] > b[key]) {
                return direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        setFilteredSales(sortedSales);
    };
    // Sales items state initialization
    const [salesItems, setSalesItems] = useState([{ product_id: '', price: '' }]);

    // Handling select change
    const handleSalesItemChange = (index, e) => {
        const { name, value } = e.target;
        console.log("Selected Product ID:", value); // Log the selected product ID
    
        // Find the selected product based on product_id
        const selectedProduct = products.find((product) => product.id === parseInt(value));
        
        const updatedItems = [...salesItems];
        updatedItems[index] = {
            ...updatedItems[index],
            product_id: value, // Update product_id
            price: selectedProduct ? selectedProduct.price : '', // Update price if product found
            quantity: name.startsWith('quantity_') ? value : updatedItems[index].quantity, // Update quantity if it was changed
        };
    
        // Calculate price_item based on quantity and price
        const quantity = parseFloat(updatedItems[index].quantity) || 0;
        const price = parseFloat(updatedItems[index].price) || 0;
        updatedItems[index].price_item = quantity * price; // Update price_item
    
        setSalesItems(updatedItems);
        console.log("Updated Sales Items:", updatedItems); // Verify the state is being updated
        
    };
    const handlePriceChange = (index, e) => {
        const value = e.target.value;
    
        const updatedItems = [...salesItems];
        updatedItems[index] = {
            ...updatedItems[index],
            price: value, // Update price
        };
    
        // Calculate price_item based on the updated price and current quantity
        const quantity = parseFloat(updatedItems[index].quantity) || 0;
        const price = parseFloat(value) || 0;
        updatedItems[index].price_item = quantity * price; // Update price_item
    
        // Recalculate subtotal if necessary
        const discount = parseFloat(updatedItems[index].discount) || 0;
        const discountAmount = (updatedItems[index].price_item * discount) / 100;
        updatedItems[index].subtotal = updatedItems[index].price_item - discountAmount;
    
        // Update the sales items state
        setSalesItems(updatedItems);
        
        // Call the function to recalculate the total amount
       
        calculateTotalAmount();
        console.log("Updated Sales Items:", updatedItems); // Verify the state is being updated
    };
    
    const handleQuantityChange = (index, e) => {
        const value = e.target.value;
    
        const updatedItems = [...salesItems];
        updatedItems[index] = {
            ...updatedItems[index],
            quantity: value, // Update the quantity
        };
    
        // Calculate price_item based on the updated quantity and current price
        const price = parseFloat(updatedItems[index].price) || 0;
        const quantity = parseFloat(value) || 0;
        updatedItems[index].price_item = quantity * price; // Update price_item
    
        setSalesItems(updatedItems);
        console.log("Updated Sales Items:", updatedItems); // Verify the state is being updated
        handleSubtotalChange(); // Call to recalculate total amount
    };
   
    const handleChangeDiscount = (index, e) => {
        const value = e.target.value;
        const updatedItems = [...salesItems];
        updatedItems[index].discount = value; // Update the discount
    
        // Recalculate subtotal
        const price_item = updatedItems[index].price_item || 0;
        const discount = parseFloat(value) || 0;
        const discountAmount = (price_item * discount) / 100;
        updatedItems[index].subtotal = price_item - discountAmount;
    
        setSalesItems(updatedItems);
        handleSubtotalChange(); // Update total amount
    };
   
    
    useEffect(() => {
        handleSubtotalChange(salesItems); // Pass the current state of salesItems
    }, [salesItems]); // This dependency ensures the effect runs whenever salesItems changes
    
    const handleSubtotalChange = (updatedItems = []) => {
        const total = updatedItems.reduce((acc, item) => acc + (item?.subtotal || 0), 0);
        setFormData((prevData) => ({
            ...prevData,
            total_amount: total, // Update total_amount in formData
        }));
    };
    
    const removeSalesItem = (index) => {
        const updatedItems = salesItems.filter((_, i) => i !== index);
        setSalesItems(updatedItems); // This will automatically trigger the useEffect to recalculate total
    };
    

    
    const addSalesItem = () => {
        setSalesItems([...salesItems, { product_id: '', quantity: 0, price: 0, discount: 0 }]);
    };
    
    const handleFinalAmount = (event) => {
        const { name, value } = event.target; // Get the field name (tax) and its value
        const taxValue = name === 'tax' ? parseFloat(value) || 0 : formData.tax; // Use the current tax or updated tax
    
        // Calculate the final amount
        const totalAmount = formData.total_amount || 0; // Ensure total_amount is not undefined
        const taxAmount = (totalAmount * taxValue) / 100;
        const finalAmount = totalAmount + taxAmount;
    
        // Update formData with the new tax and final_amount
        setFormData((prevData) => ({
            ...prevData,
            [name]: value, // Update the tax field
            final_amount: finalAmount, // Update the final amount based on the new tax
        }));
    };
    
    
    
    const paginatedItems = filteredSales.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    return (
        <DashboardLayout>
            <div className="max-w-5xxl mx-auto p-6 shadow-md rounded-lg">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Manajemen Sales</h2>

                <form className="space-y-6 mb-8" onSubmit={handleSubmit}>
                <div className="space-y-6 mb-4">
                    <h3 className="text-xl font-semibold">Sales Items</h3>
                    {salesItems.map((item, index) => (
                        <div key={index} className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                            <div>
                            <label className="block text-sm font-medium text-gray-700">Product</label>
                            <select
                            name={`product_id_${index}`} // Correctly formatted name attribute
                            value={item.product_id} // Ensure binding to the current product_id
                            onChange={(e) => handleSalesItemChange(index, e)} // Handle selection change
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                            required
                        >
                            <option value="">Select a Product</option>
                            {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.product_name}
                                </option>
                            ))}
                        </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Price Per Item</label>
                                <input
                                    name={`price_${index}`}
                                    type="number"
                                    value={item.price}
                                    onChange={(e) => handlePriceChange(index, e)}
                                    placeholder="Price Per Item"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Quantity</label>
                                <input
                                    name={`quantity_${index}`}
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => handleQuantityChange(index, e)}
                                    placeholder="Quantity"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Price</label>
                                <input
                                    name={`price_item_${index}`}
                                    type="number"
                                    value={item.price_item}
                                    onChange={(e) => handlePriceItemChange(index, e)}
                                    placeholder="Price"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                            
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Discount (%)</label>
                            <input
                                name={`discount_${index}`}
                                type="number"
                                value={item.discount}
                                onChange={(e) => handleChangeDiscount(index, e)} // Use the existing handler
                                placeholder="Discount"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Subtotal</label>
                            <input
                                name={`subtotal_${index}`}
                                type="number"
                                value={item.subtotal || 0} // Bind the value to the subtotal property
                                onChange={(e) => handleSubtotalChange(index, e)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                
                            />
                        </div>

                            <button
                                type="button"
                                className="mt-6 bg-red-500 text-white rounded-md py-2 px-4 hover:bg-red-700"
                                onClick={() => removeSalesItem(index)}
                            >
                                Remove
                            </button>
                            
                        </div>
                    ))}
                    <button
                        type="button"
                        className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
                        onClick={addSalesItem}
                    >
                        Add Sales Item
                    </button>
                </div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        
                       
                            {/* Hidden ID User */}
                            <input
                                name="user_id"
                                type="hidden"
                                value={formData.user_id} // Display the user_id from formData
                            />
                        
                        <div>
                        <label className="block text-sm font-medium text-gray-700">Customer ID</label>
                        <select
                            name="customer_id"
                            value={formData.customer_id}
                            onChange={handleInputChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                        >
                            <option value="" disabled>Select Customer</option>
                            {customers.map((customer) => (
                            <option key={customer.id} value={customer.id}>
                                {customer.customer_name} {/* Adjust according to your customer data */}
                            </option>
                            ))}
                        </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Sale Date</label>
                            <input
                                name="sale_date"
                                type="date"
                                value={formData.sale_date}
                                onChange={handleInputChange}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                        <div>
                                <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                                <input
                                    name="total_amount"
                                    type="number"
                                    value={formData.total_amount}
                                    readOnly // Make it read-only to prevent manual editing
                                    placeholder="Total Amount"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                       
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tax</label>
                            <input
                                name="tax"
                                type="number"
                                value={formData.tax}
                                onChange={handleFinalAmount}
                                placeholder="Tax"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Final Amount</label>
                            <input
                                name="final_amount"
                                type="number"
                                value={formData.final_amount}
                              
                                placeholder="Final Amount"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                            <input
                                name="payment_method"
                                type="text"
                                value={formData.payment_method}
                                onChange={handleInputChange}
                                placeholder="Payment Method"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <input
                                name="status"
                                type="text"
                                value={formData.status}
                                onChange={handleInputChange}
                                placeholder="Status"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                    </div>
                    
                    <button
                        type="submit"
                        className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                        {editId ? 'Update Sale' : 'Add Sale'}
                    </button>
                </form>

                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search by Customer ID"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="border p-2 rounded"
                    />
                </div>
                

                <table className="min-w-full border">
                    <thead>
                        <tr>
                        <th onClick={() => handleSort('user_id')} className="border p-2 cursor-pointer">User ID</th>
                            <th onClick={() => handleSort('customer_id')} className="border p-2 cursor-pointer">Customer ID</th>
                            <th onClick={() => handleSort('sale_date')} className="border p-2 cursor-pointer">Sale Date</th>
                            <th onClick={() => handleSort('total_amount')} className="border p-2 cursor-pointer">Total Amount</th>
                            <th onClick={() => handleSort('final_amount')} className="border p-2 cursor-pointer">Final Amount</th>
                            <th className="border p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedItems.map(sale => (
                            <tr key={sale.id}>
                                 <td className="border p-2">{sale.user_id}</td>
                                <td className="border p-2">{sale.customer_id}</td>
                                <td className="border p-2">{new Date(sale.sale_date).toLocaleDateString()}</td>
                                <td className="border p-2">{sale.total_amount}</td>
                                <td className="border p-2">{sale.final_amount}</td>
                                <td className="border p-2">
                                    <button onClick={() => handleEdit(sale.id)} className="text-blue-600">Edit</button>
                                    <button onClick={() => handleDelete(sale.id)} className="text-red-600 ml-2">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="mt-4 flex justify-between">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Previous</button>
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
                </div>

                {/* Notification Modal */}
                {modalOpen && (
                    <div className="fixed z-10 inset-0 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen">
                            <div className="bg-white rounded-lg p-4">
                                <p>{notificationMessage}</p>
                                <button onClick={closeModal} className="mt-4 bg-indigo-600 text-white rounded py-2 px-4">Close</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirm Delete Modal */}
                {confirmDeleteModalOpen && (
                    <div className="fixed z-10 inset-0 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen">
                            <div className="bg-white rounded-lg p-4">
                                <p>Are you sure you want to delete this sale?</p>
                                <button onClick={confirmDelete} className="mt-4 bg-red-600 text-white rounded py-2 px-4">Delete</button>
                                <button onClick={closeModal} className="mt-4 ml-2 bg-gray-300 rounded py-2 px-4">Cancel</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
