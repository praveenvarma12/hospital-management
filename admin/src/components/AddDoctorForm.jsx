import React, { useState } from 'react';

export default function AddDoctorForm() {
	const [form, setForm] = useState({
		doctorName: '',
		qualification: '',
		specialty: '',
		experienceYears: '',
		hospitalName: '',
		hospitalLocation: '',
		consultationFee: '',
		registrationVerified: false
	});
	const [slots, setSlots] = useState([]); // array of ISO strings
	const [slotDate, setSlotDate] = useState('');
	const [slotTime, setSlotTime] = useState('');
	const [photo, setPhoto] = useState(null);
	const [loading, setLoading] = useState(false);

	const addSlot = () => {
		if (!slotDate || !slotTime) return;
		const dt = new Date(`${slotDate}T${slotTime}`);
		setSlots(prev => [...prev, dt.toISOString()]);
		setSlotDate(''); setSlotTime('');
	};

	const removeSlot = (index) => {
		setSlots(prev => prev.filter((_, i) => i !== index));
	};

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		try {
			const fd = new FormData();
			fd.append('doctorName', form.doctorName);
			fd.append('qualification', form.qualification);
			fd.append('specialty', form.specialty);
			fd.append('experienceYears', form.experienceYears);
			fd.append('hospitalName', form.hospitalName);
			fd.append('hospitalLocation', form.hospitalLocation);
			fd.append('consultationFee', form.consultationFee);
			fd.append('registrationVerified', form.registrationVerified);
			fd.append('availableSlots', JSON.stringify(slots));
			if (photo) fd.append('profileImage', photo);

			const res = await fetch('/api/doctors', {
				method: 'POST',
				body: fd
				// include auth headers if required by your admin auth
			});
			const data = await res.json();
			if (data.success) {
				alert('Doctor added');
				// reset
				setForm({ doctorName:'', qualification:'', specialty:'', experienceYears:'', hospitalName:'', hospitalLocation:'', consultationFee:'', registrationVerified:false });
				setSlots([]);
				setPhoto(null);
			} else {
				alert('Error: ' + (data.message || 'Failed'));
			}
		} catch (err) {
			console.error(err);
			alert('Server error');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-6 max-w-3xl mx-auto">
			<h2 className="text-2xl font-semibold mb-4">Add Doctor</h2>
			<form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<input required name="doctorName" value={form.doctorName} onChange={handleChange} placeholder="Doctor Name" className="input" />
					<input name="qualification" value={form.qualification} onChange={handleChange} placeholder="Qualification (e.g. MBBS, MD)" className="input" />
					<input required name="specialty" value={form.specialty} onChange={handleChange} placeholder="Specialty" className="input" />
					<input name="experienceYears" value={form.experienceYears} onChange={handleChange} placeholder="Experience (years)" className="input" type="number" />
					<input name="hospitalName" value={form.hospitalName} onChange={handleChange} placeholder="Hospital Name" className="input" />
					<input name="hospitalLocation" value={form.hospitalLocation} onChange={handleChange} placeholder="Hospital Location" className="input" />
					<input name="consultationFee" value={form.consultationFee} onChange={handleChange} placeholder="Consultation Fee" className="input" type="number" />
					<label className="flex items-center space-x-2">
						<input type="checkbox" name="registrationVerified" checked={form.registrationVerified} onChange={handleChange} />
						<span className="text-sm">Medical Registration Verified</span>
					</label>
				</div>

				<div className="border rounded p-3">
					<h4 className="font-medium mb-2">Available Slots</h4>
					<div className="flex gap-2 items-center">
						<input type="date" value={slotDate} onChange={e => setSlotDate(e.target.value)} className="input" />
						<input type="time" value={slotTime} onChange={e => setSlotTime(e.target.value)} className="input" />
						<button type="button" onClick={addSlot} className="btn-primary">Add Slot</button>
					</div>
					<ul className="mt-2 space-y-1">
						{slots.map((s, i) => (
							<li key={i} className="flex justify-between items-center">
								<span>{new Date(s).toLocaleString()}</span>
								<button type="button" onClick={() => removeSlot(i)} className="text-red-500">Remove</button>
							</li>
						))}
					</ul>
				</div>

				<div>
					<label className="block mb-1">Profile Photo</label>
					<input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} />
				</div>

				<div className="flex justify-end">
					<button type="submit" disabled={loading} className="btn-primary">
						{loading ? 'Saving...' : 'Save Doctor'}
					</button>
				</div>
			</form>
		</div>
	);
}
