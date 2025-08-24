const express = require('express');
const router = express.Router();
const multer = require('multer');
const doctorController = require('../controllers/doctorController');

// multer temp upload to /uploads
const upload = multer({ dest: 'uploads/' });

// POST add doctor (admin)
router.post('/', upload.single('profileImage'), doctorController.addDoctor);

// GET search
router.get('/search', doctorController.searchDoctors);

// GET doctor by id
router.get('/:id', doctorController.getDoctorById);

// POST book appointment for doctor
router.post('/:id/book', doctorController.bookAppointment);

module.exports = router;