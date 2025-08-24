import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

export default function SearchDoctors() {
	const [q, setQ] = useState('');
	const [speciality, setSpeciality] = useState('');
	const [hospital, setHospital] = useState('');
	const [location, setLocation] = useState('');
	const [availability, setAvailability] = useState('any'); // any | available | unavailable
	const [sortBy, setSortBy] = useState('relevance'); // relevance | name | experience | fee
	const [view, setView] = useState('grid'); // grid | list
	const [doctors, setDoctors] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	// new state for location detection
	const [detectingLocation, setDetectingLocation] = useState(false);
	const [currentCoords, setCurrentCoords] = useState(null);

	const fetchDoctors = async (params = {}) => {
		setLoading(true);
		setError(null);
		try {
			const searchParams = new URLSearchParams();
			if (params.q !== undefined ? params.q : q) searchParams.append('q', params.q !== undefined ? params.q : q);
			if (params.speciality !== undefined ? params.speciality : speciality) searchParams.append('speciality', params.speciality !== undefined ? params.speciality : speciality);
			if (params.hospital !== undefined ? params.hospital : hospital) searchParams.append('hospital', params.hospital !== undefined ? params.hospital : hospital);
			if (params.location !== undefined ? params.location : location) searchParams.append('location', params.location !== undefined ? params.location : location);

			const res = await fetch(`/api/doctors/search?${searchParams.toString()}`);
			const data = await res.json();
			if (data.success) {
				setDoctors(Array.isArray(data.doctors) ? data.doctors : []);
			} else {
				setError(data.message || 'Failed to load doctors');
			}
		} catch (err) {
			console.error(err);
			setError('Server error');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		// initial load - fetch all doctors
		fetchDoctors({ q: '' });
	}, []);

	// computed statistics for the stats bar
	const stats = useMemo(() => {
		const total = doctors.length;
		const available = doctors.filter(d => d.available || (d.availableSlots && d.availableSlots.some(s => !s.booked))).length;
		const unavailable = total - available;
		const specialties = new Set(doctors.map(d => (d.speciality || d.specialty || 'Unknown').toLowerCase()));
		const hospitals = new Set(doctors.map(d => (d.hospitalName || '').toLowerCase()).filter(Boolean));
		return {
			total,
			available,
			unavailable,
			specialties: specialties.size,
			hospitals: hospitals.size
		};
	}, [doctors]);

	// apply client-side filters and sorting (availability filter + sort)
	const filtered = useMemo(() => {
		let list = [...doctors];

		// normalize field names (some models use different keys)
		list = list.map(d => ({
			...d,
			_displayName: d.doctorName || d.name || 'Unknown',
			_displaySpeciality: d.speciality || d.specialty || 'General',
			_displayHospital: d.hospitalName || d.hospital || '',
			_displayLocation: d.hospitalLocation || d.location || ''
		}));

		// availability filter
		if (availability === 'available') {
			list = list.filter(d => (d.available || (d.availableSlots && d.availableSlots.some(s => !s.booked))));
		} else if (availability === 'unavailable') {
			list = list.filter(d => !(d.available || (d.availableSlots && d.availableSlots.some(s => !s.booked))));
		}

		// local search across normalized fields (if user typed quickly and we didn't call API)
		if (q.trim()) {
			const rq = q.trim().toLowerCase();
			list = list.filter(d =>
				d._displayName.toLowerCase().includes(rq) ||
				d._displaySpeciality.toLowerCase().includes(rq) ||
				(d._displayHospital && d._displayHospital.toLowerCase().includes(rq)) ||
				(d._displayLocation && d._displayLocation.toLowerCase().includes(rq))
			);
		}

		// sorting
		if (sortBy === 'name') list.sort((a,b) => a._displayName.localeCompare(b._displayName));
		else if (sortBy === 'experience') list.sort((a,b) => (b.experienceYears || 0) - (a.experienceYears || 0));
		else if (sortBy === 'fee') list.sort((a,b) => (a.consultationFee || 0) - (b.consultationFee || 0));
		// relevance default is server-side; leave as-is

		return list;
	}, [doctors, availability, q, sortBy]);

	const handleSearchSubmit = (e) => {
		if (e) e.preventDefault();
		fetchDoctors({});
	};

	const handleResetFilters = () => {
		setQ(''); setSpeciality(''); setHospital(''); setLocation(''); setAvailability('any'); setSortBy('relevance');
		fetchDoctors({ q: '' });
	};

	// small visuals
	const Placeholder = () => (
		<div className="text-center py-12 text-gray-500">
			<div className="text-2xl mb-2">No doctors found</div>
			<div className="text-sm">Try resetting filters or search by speciality/location</div>
			<button onClick={handleResetFilters} className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded">Reset Filters</button>
		</div>
	);

	// reverse-geocode using OpenStreetMap Nominatim (no API key needed)
	const detectLocation = async () => {
		if (!navigator.geolocation) {
			alert('Geolocation is not supported by your browser');
			return;
		}
		// immediate feedback
		setDetectingLocation(true);
		setLocation('Detecting...');

		navigator.geolocation.getCurrentPosition(async (pos) => {
			try {
				const { latitude, longitude } = pos.coords;
				setCurrentCoords({ lat: latitude, lon: longitude });

				// reverse geocode (try to pick a short human-friendly label)
				const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
				const resp = await fetch(url, {
					headers: { 'Accept': 'application/json' }
				});
				const json = await resp.json();

				const place = json?.address?.city
					|| json?.address?.town
					|| json?.address?.village
					|| json?.address?.county
					|| json?.address?.state
					|| json?.display_name
					|| `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;

				// set a friendly short label
				setLocation(place);
				// trigger search with detected location
				fetchDoctors({ location: place });
			} catch (err) {
				console.error(err);
				alert('Unable to detect location automatically. Please enter location manually.');
				// restore empty label if reverse geocode failed
				setLocation('');
			} finally {
				setDetectingLocation(false);
			}
		}, (err) => {
			console.error(err);
			alert('Location permission denied or unavailable.');
			setDetectingLocation(false);
			setLocation('');
		}, { enableHighAccuracy: false, timeout: 10000 });
	};

	// compute hospital options from loaded doctors
	const hospitalOptions = useMemo(() => {
		const setH = new Set();
		doctors.forEach(d => {
			const name = (d.hospitalName || d._displayHospital || '').trim();
			if (name) setH.add(name);
		});
		return Array.from(setH).sort();
	}, [doctors]);

	return (
		<div className="p-6 max-w-7xl mx-auto">
			{/* Header / Search */}
			<div className="bg-white p-4 rounded shadow mb-6">
				<div className="flex flex-col md:flex-row md:items-center gap-3">
					<form onSubmit={handleSearchSubmit} className="flex-1 flex gap-3">
						<input value={q} onChange={e => setQ(e.target.value)} placeholder="Search doctors, speciality, hospital or location" className="w-full px-4 py-2 border rounded focus:outline-none" />
						<button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Search</button>
					</form>

					<div className="flex items-center gap-2">
						<button onClick={() => setView('grid')} className={`px-3 py-2 rounded ${view==='grid' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>Grid</button>
						<button onClick={() => setView('list')} className={`px-3 py-2 rounded ${view==='list' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>List</button>

						{/* Location button (auto-detect) */}
						<button
							onClick={detectLocation}
							disabled={detectingLocation}
							className={`ml-3 flex items-center gap-2 px-3 py-2 rounded border hover:bg-gray-50 ${detectingLocation ? 'opacity-60 cursor-not-allowed' : ''}`}
							title="Detect my location"
						>
							<svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none"><path d="M12 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M12 18v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M4 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M16 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>
							<span className="text-sm">
								{detectingLocation
									? 'Detecting...'
									: (location ? (location.length > 24 ? `${location.slice(0, 24)}...` : location) : 'Set location')}
							</span>
						</button>
					</div>
				</div>

				{/* Filters */}
				<div className="mt-4 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
					<input value={speciality} onChange={e => setSpeciality(e.target.value)} placeholder="Filter: Speciality" className="px-3 py-2 border rounded" />
					{/* Hospital dropdown populated from loaded doctors */}
					<select value={hospital} onChange={e => setHospital(e.target.value)} className="px-3 py-2 border rounded">
						<option value="">Filter: Hospital</option>
						{hospitalOptions.map(h => <option key={h} value={h}>{h}</option>)}
					</select>
					<input value={location} onChange={e => setLocation(e.target.value)} placeholder="Filter: Location" className="px-3 py-2 border rounded" />
					<select value={availability} onChange={e => setAvailability(e.target.value)} className="px-3 py-2 border rounded">
						<option value="any">Any availability</option>
						<option value="available">Available</option>
						<option value="unavailable">Unavailable</option>
					</select>
					<select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-2 border rounded">
						<option value="relevance">Sort: Relevance</option>
						<option value="name">Sort: Name</option>
						<option value="experience">Sort: Experience</option>
						<option value="fee">Sort: Fee (low → high)</option>
					</select>
					<div className="flex items-center gap-2">
						<button onClick={() => fetchDoctors({ q, speciality, hospital, location })} className="px-3 py-2 bg-indigo-600 text-white rounded">Apply</button>
						<button onClick={handleResetFilters} className="px-3 py-2 bg-gray-100 rounded">Reset</button>
					</div>
				</div>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
				<div className="bg-white rounded p-4 shadow flex items-center gap-4">
					<div className="bg-indigo-50 text-indigo-600 rounded-full p-3"><svg className="w-6 h-6" viewBox="0 0 24 24" fill="none"><path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zM6 20c0-2.21 3.582-4 6-4s6 1.79 6 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
					<div>
						<div className="text-sm text-gray-500">Total Doctors</div>
						<div className="text-lg font-semibold">{stats.total}</div>
					</div>
				</div>

				<div className="bg-white rounded p-4 shadow flex items-center gap-4">
					<div className="bg-green-50 text-green-600 rounded-full p-3"><svg className="w-6 h-6" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
					<div>
						<div className="text-sm text-gray-500">Available</div>
						<div className="text-lg font-semibold text-green-600">{stats.available}</div>
					</div>
				</div>

				<div className="bg-white rounded p-4 shadow flex items-center gap-4">
					<div className="bg-yellow-50 text-yellow-600 rounded-full p-3"><svg className="w-6 h-6" viewBox="0 0 24 24" fill="none"><path d="M12 2v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
					<div>
						<div className="text-sm text-gray-500">Specialities</div>
						<div className="text-lg font-semibold">{stats.specialties}</div>
					</div>
				</div>

				<div className="bg-white rounded p-4 shadow flex items-center gap-4">
					<div className="bg-blue-50 text-blue-600 rounded-full p-3"><svg className="w-6 h-6" viewBox="0 0 24 24" fill="none"><path d="M3 7h18v10H3z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
					<div>
						<div className="text-sm text-gray-500">Hospitals</div>
						<div className="text-lg font-semibold">{stats.hospitals}</div>
					</div>
				</div>
			</div>

			{/* Results area */}
			<div className="mb-4 flex items-center justify-between">
				<div className="text-sm text-gray-600">{filtered.length} result(s) {q ? `for "${q}"` : ''}</div>
				{loading && <div className="text-sm text-indigo-600">Loading...</div>}
			</div>

			{loading ? (
				<div className="bg-white rounded p-8 shadow text-center">Loading doctors...</div>
			) : error ? (
				<div className="bg-red-50 text-red-700 rounded p-6">{error}</div>
			) : filtered.length === 0 ? (
				<Placeholder />
			) : view === 'grid' ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{filtered.map(doc => (
						<div key={doc._id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-4 flex flex-col">
							<div className="flex items-center gap-4">
								{/* Small profile image removed — show initials avatar instead */}
								<div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-xl font-semibold text-gray-700 shadow-sm">
									{(doc._displayName || doc.doctorName || 'D').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()}
								</div>
								<div className="flex-1">
									<div className="flex justify-between items-start">
										<div>
											<h3 className="text-lg font-semibold">{doc._displayName}</h3>
											<div className="text-sm text-gray-600">{doc._displaySpeciality} • {doc.experienceYears || 0} yrs</div>
											<div className="text-sm text-gray-600 mt-1">{doc._displayHospital} {doc._displayLocation ? `• ${doc._displayLocation}` : ''}</div>
										</div>
										<div className="text-right">
											<div className={`text-sm font-medium ${doc.available || (doc.availableSlots && doc.availableSlots.some(s=>!s.booked)) ? 'text-green-600' : 'text-gray-400'}`}>
												{doc.available || (doc.availableSlots && doc.availableSlots.some(s=>!s.booked)) ? 'Available' : 'Unavailable'}
											</div>
											<div className="text-indigo-600 font-semibold mt-2">₹{doc.consultationFee || '—'}</div>
										</div>
									</div>
								</div>
							</div>

							<div className="mt-4 flex items-center justify-between gap-2">
								<div className="flex items-center gap-2">
									<Link to={`/doctor/${doc._id}`} className="text-sm px-3 py-2 bg-gray-100 rounded hover:bg-gray-200">View Profile</Link>
									<Link to={`/doctor/${doc._id}`} className="text-sm px-3 py-2 bg-indigo-600 text-white rounded hover:opacity-95">Book</Link>
								</div>
								<div className="flex items-center gap-2">
									<button title="Edit" className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">Edit</button>
									<button title="Delete" className="px-2 py-1 bg-red-100 text-red-700 rounded">Delete</button>
								</div>
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="bg-white rounded shadow overflow-x-auto">
					<table className="min-w-full">
						<thead className="bg-gray-50">
							<tr>
								<th className="text-left px-4 py-3 text-sm text-gray-600">Doctor</th>
								<th className="text-left px-4 py-3 text-sm text-gray-600">Speciality</th>
								<th className="text-left px-4 py-3 text-sm text-gray-600">Hospital</th>
								<th className="text-left px-4 py-3 text-sm text-gray-600">Experience</th>
								<th className="text-left px-4 py-3 text-sm text-gray-600">Fee</th>
								<th className="px-4 py-3" />
							</tr>
						</thead>
						<tbody>
							{filtered.map(doc => (
								<tr key={doc._id} className="border-b hover:bg-gray-50">
									<td className="px-4 py-3">
										<div className="flex items-center gap-3">
											{/* small image removed from list view — use compact initials avatar */}
											<div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-700">
												{(doc._displayName || doc.doctorName || 'D').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()}
											</div>
											<div>
												<div className="font-medium">{doc._displayName}</div>
												<div className="text-sm text-gray-500">{doc._displayLocation}</div>
											</div>
										</div>
									</td>
									<td className="px-4 py-3 text-sm text-gray-700">{doc._displaySpeciality}</td>
									<td className="px-4 py-3 text-sm text-gray-700">{doc._displayHospital}</td>
									<td className="px-4 py-3 text-sm text-gray-700">{doc.experienceYears || 0} yrs</td>
									<td className="px-4 py-3 text-sm text-indigo-600 font-semibold">₹{doc.consultationFee || '—'}</td>
									<td className="px-4 py-3 text-right">
										<Link to={`/doctor/${doc._id}`} className="text-sm px-3 py-1 bg-gray-100 rounded">View</Link>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
