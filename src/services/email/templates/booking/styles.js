const emailStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 0;
    color: #333;
    background-color: #f5f5f5;
  }
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  .main-content {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .header {
    background: #1a1a1a;
    color: white;
    padding: 30px;
    text-align: center;
  }
  .header img {
    height: 48px;
    margin-bottom: 15px;
  }
  .header h2 {
    margin: 0;
    color: white;
    font-size: 24px;
  }
  .booking-header {
    background: #f8f9fa;
    padding: 20px 30px;
    border-bottom: 1px solid #e1e1e1;
  }
  .booking-number {
    font-size: 18px;
    color: #1a1a1a;
    margin: 0;
  }
  .content-section {
    padding: 30px;
  }
  .trip-header {
    background: #4CAF50;
    color: white;
    padding: 15px 20px;
    border-radius: 6px 6px 0 0;
    margin: 0;
  }
  .trip-content {
    background: white;
    border: 1px solid #e1e1e1;
    border-top: none;
    border-radius: 0 0 6px 6px;
    padding: 20px;
    margin-bottom: 30px;
  }
  .trip-details {
    margin-bottom: 20px;
  }
  .time {
    font-size: 24px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 20px;
  }
  .address-section {
    margin-bottom: 15px;
  }
  .address-label {
    font-size: 14px;
    color: #666;
    margin-bottom: 5px;
  }
  .address {
    color: #1a1a1a;
    font-weight: 500;
  }
  .passenger-info {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 6px;
    margin-top: 20px;
  }
  .info-row {
    margin-bottom: 15px;
    padding-bottom: 15px;
    border-bottom: 1px solid #e1e1e1;
  }
  .info-row:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
  .info-label {
    font-size: 14px;
    color: #666;
    margin-bottom: 5px;
  }
  .info-value {
    color: #1a1a1a;
    font-weight: 500;
  }
  .trip-metadata {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #e1e1e1;
  }
  .metadata-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .metadata-label {
    color: #666;
  }
  .metadata-value {
    color: #1a1a1a;
    font-weight: 500;
  }
  .airport-instructions {
    background: #f8f9fa;
    border: 1px solid #e1e1e1;
    border-radius: 6px;
    padding: 25px;
    margin-top: 30px;
  }
  .airport-instructions h4 {
    margin: 0 0 20px;
    color: #1a1a1a;
    font-size: 18px;
  }
  .step {
    display: flex;
    align-items: flex-start;
    margin-bottom: 20px;
  }
  .step:last-child {
    margin-bottom: 0;
  }
  .step-icon {
    font-size: 24px;
    margin-right: 15px;
    flex-shrink: 0;
  }
  .step-content {
    flex: 1;
  }
  .step-title {
    font-weight: 600;
    margin-bottom: 5px;
    color: #1a1a1a;
  }
  .step p {
    margin: 0;
    color: #666;
    font-size: 14px;
  }
  .contact-info {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #e1e1e1;
    text-align: center;
  }
  .footer {
    text-align: center;
    padding: 30px;
    background: #f8f9fa;
    border-top: 1px solid #e1e1e1;
    color: #666;
  }
  .pricing-breakdown {
    background: #f8f9fa;
    border: 1px solid #e1e1e1;
    border-radius: 6px;
    padding: 20px;
    margin-top: 30px;
  }
  .pricing-breakdown h4 {
    margin: 0 0 15px;
    color: #1a1a1a;
    font-size: 18px;
  }
  .price-item {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 14px;
  }
  .price-item.total {
    border-top: 2px solid #333;
    margin-top: 10px;
    padding-top: 15px;
    font-size: 16px;
  }
  .return-trip-section {
    margin-top: 30px;
    padding: 20px;
    background: #fffbf0;
    border: 1px solid #ffc107;
    border-radius: 6px;
  }
  .notes-section {
    background: #f0f8ff;
    border: 1px solid #cce5ff;
    border-radius: 6px;
    padding: 15px;
    margin-top: 20px;
  }
  .notes-section h4 {
    margin: 0 0 10px;
    color: #1a1a1a;
    font-size: 16px;
  }
  .notes-section p {
    margin: 0;
    color: #333;
    font-size: 14px;
  }
  @media (max-width: 768px) {
    .container {
      padding: 10px;
    }
    .content-section {
      padding: 20px;
    }
  }
`;

module.exports = emailStyles;
