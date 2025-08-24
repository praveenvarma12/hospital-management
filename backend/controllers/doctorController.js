import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";

// API for doctor Login 
const loginDoctor = async (req, res) => {

    try {

        const { email, password } = req.body
        const user = await doctorModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }


    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
    try {

        const { docId } = req.body
        const appointments = await appointmentModel.find({ docId })

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
    try {

        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })
            return res.json({ success: true, message: 'Appointment Cancelled' })
        }

        res.json({ success: false, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to mark appointment completed for doctor panel
const appointmentComplete = async (req, res) => {
    try {

        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true })
            return res.json({ success: true, message: 'Appointment Completed' })
        }

        res.json({ success: false, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to get all doctors list for Frontend
const doctorList = async (req, res) => {
    try {
        // fetch as plain objects and exclude sensitive fields
        const doctors = await doctorModel.find({}).select(['-password', '-email']).lean()

        // strip any image fields so the frontend "all doctors" list cannot show the small image
        const cleaned = doctors.map(({ profileImage, avatar, photo, ...rest }) => rest)

        res.json({ success: true, doctors: cleaned })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to search doctors by a free-text query across name, speciality, hospitalName, hospitalLocation
const searchDoctors = async (req, res) => {
    try {
        // Accept a single q param (preferred) or fall back to legacy name/hospitalName/location params
        const { q, speciality } = req.query
        const legacyName = req.query.name || req.query.hospitalName || req.query.location || ''
        const searchTerm = (q || legacyName || '').trim()

        const mainQuery = {}

        // speciality acts as an AND filter
        if (speciality) {
            mainQuery.speciality = { $regex: speciality, $options: 'i' }
        }

        if (searchTerm) {
            // perform OR across multiple fields so single search term matches any of them
            mainQuery.$or = [
                { name: { $regex: searchTerm, $options: 'i' } },
                { hospitalName: { $regex: searchTerm, $options: 'i' } },
                { hospitalLocation: { $regex: searchTerm, $options: 'i' } },
                { speciality: { $regex: searchTerm, $options: 'i' } }
            ]
        }

        // fetch as plain objects and exclude sensitive fields
        const doctors = await doctorModel.find(mainQuery).select(['-password', '-email']).lean()

        // strip image fields to prevent the small image from being returned to the listing UI
        const cleaned = doctors.map(({ profileImage, avatar, photo, ...rest }) => rest)

        res.json({ success: true, doctors: cleaned })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to change doctor availablity for Admin and Doctor Panel
const changeAvailablity = async (req, res) => {
    try {

        const { docId } = req.body

        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
        res.json({ success: true, message: 'Availablity Changed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor profile for  Doctor Panel
const doctorProfile = async (req, res) => {
    try {

        const { docId } = req.body
        const profileData = await doctorModel.findById(docId).select('-password')

        res.json({ success: true, profileData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update doctor profile data from  Doctor Panel
const updateDoctorProfile = async (req, res) => {
    try {

    const { docId, fees, address, available, hospitalName, hospitalLocation, mapLink } = req.body

    const update = { fees, address, available }
    if (hospitalName !== undefined) update.hospitalName = hospitalName
    if (hospitalLocation !== undefined) update.hospitalLocation = hospitalLocation
    if (mapLink !== undefined) update.mapLink = mapLink

    await doctorModel.findByIdAndUpdate(docId, update)

    res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
    try {

        const { docId } = req.body

        const appointments = await appointmentModel.find({ docId })

        let earnings = 0

        appointments.map((item) => {
            if (item.isCompleted || item.payment) {
                earnings += item.amount
            }
        })

        let patients = []

        appointments.map((item) => {
            if (!patients.includes(item.userId)) {
                patients.push(item.userId)
            }
        })



        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: patients.length,
            latestAppointments: appointments.reverse()
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export {
    loginDoctor,
    appointmentsDoctor,
    appointmentCancel,
    doctorList,
    searchDoctors,
    changeAvailablity,
    appointmentComplete,
    doctorDashboard,
    doctorProfile,
    updateDoctorProfile
}