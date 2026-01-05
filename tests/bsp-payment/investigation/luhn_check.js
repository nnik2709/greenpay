// Luhn algorithm validator
function isValidLuhn(cardNumber) {
  // Remove spaces and non-digits
  const digits = cardNumber.replace(/\D/g, '');
  
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }
  
  let sum = 0;
  let isEven = false;
  
  // Loop from right to left
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return (sum % 10) === 0;
}

// Test the MasterCard
const cardNumber = '5573810111111101';
console.log('Card Number:', cardNumber);
console.log('Length:', cardNumber.length);
console.log('Luhn Valid:', isValidLuhn(cardNumber));

// Also test the other cards for comparison
console.log('\n--- Comparison with other cards ---');
console.log('DOKU Visa (4761349999000039):', isValidLuhn('4761349999000039'));
console.log('BSP Visa Silver (4889730100994185):', isValidLuhn('4889730100994185'));
console.log('BSP Visa Platinum (4889750100103462):', isValidLuhn('4889750100103462'));
