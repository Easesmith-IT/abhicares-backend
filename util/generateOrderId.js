const { v4: uuidv4 } = require('uuid');



  const generateOrderId= async()=> {
    // Generate a unique UUID
    const uuid = uuidv4();
    
    
    const numericPart = uuid.replace(/[^0-9]/g, '').slice(0, 12); 

    
    const numericWithDashes = numericPart.slice(0, 4) + '-' + numericPart.slice(4, 8) + '-' + numericPart.slice(8, 10) + '-' + numericPart.slice(10);

    // Generate two random alphabets
    const alphabets = String.fromCharCode(Math.floor(Math.random() * 26) + 65) + String.fromCharCode(Math.floor(Math.random() * 26) + 65); // Two random uppercase letters

    return `OD${numericWithDashes}${alphabets}`;
}

console.log(generateOrderId());
const generateBookingId= async()=> {
  // Generate a unique UUID
  const uuid = uuidv4();
  
  
  const numericPart = uuid.replace(/[^0-9]/g, '').slice(0, 12); 

  
  const numericWithDashes = numericPart.slice(0, 4) + '-' + numericPart.slice(4, 8) + '-' + numericPart.slice(8, 10) + '-' + numericPart.slice(10);

  // Generate two random alphabets
  const alphabets = String.fromCharCode(Math.floor(Math.random() * 26) + 65) + String.fromCharCode(Math.floor(Math.random() * 26) + 65); // Two random uppercase letters

  return `BID${numericWithDashes}${alphabets}`;
}
module.exports={
    generateOrderId,generateBookingId
}

