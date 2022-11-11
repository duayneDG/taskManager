const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('async-handler')
const bcrypt = require('bcrypt')
const { findOne } = require('../models/User')



//-----Routes-----

//@desc Get all Users
//@route GET /users
//@access Private
const getAllUsers = asyncHandler ( async (req, res) => {
    const users = await User.find().select('-password').lean()
    if(!users){
        return res.status(400).json({ message: 'No user Found'})
    }
    res.json(users)
})

//@desc Create new User
//@route POST /users
//@access Private
const createNewUser = asyncHandler ( async (req, res) => {

    const {username, password, roles } = req.body
    //-----confirm fields are filled
    if(!username || !password || !Array.isArray(roles) || !roles.length){
        return res.status(400).json({message: "all fields are required"})
    }

    //-----Check for duplicates
    const duplicate = await User.findOne({ username }).lean().exec()
    if (duplicate) {
        return res.status(409).json({message: 'username already exists' })
    }

    //-----Hash Password
    const hashedPwd = await bcrypt.hash(password, 10) //10 salt rounds

    //-----UserObject
    const userObject = {username, 'password':hashedPwd, roles}

    //-----Create and Store user in database
    const user = await User.create(userObject)

    if(user){
        res.status(201).json({message: `New User ${username} created`})
    } else{
        res.status(400).json({message: 'User was not created, please check input fields'})
    }

})

//@desc update user
//@route PATCH /users
//@access Private
const updateUser = asyncHandler ( async (req, res) => {
    //destructered body from userform
    const {id, username, roles, isActive, password} = req.body 

    //Confirm all data exists
    if (!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean') {
        return res.status(400).json({ message: 'All fields except password are required' })
    }

    const user = await User.findById(id).exec()

    //Check if user exists to update
    if(!username){
        return res.status(400).json({message: 'User name does not exist in database, please check spelling'})
    }
    
    //check for duplicate username in database 
    const duplicateUser = await User.find({username}).lean().exec()
    if(duplicate && duplicate?._id.toString() !==id){
        return res.status(409).json({message:'Duplicate User'})
    }
    //Updates user properties
    user.username = username
    user.roles = roles
    user.isActive = isActive

    //will update password if password is needs to be updated 
    if (password) {
        //Hash Password
        user.password = await bcrypt.hash(password, 10) // 10 salt rounds - standard
    }

    const updatedUser = await user.save() //saves user to Database 

    res.json({message: `User: ${updatedUser.username} has been updated`})



})

//@desc delete user
//@route DELETE /users
//@access Private
const deleteUser = asyncHandler ( async (req, res) => {
    const { id } = req.body

    if(!id){
        return res.status(400).json({ message: 'User ID Required'})
    }

    //Checks user for notes
    const notes = await Note.findOne({user: id}).lean().exec()

    //If user has a note in the "notes" property array - an error will occur preventing the note from being lost
    if(notes?.length){
        return res.status(400).json({message:'user has active notes assigned' })
    }

    const user = await User.findById(id).exec()

    if(!user) {
        return res.status(400).json({message: 'User not found'})
    }
    const result = await user.deleteOne()
    const reply = `Username ${result.username} with as been deleted from the database`
    res.json({reply})






})

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}