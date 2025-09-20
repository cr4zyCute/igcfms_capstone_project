// Balance Service for IGCFMS
// Handles real-time fund balance updates

import axios from 'axios';
import notificationService from './notificationService';

class BalanceService {
  constructor() {
    this.API_BASE = 'http://localhost:8000/api';
    this.balanceListeners = [];
    this.fundBalances = new Map();
  }

  // Get auth headers
  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Add balance listener
  addBalanceListener(callback) {
    this.balanceListeners.push(callback);
  }

  // Remove balance listener
  removeBalanceListener(callback) {
    this.balanceListeners = this.balanceListeners.filter(listener => listener !== callback);
  }

  // Notify balance listeners
  notifyBalanceListeners(fundAccountId, newBalance, oldBalance) {
    this.balanceListeners.forEach(callback => 
      callback({ fundAccountId, newBalance, oldBalance })
    );
  }

  // Update fund balance
  async updateFundBalance(fundAccountId, amount, operation, transactionData = {}) {
    try {
      // Get current balance
      const currentBalance = await this.getFundBalance(fundAccountId);
      let newBalance;

      switch (operation) {
        case 'ADD':
          newBalance = parseFloat(currentBalance) + parseFloat(amount);
          break;
        case 'SUBTRACT':
          newBalance = parseFloat(currentBalance) - parseFloat(amount);
          break;
        case 'SET':
          newBalance = parseFloat(amount);
          break;
        default:
          throw new Error('Invalid operation. Use ADD, SUBTRACT, or SET');
      }

      // Update balance in backend - try balance endpoint first, fallback to fund account update
      try {
        const response = await axios.put(
          `${this.API_BASE}/fund-accounts/${fundAccountId}/balance`,
          { balance: newBalance },
          { headers: this.getHeaders() }
        );
      } catch (balanceEndpointError) {
        console.warn('Balance endpoint failed, trying fund account update:', balanceEndpointError);
        
        // Fallback: Update the fund account directly
        await axios.put(
          `${this.API_BASE}/fund-accounts/${fundAccountId}`,
          { current_balance: newBalance },
          { headers: this.getHeaders() }
        );
      }

      // Update local cache
      this.fundBalances.set(fundAccountId, newBalance);

      // Notify listeners
      this.notifyBalanceListeners(fundAccountId, newBalance, currentBalance);

      // Check for low balance warning
      if (newBalance < 10000 && operation === 'SUBTRACT') {
        await notificationService.notifyTransaction('LOW_BALANCE_WARNING', {
          fund_account: transactionData.fund_account_name || `Fund Account #${fundAccountId}`,
          fund_account_id: fundAccountId,
          balance: newBalance
        });
      }

      console.log(`Fund balance updated: ${currentBalance} → ${newBalance} (${operation} ${amount})`);
      console.log('Balance update details:', {
        fundAccountId,
        operation,
        amount: parseFloat(amount),
        currentBalance: parseFloat(currentBalance),
        newBalance: parseFloat(newBalance),
        calculation: operation === 'SUBTRACT' ? `${currentBalance} - ${amount} = ${newBalance}` : `${currentBalance} + ${amount} = ${newBalance}`
      });
      
      return {
        success: true,
        oldBalance: currentBalance,
        newBalance: newBalance,
        operation: operation,
        amount: amount
      };

    } catch (error) {
      console.error('Error updating fund balance:', error);
      throw error;
    }
  }

  // Get fund balance
  async getFundBalance(fundAccountId) {
    try {
      // Check cache first
      if (this.fundBalances.has(fundAccountId)) {
        return this.fundBalances.get(fundAccountId);
      }

      // Fetch from backend
      const response = await axios.get(
        `${this.API_BASE}/fund-accounts/${fundAccountId}`,
        { headers: this.getHeaders() }
      );

      const balance = response.data.current_balance || response.data.data?.current_balance || 0;
      
      // Cache the balance
      this.fundBalances.set(fundAccountId, balance);
      
      return balance;
    } catch (error) {
      console.error('Error fetching fund balance:', error);
      return 0;
    }
  }

  // Get all fund balances
  async getAllFundBalances() {
    try {
      const response = await axios.get(
        `${this.API_BASE}/fund-accounts`,
        { headers: this.getHeaders() }
      );

      const fundAccounts = response.data || response.data?.data || [];
      const balances = {};

      fundAccounts.forEach(account => {
        const balance = account.current_balance || 0;
        balances[account.id] = balance;
        this.fundBalances.set(account.id, balance);
      });

      return balances;
    } catch (error) {
      console.error('Error fetching all fund balances:', error);
      return {};
    }
  }

  // Process transaction and update balances
  async processTransaction(transactionType, transactionData) {
    try {
      const { fund_account_id, amount, fund_account_name } = transactionData;

      switch (transactionType) {
        case 'RECEIVE_MONEY':
          // Add money to fund account
          const receiveResult = await this.updateFundBalance(
            fund_account_id, 
            amount, 
            'ADD',
            { fund_account_name }
          );

          // Send notification
          await notificationService.notifyTransaction('MONEY_RECEIVED', {
            amount: amount,
            payer: transactionData.payer || transactionData.recipient,
            fund_account: fund_account_name || `Fund Account #${fund_account_id}`,
            transaction_id: transactionData.transaction_id,
            fund_account_id: fund_account_id
          });

          return receiveResult;

        case 'ISSUE_MONEY':
          // Subtract money from fund account
          const issueResult = await this.updateFundBalance(
            fund_account_id, 
            amount, 
            'SUBTRACT',
            { fund_account_name }
          );

          // Send notification
          await notificationService.notifyTransaction('MONEY_ISSUED', {
            amount: amount,
            recipient: transactionData.recipient || transactionData.payee_name,
            fund_account: fund_account_name || `Fund Account #${fund_account_id}`,
            transaction_id: transactionData.transaction_id,
            fund_account_id: fund_account_id
          });

          return issueResult;

        case 'ISSUE_CHEQUE':
          // Subtract money from fund account
          const chequeResult = await this.updateFundBalance(
            fund_account_id, 
            amount, 
            'SUBTRACT',
            { fund_account_name }
          );

          // Send notification
          await notificationService.notifyTransaction('CHEQUE_ISSUED', {
            amount: amount,
            recipient: transactionData.recipient || transactionData.payee_name,
            fund_account: fund_account_name || `Fund Account #${fund_account_id}`,
            transaction_id: transactionData.transaction_id,
            fund_account_id: fund_account_id,
            cheque_number: transactionData.cheque_number
          });

          return chequeResult;

        default:
          throw new Error(`Unknown transaction type: ${transactionType}`);
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
      throw error;
    }
  }

  // Clear balance cache
  clearCache() {
    this.fundBalances.clear();
  }

  // Get cached balances
  getCachedBalances() {
    return Object.fromEntries(this.fundBalances);
  }
}

// Create singleton instance
const balanceService = new BalanceService();

export default balanceService;
