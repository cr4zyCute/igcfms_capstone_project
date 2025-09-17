import React, { useState, useEffect } from "react";
import "../../assets/admin.css";
import {
  getFundAccounts,
  createFundAccount,
  getFundAccount,
} from "../../services/api";

const FundsAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newAccount, setNewAccount] = useState({
    name: "",
    code: "",
    description: "",
    initial_balance: 0,
    account_type: "Revenue",
    department: "",
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await getFundAccounts();
      setAccounts(response);
      setError("");
    } catch (err) {
      setError("Failed to fetch fund accounts. Please try again.");
      console.error("Error fetching accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountTransactions = async (accountId) => {
    try {
      setTransactionsLoading(true);
      const response = await getFundAccount(accountId);

      setTransactions(response);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();

    console.log("Sending new account:", newAccount); // DEBUG

    try {
      setLoading(true);
      await createFundAccount({
        ...newAccount,
        initial_balance: Number(newAccount.initial_balance) || 0,
      });
      setSuccess("Fund account created successfully!");
      setNewAccount({
        name: "",
        code: "",
        description: "",
        initial_balance: 0,
        account_type: "Revenue",
        department: "",
      });
      setShowAddAccount(false);
      fetchAccounts();
    } catch (err) {
      setError("Failed to create fund account. Please try again.");
      console.error("Error creating account:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSelect = async (account) => {
    setSelectedAccount(account);
    await fetchAccountTransactions(account.id);
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner" aria-label="Loading fund accounts" />
      </div>
    );
  }

  return (
    <div className="funds-accounts">
      <div className="section-header">
        <h3>Fund Accounts Management</h3>
        <button
          className="btn btn-primary"
          onClick={() => setShowAddAccount(true)}
          disabled={loading}
        >
          Add New Account
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showAddAccount && (
        <div className="modal-overlay">
          <div className="modal">
            <h4>Create New Fund Account</h4>
            <form onSubmit={handleAddAccount}>
              <div className="form-group">
                <label>Account Name</label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, name: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Account Code</label>
                <input
                  type="text"
                  value={newAccount.code}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, code: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newAccount.description}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      description: e.target.value,
                    })
                  }
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Initial Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={newAccount.initial_balance}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNewAccount({
                      ...newAccount,
                      initial_balance: value === "" ? "" : parseFloat(value),
                    });
                  }}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Account Type</label>
                <select
                  value={newAccount.account_type}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      account_type: e.target.value,
                    })
                  }
                  disabled={loading}
                >
                  <option value="Revenue">Revenue</option>
                  <option value="Expense">Expense</option>
                  <option value="Asset">Asset</option>
                  <option value="Liability">Liability</option>
                  <option value="Equity">Equity</option>
                </select>
              </div>
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  value={newAccount.department}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, department: e.target.value })
                  }
                  disabled={loading}
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowAddAccount(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="accounts-overview">
        <h4>Fund Accounts</h4>
        <div className="account-cards">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`account-card ${
                selectedAccount?.id === account.id ? "selected" : ""
              }`}
              onClick={() => handleAccountSelect(account)}
            >
              <h5>{account.name}</h5>
              <p className="code">{account.code}</p>
              <p className="balance">
                ₱{account.current_balance?.toLocaleString() || "0.00"}
              </p>
              <p className="type">{account.account_type}</p>
              <p className="department">{account.department}</p>
            </div>
          ))}
        </div>
      </div>

      {selectedAccount && (
        <div className="account-details">
          <h4>Transaction History: {selectedAccount.name}</h4>
          {transactionsLoading ? (
            <div className="spinner-container">
              <div className="spinner" aria-label="Loading transactions" />
            </div>
          ) : transactions.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      {new Date(transaction.created_at).toLocaleDateString()}
                    </td>
                    <td>{transaction.description}</td>
                    <td>
                      <span
                        className={`transaction-type ${transaction.type?.toLowerCase()}`}
                      >
                        {transaction.type}
                      </span>
                    </td>
                    <td
                      className={
                        transaction.type === "Collection"
                          ? "text-success"
                          : "text-danger"
                      }
                    >
                      {transaction.type === "Collection" ? "+" : "-"}₱
                      {transaction.amount?.toLocaleString()}
                    </td>
                    <td>
                      {transaction.reference ||
                        transaction.reference_no ||
                        transaction.receipt_no}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No transactions found for this account.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FundsAccounts;
