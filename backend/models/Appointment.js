const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
	doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
	patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	hospitalName: { type: String },
	hospitalLocation: { type: String },
	slot: { type: Date, required: true },
	fee: { type: Number, required: true },
	createdAt: { type: Date, default: Date.now },
	status: { type: String, enum: ['confirmed','cancelled','completed'], default: 'confirmed' }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
