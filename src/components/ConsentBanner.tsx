import React, { useState, useEffect } from 'react';
import { ConsentPurpose } from '../plugins/storage/types';

interface ConsentBannerProps {
  purposes: ConsentPurpose[];
  userId: string;
  onConsent: (purposeIds: string[], granted: boolean) => Promise<void>;
  onDismiss?: () => void;
  position?: 'top' | 'bottom';
  style?: 'banner' | 'modal';
}

export const ConsentBanner: React.FC<ConsentBannerProps> = ({
  purposes,
  userId,
  onConsent,
  onDismiss,
  position = 'bottom',
  style = 'banner'
}) => {
  const [selectedPurposes, setSelectedPurposes] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Pre-select required purposes
    const required = purposes.filter(p => p.required).map(p => p.id);
    setSelectedPurposes(new Set(required));
  }, [purposes]);

  const handleAcceptAll = async () => {
    setProcessing(true);
    try {
      const allPurposeIds = purposes.map(p => p.id);
      await onConsent(allPurposeIds, true);
      onDismiss?.();
    } catch (error) {
      console.error('Failed to grant consent:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleAcceptSelected = async () => {
    setProcessing(true);
    try {
      await onConsent(Array.from(selectedPurposes), true);
      onDismiss?.();
    } catch (error) {
      console.error('Failed to grant consent:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectAll = async () => {
    setProcessing(true);
    try {
      // Only reject non-required purposes
      const nonRequired = purposes.filter(p => !p.required).map(p => p.id);
      await onConsent(nonRequired, false);
      
      // Grant required purposes
      const required = purposes.filter(p => p.required).map(p => p.id);
      if (required.length > 0) {
        await onConsent(required, true);
      }
      
      onDismiss?.();
    } catch (error) {
      console.error('Failed to process consent:', error);
    } finally {
      setProcessing(false);
    }
  };

  const togglePurpose = (purposeId: string, required: boolean) => {
    if (required) return; // Can't toggle required purposes
    
    const newSelected = new Set(selectedPurposes);
    if (newSelected.has(purposeId)) {
      newSelected.delete(purposeId);
    } else {
      newSelected.add(purposeId);
    }
    setSelectedPurposes(newSelected);
  };

  const getPurposeIcon = (category: string) => {
    switch (category) {
      case 'necessary': return '🔒';
      case 'analytics': return '📊';
      case 'marketing': return '📣';
      case 'functional': return '⚙️';
      case 'preferences': return '⭐';
      default: return '📋';
    }
  };

  if (style === 'modal') {
    return (
      <div className="consent-modal-overlay">
        <div className="consent-modal">
          <div className="consent-header">
            <h2>🍪 We Value Your Privacy</h2>
            <p>We use cookies and similar technologies to enhance your experience.</p>
          </div>

          <div className="consent-content">
            {!showDetails ? (
              <div className="consent-simple">
                <p>We process your data for the following purposes:</p>
                <ul className="purpose-summary">
                  {purposes.map(purpose => (
                    <li key={purpose.id}>
                      {getPurposeIcon(purpose.category)} {purpose.name}
                      {purpose.required && <span className="required-badge">Required</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="consent-detailed">
                <h3>Manage Your Preferences</h3>
                <div className="purpose-list">
                  {purposes.map(purpose => (
                    <div key={purpose.id} className="purpose-item">
                      <div className="purpose-header">
                        <label className="purpose-toggle">
                          <input
                            type="checkbox"
                            checked={selectedPurposes.has(purpose.id)}
                            onChange={() => togglePurpose(purpose.id, purpose.required)}
                            disabled={purpose.required || processing}
                          />
                          <span className="purpose-name">
                            {getPurposeIcon(purpose.category)} {purpose.name}
                          </span>
                          {purpose.required && <span className="required-badge">Required</span>}
                        </label>
                      </div>
                      <p className="purpose-description">{purpose.description}</p>
                      <div className="purpose-details">
                        <span className="legal-basis">Legal basis: {purpose.legalBasis}</span>
                        {purpose.retentionPeriod && (
                          <span className="retention">Retention: {purpose.retentionPeriod}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="consent-actions">
            {!showDetails ? (
              <>
                <button
                  onClick={() => setShowDetails(true)}
                  className="btn secondary"
                  disabled={processing}
                >
                  Manage Preferences
                </button>
                <button
                  onClick={handleRejectAll}
                  className="btn secondary"
                  disabled={processing}
                >
                  Reject All
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="btn primary"
                  disabled={processing}
                >
                  Accept All
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowDetails(false)}
                  className="btn secondary"
                  disabled={processing}
                >
                  Back
                </button>
                <button
                  onClick={handleAcceptSelected}
                  className="btn primary"
                  disabled={processing}
                >
                  Save Preferences
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Banner style
  return (
    <div className={`consent-banner ${position}`}>
      <div className="consent-banner-content">
        <div className="consent-message">
          <p>
            🍪 We use cookies to enhance your experience. By continuing, you agree to our use of cookies.
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="link-button"
              disabled={processing}
            >
              {showDetails ? 'Hide' : 'Learn more'}
            </button>
          </p>
        </div>

        {showDetails && (
          <div className="consent-banner-details">
            {purposes.map(purpose => (
              <label key={purpose.id} className="purpose-checkbox">
                <input
                  type="checkbox"
                  checked={selectedPurposes.has(purpose.id)}
                  onChange={() => togglePurpose(purpose.id, purpose.required)}
                  disabled={purpose.required || processing}
                />
                <span>
                  {purpose.name}
                  {purpose.required && <span className="required"> (Required)</span>}
                </span>
              </label>
            ))}
          </div>
        )}

        <div className="consent-banner-actions">
          <button
            onClick={handleRejectAll}
            className="btn secondary small"
            disabled={processing}
          >
            Reject
          </button>
          <button
            onClick={showDetails ? handleAcceptSelected : handleAcceptAll}
            className="btn primary small"
            disabled={processing}
          >
            {showDetails ? 'Save' : 'Accept'}
          </button>
        </div>
      </div>
    </div>
  );
};

// CSS Styles
export const consentBannerStyles = `
  /* Consent Banner Styles */
  .consent-banner {
    position: fixed;
    left: 0;
    right: 0;
    background: white;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    z-index: 9999;
    padding: 20px;
    animation: slideIn 0.3s ease-out;
  }

  .consent-banner.top {
    top: 0;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .consent-banner.bottom {
    bottom: 0;
  }

  @keyframes slideIn {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .consent-banner-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .consent-message {
    flex: 1;
    min-width: 300px;
  }

  .consent-message p {
    margin: 0;
    color: #333;
    font-size: 14px;
    line-height: 1.5;
  }

  .link-button {
    background: none;
    border: none;
    color: #3498db;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    margin-left: 5px;
    font-size: inherit;
  }

  .link-button:hover {
    color: #2980b9;
  }

  .consent-banner-details {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #e0e0e0;
  }

  .purpose-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    cursor: pointer;
  }

  .purpose-checkbox input[type="checkbox"] {
    cursor: pointer;
  }

  .purpose-checkbox input[type="checkbox"]:disabled {
    cursor: not-allowed;
  }

  .required {
    color: #666;
    font-size: 12px;
  }

  .consent-banner-actions {
    display: flex;
    gap: 10px;
  }

  /* Consent Modal Styles */
  .consent-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .consent-modal {
    background: white;
    border-radius: 12px;
    max-width: 600px;
    width: 100%;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    animation: modalSlideIn 0.3s ease-out;
  }

  @keyframes modalSlideIn {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .consent-header {
    padding: 30px;
    text-align: center;
    border-bottom: 1px solid #e0e0e0;
  }

  .consent-header h2 {
    margin: 0 0 10px 0;
    color: #333;
    font-size: 24px;
  }

  .consent-header p {
    margin: 0;
    color: #666;
    font-size: 16px;
  }

  .consent-content {
    padding: 30px;
    overflow-y: auto;
    flex: 1;
  }

  .purpose-summary {
    list-style: none;
    padding: 0;
    margin: 20px 0;
  }

  .purpose-summary li {
    padding: 10px 0;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
  }

  .required-badge {
    background: #f8f9fa;
    color: #666;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    margin-left: auto;
  }

  .purpose-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .purpose-item {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
  }

  .purpose-header {
    margin-bottom: 10px;
  }

  .purpose-toggle {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-weight: 600;
  }

  .purpose-toggle input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .purpose-description {
    color: #666;
    font-size: 14px;
    margin: 10px 0;
    line-height: 1.5;
  }

  .purpose-details {
    display: flex;
    gap: 20px;
    font-size: 12px;
    color: #999;
    margin-top: 10px;
  }

  .consent-actions {
    padding: 20px 30px;
    border-top: 1px solid #e0e0e0;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn.primary {
    background: #3498db;
    color: white;
  }

  .btn.primary:hover:not(:disabled) {
    background: #2980b9;
  }

  .btn.secondary {
    background: #f8f9fa;
    color: #333;
    border: 1px solid #e0e0e0;
  }

  .btn.secondary:hover:not(:disabled) {
    background: #e9ecef;
  }

  .btn.small {
    padding: 6px 12px;
    font-size: 13px;
  }
`;