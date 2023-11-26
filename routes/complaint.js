const express = require('express');
const router = express.Router();

const complaintController = require('../controllers/complaint');

router.post("/add-complaint", complaintController.addComplaint);
router.get("/view-all-complaints", complaintController.viewAllComplaints);
router.get("/view-complaint/:userId", complaintController.viewComplaint);
router.patch("/update-status", complaintController.updateComplaintByTicketNumber);

module.exports = router;