// Frontend validation utilities
export const validateOrder = (cart) => {
  const errors = [];
  
  if (!cart || cart.length === 0) {
    errors.push('Korpa je prazna');
    return errors;
  }
  
  cart.forEach((item, index) => {
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
  
  return errors;
};

export const validateLoginData = (username, password) => {
  const errors = [];
  
  if (!username || username.trim() === '') {
    errors.push('Korisničko ime je obavezno');
  }
  
  if (!password || password.trim() === '') {
    errors.push('Lozinka je obavezna');
  }
  
  if (username && username.length < 3) {
    errors.push('Korisničko ime mora imati najmanje 3 karaktera');
  }
  
  if (password && password.length < 6) {
    errors.push('Lozinka mora imati najmanje 6 karaktera');
  }
  
  return errors;
};

export const validateTableData = (tableNumber, xPosition, yPosition) => {
  const errors = [];
  
  if (!tableNumber || tableNumber <= 0) {
    errors.push('Broj stola mora biti veći od 0');
  }
  
  if (xPosition < 0) {
    errors.push('X pozicija ne može biti negativna');
  }
  
  if (yPosition < 0) {
    errors.push('Y pozicija ne može biti negativna');
  }
  
  return errors;
}; 