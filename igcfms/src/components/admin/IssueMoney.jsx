import React, { useState, useEffect } from "react";
//import "../../assets/admin.css";
import axios from "axios";

const IssueMoney = () => {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const [fundAccounts, setFundAccounts] = useState([]);
  const [amount, setAmount] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [fundAccountId, setFundAccountId] = useState("");
  const [description, setDescription] = useState("");
  const [modeOfPayment, setModeOfPayment] = useState("Cash");
  const [chequeNumber, setChequeNumber] = useState("");
  const [message, setMessage] = useState("");

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

      const transactionPayload = {
        type: "Disbursement",
        amount: parseFloat(amount),
        description: description || "Disbursement transaction",
        fund_account_id: parseInt(fundAccountId),
        mode_of_payment: modeOfPayment,
        recipient: payeeName, // For transactions table
        reference_no: referenceNo,
        payee_name: payeeName, // For disbursements table
        cheque_number: modeOfPayment === "Cheque" ? chequeNumber : null,
        user_id: parseInt(userId),
      };

      const transactionRes = await axios.post(
        "http://localhost:8000/api/transactions",
        transactionPayload,
        config
      );

      const transactionId = transactionRes.data.data.id;
      setMessage(`Disbursement created successfully (ID: ${transactionId})`);

      // Reset form
      setAmount("");
      setPayeeName("");
      setReferenceNo("");
      setFundAccountId("");
      setDescription("");
      setChequeNumber("");
    } catch (err) {
      console.error("Error details:", err.response?.data);
      if (err.response?.status === 422 && err.response.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors)
          .flat()
          .join(", ");
        setMessage(`Validation error: ${errorMessages}`);
      } else {
        setMessage("Error creating disbursement.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow">
      <h2 className="text-lg font-bold mb-4">Issue Money / Disbursement</h2>
      {message && <p className="mb-2 text-red-600">{message}</p>}

      <input
        placeholder="Payee Name"
        value={payeeName}
        onChange={(e) => setPayeeName(e.target.value)}
        className="border p-2 w-full mb-2"
        required
      />
      <input
        placeholder="Reference Number"
        value={referenceNo}
        onChange={(e) => setReferenceNo(e.target.value)}
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
        value={modeOfPayment}
        onChange={(e) => setModeOfPayment(e.target.value)}
        className="border p-2 w-full mb-2"
        required
      >
        <option value="Cash">Cash</option>
        <option value="Cheque">Cheque</option>
        <option value="Bank Transfer">Bank Transfer</option>
      </select>

      {modeOfPayment === "Cheque" && (
        <input
          placeholder="Cheque Number"
          value={chequeNumber}
          onChange={(e) => setChequeNumber(e.target.value)}
          className="border p-2 w-full mb-2"
          required
        />
      )}

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
        Create Disbursement
      </button>
    </form>
  );
};

export default IssueMoney;
