// Backend validation utilities
const validateOrderData = (orderData) => {
  const errors = [];
  
  if (!orderData) {
    errors.push('Podaci porudžbine su obavezni');
    return errors;
  }
  
  if (!orderData.table_id || orderData.table_id <= 0) {
    errors.push('Neispravan ID stola');
  }
  
  if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
    errors.push('Porudžbina mora sadržati stavke');
    return errors;
  }
  
  orderData.items.forEach((item, index) => {
    if (!item.id || item.id <= 0) {
      errors.push(`Neispravan ID proizvoda za stavku ${index + 1}`);
    }
    
    if (!item.name || item.name.trim() === '') {
      errors.push(`Nedostaje naziv proizvoda za stavku ${index + 1}`);
    }
    
    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Neispravna količina za ${item.name || `stavku ${index + 1}`}`);
    }
    
    if (!item.price || item.price <= 0) {
      errors.push(`Neispravna cena za ${item.name || `stavku ${index + 1}`}`);
    }
  });
  
  if (!orderData.total_price || orderData.total_price <= 0) {
    errors.push('Neispravna ukupna cena');
  }
  
  return errors;
};

const validateLoginData = (loginData) => {
  const errors = [];
  
  if (!loginData) {
    errors.push('Podaci za prijavu su obavezni');
    return errors;
  }
  
  if (!loginData.username || loginData.username.trim() === '') {
    errors.push('Korisničko ime je obavezno');
  }
  
  if (!loginData.password || loginData.password.trim() === '') {
    errors.push('Lozinka je obavezna');
  }
  
  if (loginData.username && loginData.username.length < 3) {
    errors.push('Korisničko ime mora imati najmanje 3 karaktera');
  }
  
  if (loginData.password && loginData.password.length < 6) {
    errors.push('Lozinka mora imati najmanje 6 karaktera');
  }
  
  return errors;
};

const validateTableData = (tableData) => {
  const errors = [];
  
  if (!tableData) {
    errors.push('Podaci stola su obavezni');
    return errors;
  }
  
  if (!tableData.table_number || tableData.table_number <= 0) {
    errors.push('Broj stola mora biti veći od 0');
  }
  
  if (tableData.x_position !== undefined && tableData.x_position < 0) {
    errors.push('X pozicija ne može biti negativna');
  }
  
  if (tableData.y_position !== undefined && tableData.y_position < 0) {
    errors.push('Y pozicija ne može biti negativna');
  }
  
  if (tableData.location && !['indoor', 'outdoor'].includes(tableData.location)) {
    errors.push('Lokacija mora biti "indoor" ili "outdoor"');
  }
  
  return errors;
};

module.exports = {
  validateOrderData,
  validateLoginData,
  validateTableData
}; 