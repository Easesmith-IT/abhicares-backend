const Complaint = require('../../models/complaint');
const mongoose = require('mongoose');


exports.addComplaint = async (req, res)=>{
    try{
        const {
            issue,
            issueType,
            ticketNumber,
            assignee,
            description,
            orderId,
            productId,
            userId,
        } = req.body;

        const existingTicketNum = await Complaint.findOne({ticketNumber:ticketNumber});
        if(existingTicketNum){
            return res.status(400).json({
                message:"Ticket Number should be unique"
            })
        }

        const img = req.file;
        // if(!img){
        //     return res.status(400).json({msg: 'No image provided'});
        // }

        const alreadyRegistered = await Complaint.aggregate([
            {
                $match: { 
                    $and:[
                        {ticketNumber:ticketNumber},
                        {status:"opened"}
                    ] 
                }
            }
        ]);
        console.log("alredy == ", alreadyRegistered);
        if(alreadyRegistered.length>0){
            return res.status(404).json({
                message:"This ticket is still opened"
            })
        }

        else{
            if(!req.body){
                return res.status(400).json({
                    message:"No data recieved please try again!"
                })
            }
            const image = img.path;
            const complaint = await Complaint.create({
                issue: issue,
                issueType:issueType,
                ticketNumber: ticketNumber,
                assignee: assignee,
                description:description,
                image:image,
                orderId: mongoose.Schema.Types.ObjectId(orderId),
                productId: mongoose.Schema.Types.ObjectId(productId),
                userId: mongoose.Schema.Types.ObjectId(userId),
            })
    
            if(!complaint){
                return res.status(404).json({
                    message:"Complaint could not be added"
                })
            }
    
            res.status(200).json({
                message:"Complaint is added",
                complaint:complaint
            })
        }
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            message:"Something went wrong while adding complaint"
        })
    }
}

exports.viewAllComplaints = async (req, res)=>{
    try{
        const complaints = await Complaint.find({});

        if(!complaints){
            return res.status(400).json({
                message:"No complaint found"
            })
        }

        res.status(200).json({
            complaints:complaints
        })
    }
    catch(err){
        return res.status(500).json({
            message:"Something went wrong"
        })
    }
}

exports.viewComplaint = async (req, res)=>{
    try{
        const userId = req.params.userId;
        const complaints = await Complaint.find({userId: userId});

        if(!complaints){
            return res.status(400).json({
                message:"No complaint found"
            })
        }

        res.status(200).json({
            complaints:complaints
        })
    }
    catch(err){
        return res.status(500).json({
            message:"Something went wrong"
        })
    }
}

exports.updateComplaintByTicketNumber = async(req, res)=>{
    try{
        const ticketNumber = req.query.ticketNumber;
        let assignedTo;

        if(req.body.assignee){
            assignedTo=req.body.assignee;
        }
        

        const {
            status,
            reply,
            repliedBy
        } = req.body;

        const openedTicket = await Complaint.aggregate([
            {
                $match: { 
                    $and:[
                        {ticketNumber:ticketNumber},
                        {status:"opened"}
                    ] 
                }
            }
        ]);

        if(openedTicket.length<=0){
            return res.status(404).json({
                message:"There is no opened ticket for this ticket number"
            })
        }

        const complaint = await Complaint.findOneAndUpdate({ticketNumber:ticketNumber},{
            $push:{
                replies:{reply,repliedBy}
            },
            $set:{
                status:status
            }
        }, { new: true}) 

        if(!complaint){
            return res.status(400).json({
                message:"Complaint could not be updated"
            })
        }

        res.status(200).json({
            message:"Complaint updated succesfully"
        })
    }
    catch(err){
        return res.status(500).json({
            message:"Something went wrong while updating complaint"
        })
    }
}


exports.deleteComplaint = async(req, res)=>{
    try{
        const complaintId = req.params.id;

        if(!complaintId){
            return res.status(400).json({
                message:"No complaint Id is provided"
            })
        }

        const complaint = await Complaint.findOne({ _id: complaintId});

        if(!complaint){
            return res.status(400).json({
                message:"No complaint could be found"
            })
        }

        const fifteenDaysAgo = new Date();
        //this day should be changed to 15 at the time of production for testing day is 1
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 1);

        const comp = await Complaint.deleteOne({
            $and:[
                {
                    status:"closed",
                    createdAt:{ $lte: fifteenDaysAgo.toISOString() },
                }
            ]
        })

        if(!comp){
            return res.status(400).json({
                message:"complaint could not be deleted"
            })
        }

        res.status(200).json({
            message:"Complaint is deleted"
        })
    }
    catch(err){
        return res.status(500).json({
            message:"Something went wrong while deleting complaint"
        })
    }
}

