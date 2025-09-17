import React, { useState, useEffect } from 'react';
import { getTransactions } from '../../services/api';

const ViewTransactions = ({ filterByAccountIds = null }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        let params = {};
        if (filterByAccountIds && Array.isArray(filterByAccountIds)) {
          params.accountIds = filterByAccountIds.join(',');
        }
        const response = await getTransactions(params);
        setTransactions(response);
        setError('');
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to fetch transactions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [filterByAccountIds]);

  if (loading) return <div>Loading transactions...</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="transactions">
      <h3>Transactions</h3>
      {transactions.length === 0 ? (
        <p>No transactions found.</p>
      ) : (
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
            {transactions.map(tx => (
              <tr key={tx.id}>
                <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                <td>{tx.description}</td>
                <td>
                  <span className={`transaction-type ${tx.type?.toLowerCase()}`}>
                    {tx.type}
                  </span>
                </td>
                <td className={tx.type === 'Collection' ? 'text-success' : 'text-danger'}>
                  {tx.type === 'Collection' ? '+' : '-'}₱{tx.amount?.toLocaleString()}
                </td>
                <td>{tx.reference || tx.reference_no || tx.receipt_no}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ViewTransactions;
