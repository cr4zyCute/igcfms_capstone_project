import React, { useState, useEffect } from "react";
import "../../assets/admin.css";
import axios from "axios";

const IssueReceipt = () => {
  const token = localStorage.getItem("token");
  const [transactions, setTransactions] = useState([]);
  const [transactionId, setTransactionId] = useState("");
  const [payerName, setPayerName] = useState("");
  const [receiptNo, setReceiptNo] = useState("");
  const [message, setMessage] = useState("");

  // Fetch only "Collection" transactions without receipts
  useEffect(() => {
    axios
      .get("http://localhost:8000/api/transactions?type=Collection", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setTransactions(res.data))
      .catch((err) => console.error(err));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const payload = {
        transaction_id: transactionId,
        payer_name: payerName,
        receipt_number: receiptNo,
      };

      await axios.post("http://localhost:8000/api/receipts", payload, config);

      setMessage("Receipt issued successfully");
      setPayerName("");
      setReceiptNo("");
      setTransactionId("");
    } catch (err) {
      console.error(err);
      setMessage("Error issuing receipt.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow">
      <h2 className="text-lg font-bold mb-4">Issue Receipt</h2>
      {message && <p className="mb-2">{message}</p>}

      <select
        value={transactionId}
        onChange={(e) => setTransactionId(e.target.value)}
        className="border p-2 w-full mb-2"
      >
        <option value="">-- Select Transaction --</option>
        {transactions.map((tx) => (
          <option key={tx.id} value={tx.id}>
            #{tx.id} - {tx.amount} ({tx.fund_account?.name})
          </option>
        ))}
      </select>

      <input
        placeholder="Payer Name"
        value={payerName}
        onChange={(e) => setPayerName(e.target.value)}
        className="border p-2 w-full mb-2"
      />
      <input
        placeholder="Receipt Number"
        value={receiptNo}
        onChange={(e) => setReceiptNo(e.target.value)}
        className="border p-2 w-full mb-2"
      />

      <button className="bg-green-600 text-white p-2 rounded">
        Issue Receipt
      </button>
    </form>
  );
};

export default IssueReceipt;
