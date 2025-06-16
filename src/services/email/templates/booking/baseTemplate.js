const styles = require('./styles');

const getBaseTemplate = (content, headerTitle = 'Your reservation is confirmed') => `
<!DOCTYPE html>
<html>
<head>
  <style>${styles}</style>
</head>
<body>
  <div class="container">
    <div class="main-content">
      <div class="header">
        <img src="cid:companyLogo" alt="Elite Transportation">
        <h2>${headerTitle}</h2>
      </div>
      ${content}
    </div>
  </div>
</body>
</html>
`;

module.exports = { getBaseTemplate, styles };
