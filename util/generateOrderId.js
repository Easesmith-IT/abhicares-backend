const { v4: uuidv4 } = require("uuid");

const { counterSchema } = require("../models/counter");

const generateOrderId = async () => {
  // Generate a unique UUID
  const uuid = uuidv4();

  const numericPart = uuid.replace(/[^0-9]/g, "").slice(0, 12);

  const numericWithDashes =
    numericPart.slice(0, 4) +
    "-" +
    numericPart.slice(4, 8) +
    "-" +
    numericPart.slice(8, 10) +
    "-" +
    numericPart.slice(10);

  // Generate two random alphabets
  const alphabets =
    String.fromCharCode(Math.floor(Math.random() * 26) + 65) +
    String.fromCharCode(Math.floor(Math.random() * 26) + 65); // Two random uppercase letters

  return `OD${numericWithDashes}${alphabets}`;
};

const generateTicketId = async () => {
  // Generate a unique UUID
  const uuid = uuidv4();

  const numericPart = uuid.replace(/[^0-9]/g, "").slice(0, 12);

  const numericWithDashes =
    numericPart.slice(0, 4) +
    "-" +
    numericPart.slice(4, 8) +
    "-" +
    numericPart.slice(8, 10) +
    "-" +
    numericPart.slice(10);

  // Generate two random alphabets
  const alphabets =
    String.fromCharCode(Math.floor(Math.random() * 26) + 65) +
    String.fromCharCode(Math.floor(Math.random() * 26) + 65); // Two random uppercase letters

  return `TC${numericWithDashes}${alphabets}`;
};

console.log(generateOrderId());
const generateBookingId = async () => {
  // Generate a unique UUID
  const uuid = uuidv4();

  const numericPart = uuid.replace(/[^0-9]/g, "").slice(0, 12);

  const numericWithDashes =
    numericPart.slice(0, 4) +
    "-" +
    numericPart.slice(4, 8) +
    "-" +
    numericPart.slice(8, 10) +
    "-" +
    numericPart.slice(10);

  // Generate two random alphabets
  const alphabets =
    String.fromCharCode(Math.floor(Math.random() * 26) + 65) +
    String.fromCharCode(Math.floor(Math.random() * 26) + 65); // Two random uppercase letters

  return `BID${numericWithDashes}${alphabets}`;
};

const generatePartnerId = async () => {
  // Fetch and increment the counter atomically
  const counter = await counterSchema.findOneAndUpdate(
    { name: "partnerId" },
    { $inc: { value: 1 } },
    { new: true, upsert: true } // Create the document if it doesn't exist
  );

  // Use the updated counter value to create the 5-digit numeric part
  const numericPart = counter.value.toString().padStart(5, "0"); // Zero-padded to 5 digits

  // Format the numeric part with dashes
  const numericWithDashes =
    numericPart.slice(0, 2) + "-" + numericPart.slice(2);

  // Generate two random uppercase letters for uniqueness
  const alphabets =
    String.fromCharCode(Math.floor(Math.random() * 26) + 65) +
    String.fromCharCode(Math.floor(Math.random() * 26) + 65);

  // Return the final partner ID
  return `PID${numericWithDashes}${alphabets}`;
};

module.exports = {
  generateOrderId,
  generateBookingId,
  generatePartnerId,
  generateTicketId,
};
