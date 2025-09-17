import React, { useState, useEffect } from "react";
import "../../assets/admin.css";
import axios from "axios";

const OverrideTransactions = ({ role }) => {
  const [transactions, setTransactions] = useState([]);
  const [overrideRequests, setOverrideRequests] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState("");
  const [reason, setReason] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token"); // Assuming auth token for protected API

  // Fetch transactions for dropdown
  useEffect(() => {
    const fetchTransactions = async () => {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      try {
        const res = await axios.get(
          "http://localhost:8000/api/transactions",
          config
        );
        setTransactions(res.data);
      } catch (err) {
        console.error(err);
        setMessage("Failed to load transactions.");
      }
    };
    fetchTransactions();
  }, [token]);

  // Fetch override requests (for admin or cashier own requests)
  useEffect(() => {
    const fetchOverrideRequests = async () => {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      try {
        const url =
          role === "Admin"
            ? "http://localhost:8000/api/override_requests"
            : "http://localhost:8000/api/override_requests/my_requests";
        const res = await axios.get(url, config);
        setOverrideRequests(res.data);
      } catch (err) {
        console.error(err);
        setMessage("Failed to load override requests.");
      }
    };
    fetchOverrideRequests();
  }, [role, token]);

  // Cashier submits request
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTransaction || !reason) {
      setMessage("Please select a transaction and provide a reason.");
      return;
    }

    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(
        "http://localhost:8000/api/transactions/override",
        { transaction_id: selectedTransaction, reason },
        config
      );
      setMessage("Override request submitted successfully.");
      setSelectedTransaction("");
      setReason("");

      // Refresh the list after submission
      const res = await axios.get(
        role === "Admin"
          ? "http://localhost:8000/api/override_requests"
          : "http://localhost:8000/api/override_requests/my_requests",
        config
      );
      setOverrideRequests(res.data);
    } catch (err) {
      console.error(err);
      setMessage("Failed to submit override request.");
    } finally {
      setLoading(false);
    }
  };

  // Admin reviews request
  const handleReview = async (id, status) => {
    if (!reviewNotes) {
      setMessage("Please provide review notes.");
      return;
    }
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(
        `http://localhost:8000/api/override_requests/${id}/review`,
        { status, review_notes: reviewNotes },
        config
      );
      setMessage(`Override request ${status}`);
      setOverrideRequests((prev) =>
        prev.map((req) =>
          req.id === id
            ? { ...req, status, review_notes: reviewNotes, reviewed_by: "You" }
            : req
        )
      );
      setReviewNotes("");
    } catch (err) {
      console.error(err);
      setMessage("Failed to review request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="override-transactions p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Override Transactions</h2>
      {message && <p className="mb-4 text-red-500">{message}</p>}

      {role === "Cashier" && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
          <div>
            <label className="block font-semibold mb-1">
              Select Transaction
            </label>
            <select
              value={selectedTransaction}
              onChange={(e) => setSelectedTransaction(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="">-- Select Transaction --</option>
              {transactions.map((tx) => (
                <option key={tx.id} value={tx.id}>
                  {tx.id} | {tx.type} | {tx.amount} | {tx.description}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">
              Reason for Override
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full border p-2 rounded"
              placeholder="Explain why this transaction needs to be overridden..."
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Override Request"}
          </button>
        </form>
      )}

      <h3 className="text-lg font-semibold mb-2">Existing Override Requests</h3>
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ID</th>
            <th className="border p-2">Transaction</th>
            <th className="border p-2">Requested By</th>
            <th className="border p-2">Reason</th>
            <th className="border p-2">Status</th>
            {role === "Admin" && <th className="border p-2">Review Notes</th>}
            {role === "Admin" && <th className="border p-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {overrideRequests.map((req) => (
            <tr key={req.id}>
              <td className="border p-2">{req.id}</td>
              <td className="border p-2">{req.transaction_id}</td>
              <td className="border p-2">
                {req.requested_by_name || req.requested_by}
              </td>
              <td className="border p-2">{req.reason}</td>
              <td className="border p-2">{req.status}</td>
              {role === "Admin" && (
                <>
                  <td className="border p-2">{req.review_notes || ""}</td>
                  <td className="border p-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Notes"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      className="border p-1 rounded"
                    />
                    <button
                      onClick={() => handleReview(req.id, "approved")}
                      className="bg-green-600 text-white p-1 rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview(req.id, "rejected")}
                      className="bg-red-600 text-white p-1 rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OverrideTransactions;
