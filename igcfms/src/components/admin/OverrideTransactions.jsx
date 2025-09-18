import React, { useState, useEffect } from "react";
import axios from "axios";

const OverrideTransactions = ({ role }) => {
  const [transactions, setTransactions] = useState([]);
  const [overrideRequests, setOverrideRequests] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState("");
  const [reason, setReason] = useState("");
  const [proposedAmount, setProposedAmount] = useState("");
  const [proposedDescription, setProposedDescription] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [proposedChanges, setProposedChanges] = useState({});

  const token = localStorage.getItem("token");

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/transactions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTransactions(res.data);
      } catch (err) {
        console.error(err);
        setMessage("Failed to load transactions.");
      }
    };
    fetchTransactions();
  }, [token]);

  // Fetch override requests
  const fetchOverrideRequests = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/api/override_requests",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOverrideRequests(res.data);
    } catch (err) {
      console.error(err);
      setMessage("Failed to load override requests.");
    }
  };

  useEffect(() => {
    fetchOverrideRequests();
  }, [role]);

  // Submit override request
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!selectedTransaction || !reason) {
    setMessage("Please select a transaction and provide a reason.");
    return;
  }

  setLoading(true);
  try {
    // Define config here
    const config = { headers: { Authorization: `Bearer ${token}` } };

    await axios.post(
      "http://localhost:8000/api/override_requests",
      {
        transaction_id: selectedTransaction,
        reason,
        proposed_changes: JSON.stringify(proposedChanges),
      },
      config // ✅ now defined
    );

    setMessage("Override request submitted successfully.");
    setSelectedTransaction("");
    setReason("");
    setProposedChanges({});

    // Refresh override requests after submission
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


  // Admin review
  const handleReview = async (id, status) => {
    if (!reviewNotes) {
      setMessage("Provide review notes");
      return;
    }
    try {
      setLoading(true);
      await axios.put(
        `http://localhost:8000/api/override_requests/${id}/review`,
        { status, review_notes: reviewNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`Override request ${status}`);
      setReviewNotes("");
      fetchOverrideRequests();
    } catch (err) {
      console.error(err);
      setMessage("Failed to review request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Override Transactions</h2>
      {message && <p className="mb-4 text-red-500">{message}</p>}

{role === "Cashier" && (
  <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
    <div>
      <label className="block font-semibold mb-1">Select Transaction</label>
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
      <label className="block font-semibold mb-1">Reason for Override</label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        className="w-full border p-2 rounded"
        placeholder="Explain why this transaction needs to be overridden..."
      />
    </div>

    {/* New fields for proposed changes */}
    <div>
      <label className="block font-semibold mb-1">New Amount (optional)</label>
      <input
        type="number"
        step="0.01"
        onChange={(e) =>
          setProposedChanges((prev) => ({ ...prev, amount: e.target.value }))
        }
        className="w-full border p-2 rounded"
      />
    </div>

    <div>
      <label className="block font-semibold mb-1">New Description (optional)</label>
      <input
        type="text"
        onChange={(e) =>
          setProposedChanges((prev) => ({ ...prev, description: e.target.value }))
        }
        className="w-full border p-2 rounded"
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
      <table className="w-full border">
        <thead>
          <tr>
            <th>ID</th>
            <th>Transaction</th>
            <th>Requested By</th>
            <th>Reason</th>
            <th>Proposed Changes</th>
            <th>Status</th>
            {role === "Admin" && <th>Review Notes</th>}
            {role === "Admin" && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {overrideRequests.map((req) => (
            <tr key={req.id}>
              <td>{req.id}</td>
              <td>{req.transaction_id}</td>
              <td>{req.requested_by}</td>
              <td>{req.reason}</td>
              <td>{req.changes}</td>
              <td>{req.status}</td>
              {role === "Admin" && (
                <>
                  <td>
                    <input
                      type="text"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Notes"
                    />
                  </td>
                  <td>
                    <button onClick={() => handleReview(req.id, "approved")}>
                      Approve
                    </button>
                    <button onClick={() => handleReview(req.id, "rejected")}>
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
