const Booking = require("../models/booking");
const Partner = require("../models/seller");

{
  /* <option value="08:00AM">08:00 AM</option>
<option value="09:00AM">09:00 AM</option>
<option value="10:00AM">10:00 AM</option>
<option value="11:00AM">11:00 AM</option>
<option value="12:00PM">12:00 PM</option>
<option value="01:00PM">01:00 PM</option>
<option value="02:00PM">02:00 PM</option>
<option value="03:00PM">03:00 PM</option>
<option value="04:00PM">04:00 PM</option>
<option value="05:00PM">05:00 PM</option>
<option value="06:00PM">06:00 PM</option>
<option value="07:00PM">07:00 PM</option>
<option value="08:00PM">08:00 PM</option> */
}

const findPartners = async (serId,city) => {
  const availablePartners = await Partner.find({
    services: {
      $elemMatch: {
        serviceId: serId,
      },
    }, 'address.city':city
  });

  return availablePartners;
};

exports.autoAssignBooking = async (serviceId, bookingId) => {
  //booking to be assigned
  const booking = await Booking.findById(bookingId);
  const { bookingTime: bT, bookingDate: bD, userAddress: { city } } = booking; //(string)

  // Find partners for the service in the same city
  const availablePartners = await findPartners(serviceId, city);

  let assignedPartner = null;

  // If there are available partners
  if (availablePartners.length > 0) {
    let minBookings = Infinity;
    
    // Iterate over available partners
    for (const partner of availablePartners) {
      // Check if the partner has bookings for the same date and time
      const sellerOtherBookings = await Booking.countDocuments({
        sellerId: partner._id,
        bookingDate: bD,
        bookingTime: bT,
      });

      // If no bookings for the same date and time, assign the booking
      if (sellerOtherBookings === 0) {
        // Count total bookings for the partner
        const noOfSellerBookings = await Booking.countDocuments({
          sellerId: partner._id,
        });

        // If the partner has fewer bookings, update assignedPartner
        if (noOfSellerBookings < minBookings) {
          minBookings = noOfSellerBookings;
          assignedPartner = partner._id;
        }
      }
    }
  }

  // If no partner is available, return
  if (!assignedPartner) return;

  // Update booking with assigned partner and status
  booking.sellerId = assignedPartner;
  booking.status = "alloted";
  booking.autoAssigned = true

  // Save the updated booking
  await booking.save();
};

