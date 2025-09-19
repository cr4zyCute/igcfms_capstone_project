import React, { useState, useEffect } from "react";
import "../../assets/admin.css";
import axios from "axios";

const ReceiveMoney = () => {
  const [fundAccounts, setFundAccounts] = useState([]);
  const [amount, setAmount] = useState("");
  const [payerName, setPayerName] = useState("");
  const [receiptNo, setReceiptNo] = useState("");
  const [fundAccountId, setFundAccountId] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [category, setCategory] = useState("");
  const [reference, setReference] = useState("");
  const [modeOfPayment, setModeOfPayment] = useState("Cash");
  const [message, setMessage] = useState("");

  // Fetch fund accounts
  useEffect(() => {
    const fetchFundAccounts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8000/api/fund-accounts', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setFundAccounts(response.data);
      } catch (error) {
        console.error('Error fetching fund accounts:', error);
      }
    };
    
    fetchFundAccounts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:8000/api/transactions', {
        type: "Collection",
        amount: parseFloat(amount),
        description: description || "Collection transaction",
        recipient: payerName,
        department: department || null,
        category: category || null,
        reference: reference || null,
        receipt_no: receiptNo,
        reference_no: receiptNo,
        fund_account_id: fundAccountId ? parseInt(fundAccountId) : null,
        mode_of_payment: modeOfPayment,
        // Backend validation fields
        payer_name: payerName,
        receipt_number: receiptNo,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setMessage('Collection transaction created successfully!');
      
      // Reset form
      setAmount("");
      setPayerName("");
      setReceiptNo("");
      setFundAccountId("");
      setDescription("");
      setDepartment("");
      setCategory("");
      setReference("");
      setModeOfPayment("Cash");
      
    } catch (error) {
      console.error('Error creating transaction:', error);
      setMessage(error.response?.data?.message || 'Error creating transaction');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow">
      <h2 className="text-lg font-bold mb-4">Receive Money / Issue Receipt</h2>
      {message && <p className="mb-2 text-red-600">{message}</p>}

      <input
        placeholder="Payer Name"
        value={payerName}
        onChange={(e) => setPayerName(e.target.value)}
        className="border p-2 w-full mb-2"
        required
      />
      <input
        placeholder="Receipt Number"
        value={receiptNo}
        onChange={(e) => setReceiptNo(e.target.value)}
        className="border p-2 w-full mb-2"
        required
      />
      <input
        type="number"
        placeholder="Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="border p-2 w-full mb-2"
        min="0.01"
        step="0.01"
        required
      />

      <select
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
        className="border p-2 w-full mb-2"
      >
        <option value="">-- Select Department (optional) --</option>
        <option value="Finance">Finance</option>
        <option value="Administration">Administration</option>
        <option value="Operations">Operations</option>
        <option value="Human Resources">Human Resources</option>
        <option value="Information Technology">Information Technology</option>
        <option value="Legal">Legal</option>
        <option value="Procurement">Procurement</option>
        <option value="Public Works">Public Works</option>
        <option value="Health Services">Health Services</option>
        <option value="Education">Education</option>
        <option value="Social Services">Social Services</option>
        <option value="Other">Other</option>
      </select>

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="border p-2 w-full mb-2"
      >
        <option value="">-- Select Category (optional) --</option>
        <option value="Tax Collection">Tax Collection</option>
        <option value="Permit Fees">Permit Fees</option>
        <option value="License Fees">License Fees</option>
        <option value="Service Fees">Service Fees</option>
        <option value="Fines and Penalties">Fines and Penalties</option>
        <option value="Rental Income">Rental Income</option>
        <option value="Interest Income">Interest Income</option>
        <option value="Grants and Donations">Grants and Donations</option>
        <option value="Miscellaneous Revenue">Miscellaneous Revenue</option>
        <option value="Other">Other</option>
      </select>

      <input
        placeholder="Reference (optional)"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        className="border p-2 w-full mb-2"
      />

      <select
        value={modeOfPayment}
        onChange={(e) => setModeOfPayment(e.target.value)}
        className="border p-2 w-full mb-2"
        required
      >
        <option value="Cash">Cash</option>
        <option value="Cheque">Cheque</option>
        <option value="Bank Transfer">Bank Transfer</option>
      </select>

      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border p-2 w-full mb-2"
        rows="3"
      />

      <select
        value={fundAccountId}
        onChange={(e) => setFundAccountId(e.target.value)}
        className="border p-2 w-full mb-2"
        required
      >
        <option value="">-- Select Fund Account --</option>
        {fundAccounts.map((acc) => (
          <option key={acc.id} value={acc.id}>
            {acc.name} ({acc.code}) - {acc.account_type}
          </option>
        ))}
      </select>

      <button className="bg-blue-600 text-white p-2 rounded">
        Create Collection Transaction
      </button>
    </form>
  );
};

export default ReceiveMoney;
