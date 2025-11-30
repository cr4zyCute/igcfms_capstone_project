import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { SkeletonLine } from './LoadingSkeleton';
import { useFundAccounts } from '../../hooks/useFundAccounts';

const formatCurrency = (value) => {
  const amount = parseFloat(value ?? 0);
  if (!Number.isFinite(amount)) return '₱0.00';
  return `₱${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const FundListSkeleton = ({ count = 4 }) => (
  <div className="rm-account-skeletons">
    {Array.from({ length: count }).map((_, idx) => (
      <div className="rm-account-card skeleton" key={`fund-skeleton-${idx}`}>
        <div className="rm-account-main">
          <SkeletonLine width="50%" height={20} />
          <span className="rm-chevron-skeleton" aria-hidden="true" />
        </div>
        <div className="rm-account-info">
          <SkeletonLine width="70px" height={24} />
          <SkeletonLine width="90px" height={24} />
        </div>
        <div className="rm-account-balance">
          <SkeletonLine width="70px" height={12} />
          <SkeletonLine width="110px" height={20} />
        </div>
      </div>
    ))}
  </div>
);

const FundList = ({
  searchTerm = '',
  visible = true,
  onSelect,
  emptyMessage = 'No fund accounts found',
  skeletonCount = 4,
}) => {
  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useFundAccounts({
    search: searchTerm,
    enabled: visible,
    refetchInterval: false,
    limit: 100,
  });

  const funds = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data?.data)) return data.data.data;
    return [];
  }, [data]);

  if (!visible) {
    return null;
  }

  const isInitialLoading = isLoading || (isFetching && funds.length === 0);

  if (isInitialLoading) {
    return (
      <div className="rm-accounts-list">
        <FundListSkeleton count={skeletonCount} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rm-accounts-list">
        <div className="rm-no-results">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error.message || 'Unable to load fund accounts.'}</p>
        </div>
      </div>
    );
  }

  if (!funds.length) {
    return (
      <div className="rm-accounts-list">
        <div className="rm-no-results">
          <i className="fas fa-search"></i>
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rm-accounts-list">
      {funds.map((account) => (
        <div
          key={account.id}
          className="rm-account-card"
          onClick={() => onSelect?.(account)}
          role={onSelect ? 'button' : undefined}
          tabIndex={onSelect ? 0 : undefined}
          onKeyUp={(event) => {
            if (onSelect && (event.key === 'Enter' || event.key === ' ')) {
              onSelect(account);
            }
          }}
        >
          <div className="rm-account-main">
            <h4 className="rm-account-name">{account.name}</h4>
            <i className="fas fa-chevron-right rm-chevron"></i>
          </div>
          <div className="rm-account-info">
            <span className="rm-code-badge">{account.code}</span>
            <span className="rm-type-badge">{account.account_type}</span>
          </div>
          <div className="rm-account-balance">
            <span className="rm-balance-label">BALANCE:</span>
            <span className="rm-balance-value">
              {formatCurrency(account.balance ?? account.current_balance ?? 0)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

FundList.propTypes = {
  searchTerm: PropTypes.string,
  visible: PropTypes.bool,
  onSelect: PropTypes.func,
  emptyMessage: PropTypes.string,
  skeletonCount: PropTypes.number,
};

export default FundList;
