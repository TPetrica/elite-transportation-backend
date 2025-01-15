const invoiceTemplate = ({
  invoiceDate,
  invoiceNumber,
  supplier,
  customer,
  products,
  currencySymbol = '$',
  totalNetAmount,
  totalVatAmount,
  totalAmount,
}) => {
  try {
    // Validate required data
    if (!invoiceDate || !invoiceNumber || !supplier || !customer || !products) {
      throw new Error('Missing required template data');
    }

    if (!supplier.name || !supplier.address || !supplier.email) {
      throw new Error('Missing required supplier information');
    }

    if (!customer.name) {
      throw new Error('Missing required customer information');
    }

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice #${invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
  <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
    <!-- Header with Logo and Invoice Info -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
      <tr>
        <td style="width: 50%; vertical-align: top;">
          <img src="cid:companyLogo" style="height: 48px;" alt="Company Logo" />
        </td>
        <td style="width: 50%; vertical-align: top;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding-right: 20px; border-right: 1px solid #e5e7eb;">
                <div style="font-size: 14px; text-align: right;">
                  <div style="color: #94a3b8;">Date</div>
                  <div style="font-weight: bold; color: #5c6ac4;">${invoiceDate}</div>
                </div>
              </td>
              <td style="padding-left: 20px;">
                <div style="font-size: 14px; text-align: right;">
                  <div style="color: #94a3b8;">Invoice #</div>
                  <div style="font-weight: bold; color: #5c6ac4;">${invoiceNumber}</div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Addresses -->
    <table style="width: 100%; border-collapse: collapse; background-color: #f1f5f9; padding: 20px; margin-bottom: 30px;">
      <tr>
        <td style="width: 50%; vertical-align: top; padding: 20px;">
          <div style="font-size: 14px; color: #525252;">
            <div style="font-weight: bold;">${supplier.name}</div>
            <div>${supplier.address}</div>
            ${supplier.city && supplier.postCode ? `<div>${supplier.city}, ${supplier.postCode}</div>` : ''}
            ${supplier.country ? `<div>${supplier.country}</div>` : ''}
          </div>
        </td>
        <td style="width: 50%; vertical-align: top; text-align: right; padding: 20px;">
          <div style="font-size: 14px; color: #525252;">
            <div style="font-weight: bold;">${customer.name}</div>
            ${customer.address ? `<div>${customer.address}</div>` : ''}
            ${customer.city && customer.postCode ? `<div>${customer.city}, ${customer.postCode}</div>` : ''}
            ${customer.country ? `<div>${customer.country}</div>` : ''}
          </div>
        </td>
      </tr>
    </table>

    <!-- Items Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
      <thead>
        <tr style="border-bottom: 2px solid #5c6ac4;">
          <th style="padding: 10px; text-align: left; color: #5c6ac4;">#</th>
          <th style="padding: 10px; text-align: left; color: #5c6ac4;">Product details</th>
          <th style="padding: 10px; text-align: right; color: #5c6ac4;">Price</th>
          <th style="padding: 10px; text-align: center; color: #5c6ac4;">Qty.</th>
          <th style="padding: 10px; text-align: center; color: #5c6ac4;">VAT</th>
          <th style="padding: 10px; text-align: right; color: #5c6ac4;">Subtotal</th>
          <th style="padding: 10px; text-align: right; color: #5c6ac4;">Subtotal + VAT</th>
        </tr>
      </thead>
      <tbody>
        ${products
          .map((product, index) => {
            const productSubtotal = product.price * product.quantity;
            const productVatAmount = (productSubtotal * product.vat) / 100;
            const productTotal = productSubtotal + productVatAmount;

            return `
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px;">${index + 1}.</td>
                <td style="padding: 10px;">${product.name}</td>
                <td style="padding: 10px; text-align: right;">${currencySymbol}${product.price.toFixed(2)}</td>
                <td style="padding: 10px; text-align: center;">${product.quantity}</td>
                <td style="padding: 10px; text-align: center;">${product.vat}%</td>
                <td style="padding: 10px; text-align: right;">${currencySymbol}${productSubtotal.toFixed(2)}</td>
                <td style="padding: 10px; text-align: right;">${currencySymbol}${productTotal.toFixed(2)}</td>
              </tr>
            `;
          })
          .join('')}
      </tbody>
    </table>

    <!-- Totals -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
      <tr>
        <td style="width: 70%;"></td>
        <td style="width: 30%;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px; color: #94a3b8;">Net total:</td>
              <td style="padding: 10px; text-align: right; font-weight: bold; color: #5c6ac4;">
                ${currencySymbol}${totalNetAmount.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px; color: #94a3b8;">VAT total:</td>
              <td style="padding: 10px; text-align: right; font-weight: bold; color: #5c6ac4;">
                ${currencySymbol}${totalVatAmount.toFixed(2)}
              </td>
            </tr>
            <tr style="background-color: #5c6ac4;">
              <td style="padding: 10px; color: white; font-weight: bold;">Total:</td>
              <td style="padding: 10px; text-align: right; color: white; font-weight: bold;">
                ${currencySymbol}${totalAmount.toFixed(2)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Payment Details -->
    <div style="margin-bottom: 30px; font-size: 14px; color: #404040;">
      <div style="font-weight: bold; color: #5c6ac4; margin-bottom: 10px;">PAYMENT DETAILS</div>
      <div>Banks of Banks</div>
      <div>Bank/Sort Code: 1234567</div>
      <div>Account Number: 123456678</div>
      <div>Payment Reference: ${invoiceNumber}</div>
    </div>

    <!-- Notes -->
    <div style="margin-bottom: 30px; font-size: 14px; color: #404040;">
      <div style="font-weight: bold; color: #5c6ac4; margin-bottom: 10px;">Notes</div>
      <div style="font-style: italic;">Thank you for choosing our services. For any questions or concerns, please contact our support team.</div>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; font-size: 12px; color: #525252;">
      ${supplier.name}
      <span style="color: #cbd5e1; margin: 0 10px;">|</span>
      ${supplier.email}
      <span style="color: #cbd5e1; margin: 0 10px;">|</span>
      ${supplier.phone}
    </div>
  </div>
</body>
</html>
    `;
  } catch (error) {
    console.error('Error generating invoice template:', error);
    throw error;
  }
};

module.exports = invoiceTemplate;
