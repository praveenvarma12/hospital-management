import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function DoctorProfile() {
	const { id } = useParams();
	const [doctor, setDoctor] = useState(null);
	const [loading, setLoading] = useState(true);
	const [bookingStatus, setBookingStatus] = useState(null);

	useEffect(() => {
		async function load() {
			setLoading(true);
			const res = await fetch(`/api/doctors/${id}`);
			const data = await res.json();
			if (data.success) setDoctor(data.doctor);
			setLoading(false);
		}
		load();
	}, [id]);

	// Improved slot grouping without mutating Date objects
	const groupSlots = () => {
		if (!doctor?.availableSlots) return { today: [], tomorrow: [], next: [] };
		const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
		const nowDay = startOf(new Date());
		const today = [];
		const tomorrow = [];
		const next = [];
		doctor.availableSlots.forEach(s => {
			if (s.booked) return;
			const dtObj = new Date(s.slot);
			const slotDay = startOf(dtObj);
			const diff = Math.round((slotDay - nowDay) / (1000 * 60 * 60 * 24));
			if (diff === 0) today.push(s);
			else if (diff === 1) tomorrow.push(s);
			else if (diff > 1) next.push(s);
		});
		// sort by earliest time
		const sortFn = (a,b) => new Date(a.slot) - new Date(b.slot);
		return { today: today.sort(sortFn), tomorrow: tomorrow.sort(sortFn), next: next.sort(sortFn) };
	};

	const { today, tomorrow, next } = groupSlots();

	const handleBook = async (slotIso) => {
		// Replace this placeholder patientId with logged-in user's id from auth context
		const patientId = localStorage.getItem('patientId') || '000000000000000000000000';
		try {
			const res = await fetch(`/api/doctors/${id}/book`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ patientId, slot: slotIso })
			});
			const data = await res.json();
			if (data.success) {
				setBookingStatus({ success: true, appointment: data.appointment });
				// refresh doctor slots
				const docRes = await fetch(`/api/doctors/${id}`);
				const d = await docRes.json();
				if (d.success) setDoctor(d.doctor);
			} else {
				setBookingStatus({ success: false, message: data.message || 'Failed' });
			}
		} catch (err) {
			console.error(err);
			setBookingStatus({ success: false, message: 'Server error' });
		}
	};

	// small UI helpers
	const StarRating = ({ score = 4.2 }) => {
		const full = Math.floor(score);
		const half = score - full >= 0.5;
		return (
			<div className="inline-flex items-center gap-2">
				<div className="flex text-yellow-400">
					{Array.from({ length: 5 }).map((_, i) => (
						<svg key={i} className={`w-4 h-4 ${i < full ? 'fill-current' : (i === full && half ? 'fill-current opacity-70' : 'text-gray-300')}`} viewBox="0 0 20 20">
							<path d="M10 15l-5.878 3.09 1.122-6.545L.488 6.91l6.561-.955L10 0l2.951 5.955 6.561.955-4.756 4.635 1.122 6.545z"/>
						</svg>
					))}
				</div>
				<span className="text-sm text-gray-600">{score.toFixed(1)}</span>
			</div>
		);
	};

	if (loading) return <div className="p-6">Loading...</div>;
	if (!doctor) return <div className="p-6">Doctor not found</div>;

	return (
		<div className="p-6 max-w-6xl mx-auto">
			<nav className="mb-4 text-sm text-gray-500">
				<Link to="/" className="hover:underline">Home</Link> · <Link to="/doctors" className="hover:underline">All Doctors</Link> · <span className="text-gray-800">Profile</span>
			</nav>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left / Main: Doctor details */}
				<div className="lg:col-span-2 space-y-6">
					<div className="bg-white rounded-lg shadow-md p-6 flex flex-col md:flex-row gap-6 items-start">
						<img src={doctor.profileImage || '/placeholder-doctor.png'} alt={doctor.doctorName} className="w-36 h-36 rounded-full object-cover ring-4 ring-white shadow-lg" />
						<div className="flex-1">
							<div className="flex justify-between items-start">
								<div>
									<h1 className="text-2xl font-semibold text-gray-800">{doctor.doctorName}</h1>
									<div className="text-sm text-gray-600 mt-1">{doctor.qualification} • <span className="font-medium text-gray-700">{doctor.specialty}</span></div>
									<div className="mt-2 text-sm text-gray-600">{doctor.experienceYears} years experience</div>
								</div>
								<div className="text-right space-y-2">
									<div className="inline-flex items-center gap-2">
										<StarRating score={doctor.avgRating || 4.2} />
									</div>
									<div className="mt-2">
										<span className="inline-flex items-center bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
											{doctor.registrationVerified ? 'Medical Registration Verified' : 'Not Verified'}
										</span>
									</div>
								</div>
							</div>

							<div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<div className="text-sm text-gray-500">Hospital</div>
									<div className="text-base font-medium text-gray-800">{doctor.hospitalName || '—'}</div>
									<div className="text-sm text-gray-600 flex items-center gap-2">
										<span>{doctor.hospitalLocation || '—'}</span>
										<a target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm" href={`https://www.google.com/maps/search/${encodeURIComponent(doctor.hospitalLocation || doctor.hospitalName || '')}`}>Get Directions</a>
									</div>
								</div>
								<div className="space-y-2">
									<div className="text-sm text-gray-500">Fee</div>
									<div className="text-2xl font-semibold text-indigo-600">₹{doctor.consultationFee}</div>
									<div className="text-sm text-gray-500">Mode: In-person / Video</div>
								</div>
							</div>

							{/* About / Qualifications */}
							<div className="mt-5">
								<h3 className="text-lg font-medium text-gray-800">Qualifications & Experience</h3>
								<p className="mt-2 text-gray-700">{doctor.qualification || '—'}</p>
								{doctor.bio && <p className="mt-2 text-gray-700">{doctor.bio}</p>}
							</div>
						</div>
					</div>

					{/* Reviews / Additional content placeholder */}
					<div className="bg-white rounded-lg shadow-md p-6">
						<h3 className="text-lg font-medium mb-3">Patient Reviews</h3>
						{/* Static example review */}
						<div className="space-y-4">
							<div className="flex items-start gap-4">
								<div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">A</div>
								<div>
									<div className="flex items-center gap-3">
										<div className="font-medium">Anita</div>
										<div className="text-sm text-gray-500">• 2 months ago</div>
										<div className="ml-4"><StarRating score={4.5} /></div>
									</div>
									<p className="text-gray-700 mt-1">Very professional and caring. Explained the diagnosis clearly.</p>
								</div>
							</div>
							{/* More reviews can be rendered here */}
						</div>
					</div>
				</div>

				{/* Right: Sticky booking card */}
				<div className="lg:col-span-1">
					<div className="sticky top-6 space-y-4">
						<div className="bg-white rounded-lg shadow-md p-5">
							<div className="flex items-center justify-between">
								<div>
									<div className="text-sm text-gray-500">Consultation</div>
									<div className="text-xl font-semibold text-indigo-600">₹{doctor.consultationFee}</div>
								</div>
								<button className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:opacity-95">
									<svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M3 5h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
									Call Now
								</button>
							</div>

							<hr className="my-4" />

							<h4 className="font-medium text-gray-700 mb-2">Available Slots</h4>

							{/* Slots grouped */}
							<div className="space-y-3">
								<div>
									<div className="text-sm font-medium text-gray-600 mb-2">Today</div>
									{today.length ? (
										<div className="grid grid-cols-2 gap-2">
											{today.map((s,i) => (
												<button key={i} onClick={() => handleBook(s.slot)} className="py-2 px-3 bg-white border rounded-md text-sm hover:shadow-sm">
													{new Date(s.slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
												</button>
											))}
										</div>
									) : (
										<div className="text-sm text-gray-500">No slots available today.</div>
									)}
								</div>

								{tomorrow.length > 0 && (
									<div>
										<div className="text-sm font-medium text-gray-600 mb-2">Tomorrow</div>
										<div className="grid grid-cols-2 gap-2">
											{tomorrow.map((s,i) => (
												<button key={i} onClick={() => handleBook(s.slot)} className="py-2 px-3 bg-white border rounded-md text-sm hover:shadow-sm">
													{new Date(s.slot).toLocaleDateString()} • {new Date(s.slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
												</button>
											))}
										</div>
									</div>
								)}

								{next.length > 0 && (
									<div>
										<div className="text-sm font-medium text-gray-600 mb-2">Next Days</div>
										<div className="space-y-2">
											{next.map((s,i) => (
												<button key={i} onClick={() => handleBook(s.slot)} className="w-full text-left py-2 px-3 bg-white border rounded-md text-sm hover:shadow-sm">
													{new Date(s.slot).toLocaleDateString()} • {new Date(s.slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
												</button>
											))}
										</div>
									</div>
								)}
							</div>

							{bookingStatus && bookingStatus.success && (
								<div className="mt-4 bg-green-50 p-3 rounded">
									<h4 className="font-medium">Booking Confirmed</h4>
									<p className="text-sm">Hospital: {bookingStatus.appointment.hospitalName}</p>
									<p className="text-sm">Location: {bookingStatus.appointment.hospitalLocation}</p>
									<p className="text-sm">Fee: ₹{bookingStatus.appointment.fee}</p>
									<p className="text-sm">Slot: {new Date(bookingStatus.appointment.slot).toLocaleString()}</p>
								</div>
							)}
							{bookingStatus && bookingStatus.success === false && (
								<div className="mt-4 bg-red-50 p-3 rounded">
									<p className="text-red-600 text-sm">{bookingStatus.message}</p>
								</div>
							)}
						</div>

						{/* Hospital details card */}
						<div className="bg-white rounded-lg shadow-md p-4">
							<h5 className="text-sm font-medium text-gray-700">Hospital Details</h5>
							<p className="text-sm text-gray-600 mt-2">{doctor.hospitalName}</p>
							<p className="text-sm text-gray-600">{doctor.hospitalLocation}</p>
							<a target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline mt-2 inline-block" href={`https://www.google.com/maps/search/${encodeURIComponent(doctor.hospitalLocation || doctor.hospitalName || '')}`}>Open in Maps</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
