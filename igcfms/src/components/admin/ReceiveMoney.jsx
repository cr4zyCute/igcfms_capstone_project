import React, { useState, useEffect } from "react";
import "../../assets/admin.css";
import axios from "axios";

const ReceiveMoney = () => {
  const token = localStorage.getItem("token");
  //const userId = localStorage.getItem("userId");
  const [fundAccounts, setFundAccounts] = useState([]);
  const [amount, setAmount] = useState("");
  const [payerName, setPayerName] = useState("");
  const [receiptNo, setReceiptNo] = useState("");
  const [fundAccountId, setFundAccountId] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  // Fetch fund accounts
  useEffect(() => {
    axios
      .get("http://localhost:8000/api/fund-accounts", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setFundAccounts(res.data))
      .catch((err) => console.error(err));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Transaction payload for Collection
      const transactionPayload = {
        type: "Collection",
        amount: parseFloat(amount),
        description: description || "Collection transaction",
        fund_account_id: parseInt(fundAccountId),
        mode_of_payment: "Cash", // Default to Cash for collections
        payer_name: payerName,
        receipt_number: receiptNo,
      };

      console.log("Sending payload:", transactionPayload);

      const transactionRes = await axios.post(
        "http://localhost:8000/api/transactions",
        transactionPayload,
        config
      );

      const transactionId = transactionRes.data.data.id;
      setMessage(`Transaction created successfully (ID: ${transactionId})`);

      // Reset form
      setAmount("");
      setPayerName("");
      setReceiptNo("");
      setFundAccountId("");
      setDescription("");
    } catch (err) {
      console.error("Error details:", err.response?.data);

      if (err.response?.status === 422 && err.response.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors)
          .flat()
          .join(", ");
        setMessage(`Validation error: ${errorMessages}`);
      } else {
        setMessage("Error creating transaction.");
      }
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
