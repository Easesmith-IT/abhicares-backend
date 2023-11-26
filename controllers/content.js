const Content = require('../models/content');

exports.addContent = async(req, res) =>{
    try{
        const {
            title,
            type,
            value,
            description,
            section
        } = req.body;

        const content = await Content.create({
            title: title,
            type: type,
            value: value,
            description: description,
            section: section
        });

        if(!content){
            return res.status(400).json({
                message: "Could not content please try again!"
            })
        }

        res.status(200).json({
            message: "content added successfully",
        })
    }
    catch(err){
        return res.status(500).json({
            message: "Error while adding user address",
            error: err.message
        })
    }
}

exports.updateContent = async(req, res) =>{
    try{

        const id = req.params.id;
        const content = await Content.findOne({_id:id})

        if(!content){
            return res.status(404).json({
                message:`Content not found with this ${id}`
            })
        }

        
        const {
            title,
            type,
            value,
            description,
            section
        } = req.body;

        const updateContent = {
            title: title,
            type: type,
            value: value,
            description: description,
            section: section
        }

        const update = await Content.findOneAndUpdate({ _id: id }, updateContent, { new: true });

        if(!update){
            return res.status(400).json({
                message: "Could not update Content"
            })
        }

        res.status(200).json({
            message: "updated successfully",
        })
    }
    catch(err){
        return res.status(500).json({
            message: "Error while updating content",
            error: err.message
        })
    }
}

exports.getContent = async(req, res) =>{
    try{
        const title = req.query.title;
        const content = await Content.findOne({ title: title });
        if (!content) {
            return res.status(404).json({
                message: `No content found for the title ${title}`
            });
        }
        res.status(200).json({
            content: content
        })
    }
    catch(err){
        return res.status(500).json({
            message: "Error fetching addresses",
            error: err.message
        })
    }
}
