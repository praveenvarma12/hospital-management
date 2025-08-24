import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { useNavigate, useParams } from 'react-router-dom'

const Doctors = () => {

  const { speciality } = useParams()

  const [filterDoc, setFilterDoc] = useState([])
  const [showFilter, setShowFilter] = useState(false)
  const navigate = useNavigate();

  const { doctors } = useContext(AppContext)
  const { backendUrl } = useContext(AppContext)
  const [searchQuery, setSearchQuery] = useState('')
  const [querySpeciality, setQuerySpeciality] = useState('')

  const applyFilter = () => {
    if (speciality) {
      setFilterDoc(doctors.filter(doc => doc.speciality === speciality))
    } else {
      setFilterDoc(doctors)
    }
  }

  const searchDoctors = async () => {
    try {
      // if search query is empty, reset to the original list (and apply speciality filter if present)
      if (!searchQuery) {
        if (speciality) {
          setFilterDoc(doctors.filter(doc => doc.speciality === speciality))
        } else {
          setFilterDoc(doctors)
        }
        return
      }

      const params = new URLSearchParams()
      // send single 'q' param for server-side OR search
      params.append('q', searchQuery)
      if (querySpeciality) params.append('speciality', querySpeciality)

      const res = await fetch(`${backendUrl}/api/doctor/search?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setFilterDoc(data.doctors)
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    applyFilter()
  }, [doctors, speciality])

  return (
    <div>
      <p className='text-gray-600'>Browse through the doctors specialist.</p>
      <div className='flex gap-6 mt-5'>
        {/* Left: speciality column - sticky on md+ */}
        <div className={`hidden md:block w-56 text-sm text-gray-600`}>
          <div className='sticky top-24'>
            <div className='flex-col gap-4'>
              <p onClick={() => speciality === 'General physician' ? navigate('/doctors') : navigate('/doctors/General physician')} className={`pl-3 py-1.5 pr-4 border border-gray-300 rounded transition-all cursor-pointer ${speciality === 'General physician' ? 'bg-[#E2E5FF] text-black ' : ''}`}>General physician</p>
              <p onClick={() => speciality === 'Gynecologist' ? navigate('/doctors') : navigate('/doctors/Gynecologist')} className={`pl-3 py-1.5 pr-4 border border-gray-300 rounded transition-all cursor-pointer ${speciality === 'Gynecologist' ? 'bg-[#E2E5FF] text-black ' : ''}`}>Gynecologist</p>
              <p onClick={() => speciality === 'Dermatologist' ? navigate('/doctors') : navigate('/doctors/Dermatologist')} className={`pl-3 py-1.5 pr-4 border border-gray-300 rounded transition-all cursor-pointer ${speciality === 'Dermatologist' ? 'bg-[#E2E5FF] text-black ' : ''}`}>Dermatologist</p>
              <p onClick={() => speciality === 'Pediatricians' ? navigate('/doctors') : navigate('/doctors/Pediatricians')} className={`pl-3 py-1.5 pr-4 border border-gray-300 rounded transition-all cursor-pointer ${speciality === 'Pediatricians' ? 'bg-[#E2E5FF] text-black ' : ''}`}>Pediatricians</p>
              <p onClick={() => speciality === 'Neurologist' ? navigate('/doctors') : navigate('/doctors/Neurologist')} className={`pl-3 py-1.5 pr-4 border border-gray-300 rounded transition-all cursor-pointer ${speciality === 'Neurologist' ? 'bg-[#E2E5FF] text-black ' : ''}`}>Neurologist</p>
              <p onClick={() => speciality === 'Gastroenterologist' ? navigate('/doctors') : navigate('/doctors/Gastroenterologist')} className={`pl-3 py-1.5 pr-4 border border-gray-300 rounded transition-all cursor-pointer ${speciality === 'Gastroenterologist' ? 'bg-[#E2E5FF] text-black ' : ''}`}>Gastroenterologist</p>
            </div>
          </div>
        </div>

        {/* Right: main content */}
        <div className='flex-1'>
          <div className='mb-4'>
            <div className='flex gap-2 items-center w-full'>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') searchDoctors() }} className='border rounded px-3 py-2 flex-1' placeholder='Search doctor, hospital or location' />
              <button onClick={searchDoctors} className='bg-primary text-white px-4 py-2 rounded ml-2'>Search</button>
            </div>
          </div>

          {/* Available doctors - larger cards under search bar */}
          <div className='mb-6'>
            <h2 className='text-xl font-semibold mb-3'>Available doctors</h2>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
              {filterDoc.filter(d => d.available).map((item, index) => (
                <div key={index} onClick={() => { navigate(`/appointment/${item._id}`); scrollTo(0, 0) }} className='border rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300 p-4 flex gap-4 items-center'>
                  <img className='w-28 h-28 object-cover rounded-lg bg-[#EAEFFF]' src={item.image} alt="" />
                  <div>
                    <p className='text-2xl font-medium text-[#262626]'>{item.name}</p>
                    <p className='text-md text-[#5C5C5C]'>{item.speciality}</p>
                    {item.hospitalName && <p className='text-sm text-gray-600 mt-1'>{item.hospitalName} · {item.hospitalLocation}</p>}
                    <p className='text-sm text-gray-800 mt-2 font-medium'>{item.fees ? `Fee: ${item.fees}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All doctors grid */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
            {filterDoc.map((item, index) => (
              <div onClick={() => { navigate(`/appointment/${item._id}`); scrollTo(0, 0) }} className='border border-[#C9D8FF] rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-6px] transition-all duration-300' key={index}>
                <img className='bg-[#EAEFFF]' src={item.image} alt="" />
                <div className='p-4'>
                  <div className={`flex items-center gap-2 text-sm text-center ${item.available ? 'text-green-500' : "text-gray-500"}`}>
                    <p className={`w-2 h-2 rounded-full ${item.available ? 'bg-green-500' : "bg-gray-500"}`}></p><p>{item.available ? 'Available' : "Not Available"}</p>
                  </div>
                  <p className='text-[#262626] text-lg font-medium'>{item.name}</p>
                  <p className='text-[#5C5C5C] text-sm'>{item.speciality}</p>
                  {item.hospitalName && <p className='text-[#4A4A4A] text-sm font-medium mt-1'>{item.hospitalName} - {item.hospitalLocation}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Doctors