const {CHAPERONE_LOGO_BASE64_URL} = require('../constants/variable');

exports.getInvoiceData = (userInfo) =>{

    var data = {
        // Customize enables you to provide your own templates
        // Please review the documentation for instructions and examples
        // "customize": {
        //     //  "template": fs.readFileSync('template.html', 'base64') // Must be base64 encoded html 
        // },
        "images": {
            // The logo on top of your invoice
            CHAPERONE_LOGO_BASE64_URL,
            // The invoice background
            // "background": ""
        },
        // Your own data
        "sender": {
            "company": "Chaperone",
            // "address": "",
            // "zip": "1234 AB",
            "city": "Gurugram",
            "country": "India"
            //"custom1": "custom value 1",
            //"custom2": "custom value 2",
            //"custom3": "custom value 3"
        },
        // Your recipient
        "client": {
            "company": `${userInfo.company}`,
            "address": `${userInfo.address}`,
            "zip": `${userInfo.pincode}`,
            "city": `${userInfo.city}`,
            "country": "India"
            // "custom1": "custom value 1",
            // "custom2": "custom value 2",
            // "custom3": "custom value 3"
        },
        "information": {
            // Invoice number
            "number": `${userInfo.orderId}`,
            // Invoice data
            "date": `${userInfo.currentDate}`,
            // Invoice due date
            "due-date": `${userInfo.deliveryDate}`
        },
        "bottom-notice": "This is digitally generated invoice will be used for online purpose.",
        // The products you would like to see on your invoice
        // Total values are being calculated automatically
        "products": userInfo.products,
        "settings":{
            "currency":"INR",
            "language":"en",
        },
        "translate":{
            "vat":"GST",
            "due-date":"delivery-in",
            "number": "Order ID",
            "date":"Order Date"
        }
    };

    return data;
}

exports.getCurrentDate = (now)=>{
    // const now = new Date();
    
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    
    // Convert hours to 12-hour format
    let formattedHours = hours % 12;
    formattedHours = formattedHours ? formattedHours : 12; // Handle midnight (0) as 12 AM
    
    const formattedDate = `${day}-${month}-${year} ${formattedHours}:${minutes}${ampm}`;
    
    return formattedDate;
      
}

exports.getDeliveryDate = ()=>{
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate()+5);
    const newDeliveryDate = this.getCurrentDate(deliveryDate);
   return newDeliveryDate;
}