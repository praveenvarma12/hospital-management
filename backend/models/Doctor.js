const mongoose = require('mongoose');

const SlotSchema = new mongoose.Schema({
	// single point-in-time slot (date includes date+time)
	slot: { type: Date, required: true },
	booked: { type: Boolean, default: false }
});

const DoctorSchema = new mongoose.Schema({
	doctorName: { type: String, required: true, trim: true },
	qualification: { type: String, trim: true },
	specialty: { type: String, required: true, trim: true },
	experienceYears: { type: Number, default: 0 },
	hospitalName: { type: String, trim: true },
	hospitalLocation: { type: String, trim: true },
	consultationFee: { type: Number, default: 0 },
	availableSlots: { type: [SlotSchema], default: [] },
	profileImage: { type: String, default: '' }, // Cloudinary URL
	registrationVerified: { type: Boolean, default: false },
	ratings: [
		{
			patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
			score: { type: Number, min: 1, max: 5 },
			comment: String,
			createdAt: { type: Date, default: Date.now }
		}
	],
}, { timestamps: true });

module.exports = mongoose.model('Doctor', DoctorSchema);