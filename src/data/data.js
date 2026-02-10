// ─── Treks ───────────────────────────────────────────
export const treks = [
  { id: 1, name: 'Kedarkantha Winter Trek', region: 'Himalayas', state: 'Uttarakhand', difficulty: 'Easy', duration: '6 Days', altitude: '12,500 ft', price: 8500, season: 'Winter', description: 'A stunning winter trek through snow-covered trails with panoramic views of Himalayan peaks.', rating: 4.8, totalBookings: 342, image: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=400&h=250&fit=crop' },
  { id: 2, name: 'Hampta Pass Crossing', region: 'Himalayas', state: 'Himachal Pradesh', difficulty: 'Moderate', duration: '5 Days', altitude: '14,100 ft', price: 9500, season: 'Summer', description: 'Cross from lush Kullu Valley to the barren Lahaul Valley on this dramatic pass crossing.', rating: 4.7, totalBookings: 218, image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=250&fit=crop' },
  { id: 3, name: 'Valley of Flowers', region: 'Himalayas', state: 'Uttarakhand', difficulty: 'Easy', duration: '6 Days', altitude: '12,500 ft', price: 7800, season: 'Monsoon', description: 'Walk through a UNESCO World Heritage Site blooming with rare Himalayan flowers.', rating: 4.9, totalBookings: 186, image: 'https://images.unsplash.com/photo-1490682143684-14369e18dce8?w=400&h=250&fit=crop' },
  { id: 4, name: 'Roopkund Mystery Trek', region: 'Himalayas', state: 'Uttarakhand', difficulty: 'Difficult', duration: '8 Days', altitude: '16,500 ft', price: 12500, season: 'Summer', description: 'Trek to the mysterious skeleton lake at 16,500ft with breathtaking alpine meadows.', rating: 4.6, totalBookings: 94, image: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=400&h=250&fit=crop' },
  { id: 5, name: 'Rajgad Fort Trek', region: 'Sahyadris', state: 'Maharashtra', difficulty: 'Easy', duration: '2 Days', altitude: '4,600 ft', price: 2500, season: 'Monsoon', description: 'Explore the capital fort of the Maratha Empire with stunning Sahyadri views.', rating: 4.5, totalBookings: 412, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop' },
  { id: 6, name: 'Sandakphu Kanchenjunga', region: 'Himalayas', state: 'West Bengal', difficulty: 'Moderate', duration: '7 Days', altitude: '11,930 ft', price: 11000, season: 'Winter', description: 'Witness four of the five highest peaks in the world from the highest point in West Bengal.', rating: 4.8, totalBookings: 156, image: 'https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=400&h=250&fit=crop' },
  { id: 7, name: 'Brahmatal Lake Trek', region: 'Himalayas', state: 'Uttarakhand', difficulty: 'Easy', duration: '6 Days', altitude: '12,250 ft', price: 7500, season: 'Winter', description: 'A beautiful winter trek offering views of Mt. Trishul and Mt. Nanda Ghunti.', rating: 4.7, totalBookings: 203, image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=250&fit=crop' },
  { id: 8, name: 'Kalsubai Peak Trek', region: 'Sahyadris', state: 'Maharashtra', difficulty: 'Easy', duration: '1 Day', altitude: '5,400 ft', price: 1500, season: 'Monsoon', description: 'Climb the highest peak in Maharashtra through iron ladders and scenic trails.', rating: 4.3, totalBookings: 567, image: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=400&h=250&fit=crop' },
  { id: 9, name: 'Chadar Frozen River', region: 'Himalayas', state: 'Ladakh', difficulty: 'Difficult', duration: '9 Days', altitude: '11,000 ft', price: 22000, season: 'Winter', description: 'Walk on the frozen Zanskar River through dramatic gorges in sub-zero temperatures.', rating: 4.9, totalBookings: 67, image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=250&fit=crop' },
  { id: 10, name: 'Goechala Viewpoint', region: 'Himalayas', state: 'Sikkim', difficulty: 'Difficult', duration: '10 Days', altitude: '15,100 ft', price: 15000, season: 'Spring', description: 'Stand face-to-face with Kanchenjunga on this epic Sikkim expedition.', rating: 4.8, totalBookings: 89, image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=250&fit=crop' },
  { id: 11, name: 'Harishchandragad Trek', region: 'Sahyadris', state: 'Maharashtra', difficulty: 'Moderate', duration: '2 Days', altitude: '4,700 ft', price: 3000, season: 'Winter', description: 'Experience the famous Konkan Kada cliff and ancient cave temple.', rating: 4.6, totalBookings: 324, image: 'https://images.unsplash.com/photo-1445363692815-ebcd599af580?w=400&h=250&fit=crop' },
  { id: 12, name: 'Tarsar Marsar Twin Lakes', region: 'Himalayas', state: 'Kashmir', difficulty: 'Moderate', duration: '7 Days', altitude: '13,000 ft', price: 13000, season: 'Summer', description: 'Discover two pristine alpine lakes set amid the pine forests of Kashmir.', rating: 4.7, totalBookings: 78, image: 'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?w=400&h=250&fit=crop' },
];

// ─── Guides ──────────────────────────────────────────
export const guides = [
  { id: 1, name: 'Ravi Sharma', phone: '+91 98765 43210', experience: '8 years', certifications: ['WFA', 'Mountain Rescue'], rating: 4.9, treksLed: 245, avatar: 'RS' },
  { id: 2, name: 'Priya Negi', phone: '+91 87654 32109', experience: '5 years', certifications: ['WFA'], rating: 4.8, treksLed: 142, avatar: 'PN' },
  { id: 3, name: 'Tenzing Dorji', phone: '+91 76543 21098', experience: '12 years', certifications: ['WFA', 'Mountain Rescue', 'Alpine Guide'], rating: 5.0, treksLed: 380, avatar: 'TD' },
  { id: 4, name: 'Ankit Rawat', phone: '+91 65432 10987', experience: '4 years', certifications: ['WFA'], rating: 4.6, treksLed: 98, avatar: 'AR' },
  { id: 5, name: 'Kavita Bisht', phone: '+91 54321 09876', experience: '6 years', certifications: ['WFA', 'Rock Climbing'], rating: 4.7, treksLed: 167, avatar: 'KB' },
];

// ─── Departures / Batches ────────────────────────────
export const departures = [
  { id: 'DEP-001', trekId: 1, trekName: 'Kedarkantha Winter Trek', startDate: '2026-02-15', endDate: '2026-02-20', capacity: 20, booked: 18, guideId: 1, guideName: 'Ravi Sharma', status: 'Almost Full', price: 8500, meetingPoint: 'Dehradun Railway Station' },
  { id: 'DEP-002', trekId: 2, trekName: 'Hampta Pass Crossing', startDate: '2026-03-10', endDate: '2026-03-14', capacity: 15, booked: 8, guideId: 2, guideName: 'Priya Negi', status: 'Open', price: 9500, meetingPoint: 'Manali Bus Stand' },
  { id: 'DEP-003', trekId: 1, trekName: 'Kedarkantha Winter Trek', startDate: '2026-02-22', endDate: '2026-02-27', capacity: 20, booked: 20, guideId: 3, guideName: 'Tenzing Dorji', status: 'Full', price: 8500, meetingPoint: 'Dehradun Railway Station' },
  { id: 'DEP-004', trekId: 6, trekName: 'Sandakphu Kanchenjunga', startDate: '2026-03-01', endDate: '2026-03-07', capacity: 12, booked: 5, guideId: 4, guideName: 'Ankit Rawat', status: 'Open', price: 11000, meetingPoint: 'NJP Station' },
  { id: 'DEP-005', trekId: 7, trekName: 'Brahmatal Lake Trek', startDate: '2026-02-18', endDate: '2026-02-23', capacity: 18, booked: 14, guideId: 5, guideName: 'Kavita Bisht', status: 'Open', price: 7500, meetingPoint: 'Kathgodam Station' },
  { id: 'DEP-006', trekId: 5, trekName: 'Rajgad Fort Trek', startDate: '2026-03-15', endDate: '2026-03-16', capacity: 30, booked: 22, guideId: 1, guideName: 'Ravi Sharma', status: 'Open', price: 2500, meetingPoint: 'Pune Station' },
  { id: 'DEP-007', trekId: 9, trekName: 'Chadar Frozen River', startDate: '2026-01-20', endDate: '2026-01-28', capacity: 10, booked: 10, guideId: 3, guideName: 'Tenzing Dorji', status: 'Full', price: 22000, meetingPoint: 'Leh Airport' },
  { id: 'DEP-008', trekId: 3, trekName: 'Valley of Flowers', startDate: '2026-07-15', endDate: '2026-07-20', capacity: 20, booked: 3, guideId: 2, guideName: 'Priya Negi', status: 'Open', price: 7800, meetingPoint: 'Haridwar Station' },
  { id: 'DEP-009', trekId: 10, trekName: 'Goechala Viewpoint', startDate: '2026-04-05', endDate: '2026-04-14', capacity: 12, booked: 7, guideId: 5, guideName: 'Kavita Bisht', status: 'Open', price: 15000, meetingPoint: 'Bagdogra Airport' },
  { id: 'DEP-010', trekId: 4, trekName: 'Roopkund Mystery Trek', startDate: '2026-05-20', endDate: '2026-05-27', capacity: 15, booked: 12, guideId: 4, guideName: 'Ankit Rawat', status: 'Almost Full', price: 12500, meetingPoint: 'Kathgodam Station' },
];

// ─── Customers ───────────────────────────────────────
export const customers = [
  { id: 1, name: 'Aarav Mehta', email: 'aarav.mehta@gmail.com', phone: '+91 99887 76655', totalTreks: 5, ltv: 52500, tags: ['VIP', 'Returning'], joinDate: '2024-03-15', city: 'Mumbai' },
  { id: 2, name: 'Sneha Iyer', email: 'sneha.iyer@outlook.com', phone: '+91 88776 65544', totalTreks: 3, ltv: 28500, tags: ['High Altitude', 'Returning'], joinDate: '2024-06-22', city: 'Bangalore' },
  { id: 3, name: 'Rohan Kapoor', email: 'rohan.k@gmail.com', phone: '+91 77665 54433', totalTreks: 1, ltv: 8500, tags: ['New'], joinDate: '2025-11-05', city: 'Delhi' },
  { id: 4, name: 'Priya Deshmukh', email: 'priya.d@yahoo.com', phone: '+91 66554 43322', totalTreks: 7, ltv: 72000, tags: ['VIP', 'High Altitude', 'Returning'], joinDate: '2023-09-10', city: 'Pune' },
  { id: 5, name: 'Vikram Singh', email: 'vikram.s@gmail.com', phone: '+91 55443 32211', totalTreks: 2, ltv: 19000, tags: ['Returning'], joinDate: '2025-01-18', city: 'Jaipur' },
  { id: 6, name: 'Ananya Sharma', email: 'ananya.sh@gmail.com', phone: '+91 44332 21100', totalTreks: 4, ltv: 38000, tags: ['High Altitude'], joinDate: '2024-07-03', city: 'Chandigarh' },
  { id: 7, name: 'Karthik Nair', email: 'karthik.n@outlook.com', phone: '+91 33221 10099', totalTreks: 1, ltv: 9500, tags: ['New'], joinDate: '2025-12-20', city: 'Chennai' },
  { id: 8, name: 'Meera Joshi', email: 'meera.j@gmail.com', phone: '+91 22110 09988', totalTreks: 6, ltv: 61000, tags: ['VIP', 'Returning'], joinDate: '2023-12-01', city: 'Hyderabad' },
  { id: 9, name: 'Arjun Reddy', email: 'arjun.r@yahoo.com', phone: '+91 11009 98877', totalTreks: 2, ltv: 20500, tags: ['Returning'], joinDate: '2025-04-14', city: 'Visakhapatnam' },
  { id: 10, name: 'Divya Pillai', email: 'divya.p@gmail.com', phone: '+91 99001 12233', totalTreks: 3, ltv: 35500, tags: ['High Altitude'], joinDate: '2024-10-28', city: 'Kochi' },
  { id: 11, name: 'Rahul Gupta', email: 'rahul.g@gmail.com', phone: '+91 88112 23344', totalTreks: 8, ltv: 85000, tags: ['VIP', 'High Altitude', 'Returning'], joinDate: '2023-05-15', city: 'Kolkata' },
  { id: 12, name: 'Nisha Patel', email: 'nisha.p@outlook.com', phone: '+91 77223 34455', totalTreks: 1, ltv: 7800, tags: ['New'], joinDate: '2026-01-10', city: 'Ahmedabad' },
  { id: 13, name: 'Siddharth Rao', email: 'sid.rao@gmail.com', phone: '+91 66334 45566', totalTreks: 4, ltv: 44000, tags: ['Returning'], joinDate: '2024-02-20', city: 'Mysuru' },
  { id: 14, name: 'Pooja Verma', email: 'pooja.v@gmail.com', phone: '+91 55445 56677', totalTreks: 2, ltv: 17000, tags: ['New'], joinDate: '2025-08-05', city: 'Lucknow' },
  { id: 15, name: 'Amit Thakur', email: 'amit.t@yahoo.com', phone: '+91 44556 67788', totalTreks: 5, ltv: 55000, tags: ['VIP', 'Returning'], joinDate: '2024-01-12', city: 'Dehradun' },
];

// ─── Bookings ────────────────────────────────────────
export const bookings = [
  { id: 'BK-2601', customerId: 1, customerName: 'Aarav Mehta', trekName: 'Kedarkantha Winter Trek', departureId: 'DEP-001', date: '2026-02-15', amount: 17000, paymentStatus: 'Paid', bookingStatus: 'Confirmed', participants: [{ name: 'Aarav Mehta', age: 28, medical: 'None' }, { name: 'Riya Mehta', age: 26, medical: 'Mild asthma - carries inhaler' }], bookedOn: '2026-01-05' },
  { id: 'BK-2602', customerId: 2, customerName: 'Sneha Iyer', trekName: 'Hampta Pass Crossing', departureId: 'DEP-002', date: '2026-03-10', amount: 9500, paymentStatus: 'Partial', bookingStatus: 'Confirmed', participants: [{ name: 'Sneha Iyer', age: 31, medical: 'None' }], bookedOn: '2026-01-12' },
  { id: 'BK-2603', customerId: 3, customerName: 'Rohan Kapoor', trekName: 'Kedarkantha Winter Trek', departureId: 'DEP-001', date: '2026-02-15', amount: 8500, paymentStatus: 'Paid', bookingStatus: 'Confirmed', participants: [{ name: 'Rohan Kapoor', age: 25, medical: 'None' }], bookedOn: '2026-01-08' },
  { id: 'BK-2604', customerId: 4, customerName: 'Priya Deshmukh', trekName: 'Chadar Frozen River', departureId: 'DEP-007', date: '2026-01-20', amount: 44000, paymentStatus: 'Paid', bookingStatus: 'Confirmed', participants: [{ name: 'Priya Deshmukh', age: 34, medical: 'None' }, { name: 'Anand Deshmukh', age: 36, medical: 'None' }], bookedOn: '2025-12-01' },
  { id: 'BK-2605', customerId: 5, customerName: 'Vikram Singh', trekName: 'Sandakphu Kanchenjunga', departureId: 'DEP-004', date: '2026-03-01', amount: 11000, paymentStatus: 'Unpaid', bookingStatus: 'Pending', participants: [{ name: 'Vikram Singh', age: 29, medical: 'Knee brace recommended' }], bookedOn: '2026-01-20' },
  { id: 'BK-2606', customerId: 6, customerName: 'Ananya Sharma', trekName: 'Brahmatal Lake Trek', departureId: 'DEP-005', date: '2026-02-18', amount: 15000, paymentStatus: 'Paid', bookingStatus: 'Confirmed', participants: [{ name: 'Ananya Sharma', age: 27, medical: 'None' }, { name: 'Neha Sharma', age: 24, medical: 'Allergic to sulfa drugs' }], bookedOn: '2026-01-10' },
  { id: 'BK-2607', customerId: 7, customerName: 'Karthik Nair', trekName: 'Hampta Pass Crossing', departureId: 'DEP-002', date: '2026-03-10', amount: 9500, paymentStatus: 'Unpaid', bookingStatus: 'Canceled', participants: [{ name: 'Karthik Nair', age: 33, medical: 'None' }], bookedOn: '2026-01-15' },
  { id: 'BK-2608', customerId: 8, customerName: 'Meera Joshi', trekName: 'Kedarkantha Winter Trek', departureId: 'DEP-003', date: '2026-02-22', amount: 25500, paymentStatus: 'Partial', bookingStatus: 'Confirmed', participants: [{ name: 'Meera Joshi', age: 30, medical: 'None' }, { name: 'Raj Joshi', age: 32, medical: 'None' }, { name: 'Tara Joshi', age: 55, medical: 'BP medication - Amlodipine 5mg' }], bookedOn: '2026-01-02' },
  { id: 'BK-2609', customerId: 9, customerName: 'Arjun Reddy', trekName: 'Rajgad Fort Trek', departureId: 'DEP-006', date: '2026-03-15', amount: 5000, paymentStatus: 'Paid', bookingStatus: 'Confirmed', participants: [{ name: 'Arjun Reddy', age: 26, medical: 'None' }, { name: 'Suresh Reddy', age: 28, medical: 'None' }], bookedOn: '2026-02-01' },
  { id: 'BK-2610', customerId: 10, customerName: 'Divya Pillai', trekName: 'Goechala Viewpoint', departureId: 'DEP-009', date: '2026-04-05', amount: 15000, paymentStatus: 'Partial', bookingStatus: 'Confirmed', participants: [{ name: 'Divya Pillai', age: 29, medical: 'None' }], bookedOn: '2026-02-05' },
  { id: 'BK-2611', customerId: 11, customerName: 'Rahul Gupta', trekName: 'Roopkund Mystery Trek', departureId: 'DEP-010', date: '2026-05-20', amount: 25000, paymentStatus: 'Paid', bookingStatus: 'Confirmed', participants: [{ name: 'Rahul Gupta', age: 35, medical: 'None' }, { name: 'Sunita Gupta', age: 33, medical: 'None' }], bookedOn: '2026-01-25' },
  { id: 'BK-2612', customerId: 12, customerName: 'Nisha Patel', trekName: 'Valley of Flowers', departureId: 'DEP-008', date: '2026-07-15', amount: 7800, paymentStatus: 'Unpaid', bookingStatus: 'Pending', participants: [{ name: 'Nisha Patel', age: 24, medical: 'None' }], bookedOn: '2026-02-08' },
  { id: 'BK-2613', customerId: 13, customerName: 'Siddharth Rao', trekName: 'Brahmatal Lake Trek', departureId: 'DEP-005', date: '2026-02-18', amount: 7500, paymentStatus: 'Paid', bookingStatus: 'Confirmed', participants: [{ name: 'Siddharth Rao', age: 31, medical: 'None' }], bookedOn: '2026-01-14' },
  { id: 'BK-2614', customerId: 14, customerName: 'Pooja Verma', trekName: 'Sandakphu Kanchenjunga', departureId: 'DEP-004', date: '2026-03-01', amount: 11000, paymentStatus: 'Paid', bookingStatus: 'Confirmed', participants: [{ name: 'Pooja Verma', age: 27, medical: 'None' }], bookedOn: '2026-01-22' },
  { id: 'BK-2615', customerId: 15, customerName: 'Amit Thakur', trekName: 'Kedarkantha Winter Trek', departureId: 'DEP-001', date: '2026-02-15', amount: 8500, paymentStatus: 'Paid', bookingStatus: 'Confirmed', participants: [{ name: 'Amit Thakur', age: 38, medical: 'None' }], bookedOn: '2026-01-03' },
  { id: 'BK-2616', customerId: 1, customerName: 'Aarav Mehta', trekName: 'Goechala Viewpoint', departureId: 'DEP-009', date: '2026-04-05', amount: 15000, paymentStatus: 'Partial', bookingStatus: 'Confirmed', participants: [{ name: 'Aarav Mehta', age: 28, medical: 'None' }], bookedOn: '2026-02-03' },
  { id: 'BK-2617', customerId: 4, customerName: 'Priya Deshmukh', trekName: 'Rajgad Fort Trek', departureId: 'DEP-006', date: '2026-03-15', amount: 5000, paymentStatus: 'Paid', bookingStatus: 'Confirmed', participants: [{ name: 'Priya Deshmukh', age: 34, medical: 'None' }, { name: 'Meena Deshmukh', age: 58, medical: 'Diabetic - insulin' }], bookedOn: '2026-02-06' },
  { id: 'BK-2618', customerId: 8, customerName: 'Meera Joshi', trekName: 'Sandakphu Kanchenjunga', departureId: 'DEP-004', date: '2026-03-01', amount: 11000, paymentStatus: 'Paid', bookingStatus: 'Confirmed', participants: [{ name: 'Meera Joshi', age: 30, medical: 'None' }], bookedOn: '2026-01-28' },
  { id: 'BK-2619', customerId: 6, customerName: 'Ananya Sharma', trekName: 'Roopkund Mystery Trek', departureId: 'DEP-010', date: '2026-05-20', amount: 12500, paymentStatus: 'Unpaid', bookingStatus: 'Pending', participants: [{ name: 'Ananya Sharma', age: 27, medical: 'None' }], bookedOn: '2026-02-09' },
  { id: 'BK-2620', customerId: 11, customerName: 'Rahul Gupta', trekName: 'Hampta Pass Crossing', departureId: 'DEP-002', date: '2026-03-10', amount: 19000, paymentStatus: 'Paid', bookingStatus: 'Confirmed', participants: [{ name: 'Rahul Gupta', age: 35, medical: 'None' }, { name: 'Sunita Gupta', age: 33, medical: 'None' }], bookedOn: '2026-02-07' },
];

// ─── Invoices ────────────────────────────────────────
export const invoices = [
  { id: 'INV-3001', bookingId: 'BK-2601', customerName: 'Aarav Mehta', date: '2026-01-05', amount: 17000, status: 'Paid', dueDate: '2026-01-20' },
  { id: 'INV-3002', bookingId: 'BK-2602', customerName: 'Sneha Iyer', date: '2026-01-12', amount: 9500, status: 'Partial', dueDate: '2026-02-12' },
  { id: 'INV-3003', bookingId: 'BK-2603', customerName: 'Rohan Kapoor', date: '2026-01-08', amount: 8500, status: 'Paid', dueDate: '2026-01-23' },
  { id: 'INV-3004', bookingId: 'BK-2604', customerName: 'Priya Deshmukh', date: '2025-12-01', amount: 44000, status: 'Paid', dueDate: '2025-12-15' },
  { id: 'INV-3005', bookingId: 'BK-2605', customerName: 'Vikram Singh', date: '2026-01-20', amount: 11000, status: 'Sent', dueDate: '2026-02-20' },
  { id: 'INV-3006', bookingId: 'BK-2606', customerName: 'Ananya Sharma', date: '2026-01-10', amount: 15000, status: 'Paid', dueDate: '2026-01-25' },
  { id: 'INV-3007', bookingId: 'BK-2608', customerName: 'Meera Joshi', date: '2026-01-02', amount: 25500, status: 'Partial', dueDate: '2026-02-02' },
  { id: 'INV-3008', bookingId: 'BK-2609', customerName: 'Arjun Reddy', date: '2026-02-01', amount: 5000, status: 'Paid', dueDate: '2026-02-15' },
  { id: 'INV-3009', bookingId: 'BK-2611', customerName: 'Rahul Gupta', date: '2026-01-25', amount: 25000, status: 'Paid', dueDate: '2026-02-10' },
  { id: 'INV-3010', bookingId: 'BK-2612', customerName: 'Nisha Patel', date: '2026-02-08', amount: 7800, status: 'Sent', dueDate: '2026-03-08' },
];

// ─── Payments ────────────────────────────────────────
export const payments = [
  { id: 'PAY-4001', invoiceId: 'INV-3001', customerName: 'Aarav Mehta', date: '2026-01-06', amount: 17000, method: 'UPI', reference: 'UPI-2026010612345' },
  { id: 'PAY-4002', invoiceId: 'INV-3002', customerName: 'Sneha Iyer', date: '2026-01-13', amount: 5000, method: 'Bank Transfer', reference: 'NEFT-20260113001' },
  { id: 'PAY-4003', invoiceId: 'INV-3003', customerName: 'Rohan Kapoor', date: '2026-01-09', amount: 8500, method: 'UPI', reference: 'UPI-2026010923456' },
  { id: 'PAY-4004', invoiceId: 'INV-3004', customerName: 'Priya Deshmukh', date: '2025-12-02', amount: 44000, method: 'Credit Card', reference: 'CC-2025120234567' },
  { id: 'PAY-4005', invoiceId: 'INV-3006', customerName: 'Ananya Sharma', date: '2026-01-11', amount: 15000, method: 'UPI', reference: 'UPI-2026011134567' },
  { id: 'PAY-4006', invoiceId: 'INV-3007', customerName: 'Meera Joshi', date: '2026-01-03', amount: 15000, method: 'Bank Transfer', reference: 'NEFT-20260103002' },
  { id: 'PAY-4007', invoiceId: 'INV-3008', customerName: 'Arjun Reddy', date: '2026-02-02', amount: 5000, method: 'UPI', reference: 'UPI-2026020245678' },
  { id: 'PAY-4008', invoiceId: 'INV-3009', customerName: 'Rahul Gupta', date: '2026-01-26', amount: 25000, method: 'Credit Card', reference: 'CC-2026012656789' },
];

// ─── Refunds ─────────────────────────────────────────
export const refunds = [
  { id: 'REF-5001', bookingId: 'BK-2607', customerName: 'Karthik Nair', date: '2026-01-18', amount: 9500, reason: 'Trek canceled by customer', status: 'Processed', method: 'Original Payment Method' },
  { id: 'REF-5002', bookingId: 'BK-2605', customerName: 'Vikram Singh', date: '2026-02-05', amount: 2750, reason: 'Partial refund - date change', status: 'Pending', method: 'Bank Transfer' },
];

// ─── Marketing Campaigns ─────────────────────────────
export const campaigns = [
  { id: 1, name: 'Winter Google Ads', platform: 'Google Ads', spend: 125000, leads: 340, conversions: 42, cpl: 368, roas: 2.86, status: 'Active', startDate: '2025-11-01', endDate: '2026-02-28' },
  { id: 2, name: 'Instagram Reels - Kedarkantha', platform: 'Instagram', spend: 45000, leads: 520, conversions: 28, cpl: 87, roas: 5.29, status: 'Active', startDate: '2025-12-15', endDate: '2026-02-15' },
  { id: 3, name: 'Facebook Winter Campaign', platform: 'Facebook', spend: 80000, leads: 280, conversions: 18, cpl: 286, roas: 1.91, status: 'Paused', startDate: '2025-11-15', endDate: '2026-01-31' },
  { id: 4, name: 'YouTube Trek Vlogs', platform: 'YouTube', spend: 60000, leads: 180, conversions: 15, cpl: 333, roas: 2.13, status: 'Active', startDate: '2025-10-01', endDate: '2026-03-31' },
  { id: 5, name: 'Email - Repeat Customers', platform: 'Email', spend: 5000, leads: 95, conversions: 22, cpl: 53, roas: 37.4, status: 'Completed', startDate: '2025-12-01', endDate: '2025-12-31' },
  { id: 6, name: 'Sahyadri Weekend Ads', platform: 'Google Ads', spend: 35000, leads: 210, conversions: 35, cpl: 167, roas: 2.5, status: 'Active', startDate: '2026-01-01', endDate: '2026-03-31' },
  { id: 7, name: 'LinkedIn Corporate Treks', platform: 'LinkedIn', spend: 50000, leads: 60, conversions: 8, cpl: 833, roas: 3.52, status: 'Active', startDate: '2026-01-15', endDate: '2026-04-15' },
];

// ─── Dashboard Data ──────────────────────────────────
export const dashboardKPIs = {
  totalBookings: 124,
  revenue: 4520000,
  activeTreks: 8,
  conversionRate: 3.2,
  bookingsChange: 12.5,
  revenueChange: 8.3,
  treksChange: 2,
  conversionChange: -0.4,
};

export const revenueByMonth = [
  { month: 'Aug', revenue: 280000 },
  { month: 'Sep', revenue: 345000 },
  { month: 'Oct', revenue: 410000 },
  { month: 'Nov', revenue: 520000 },
  { month: 'Dec', revenue: 680000 },
  { month: 'Jan', revenue: 750000 },
  { month: 'Feb', revenue: 620000 },
];

export const bookingsByRegion = [
  { name: 'Himalayas', value: 68, color: '#059669' },
  { name: 'Sahyadris', value: 22, color: '#0891b2' },
  { name: 'Western Ghats', value: 6, color: '#7c3aed' },
  { name: 'Northeast', value: 4, color: '#ea580c' },
];

export const recentActivity = [
  { id: 1, type: 'booking', message: 'Aarav Mehta booked Kedarkantha Winter Trek', time: '2 hours ago', status: 'Confirmed' },
  { id: 2, type: 'payment', message: 'Payment received from Rahul Gupta - ₹25,000', time: '4 hours ago', status: 'Paid' },
  { id: 3, type: 'booking', message: 'Nisha Patel booked Valley of Flowers', time: '6 hours ago', status: 'Pending' },
  { id: 4, type: 'cancellation', message: 'Karthik Nair canceled Hampta Pass booking', time: '1 day ago', status: 'Canceled' },
  { id: 5, type: 'booking', message: 'Ananya Sharma booked Roopkund Mystery Trek', time: '1 day ago', status: 'Pending' },
];

export const alerts = [
  { id: 1, type: 'warning', title: 'Low Seats Alert', message: 'Kedarkantha Batch DEP-001 has only 2 seats left', priority: 'high' },
  { id: 2, type: 'info', title: 'Permit Renewal', message: 'Roopkund trek permit expires on March 15, 2026', priority: 'medium' },
  { id: 3, type: 'warning', title: 'Payment Overdue', message: 'Vikram Singh - ₹11,000 payment overdue by 5 days', priority: 'high' },
  { id: 4, type: 'info', title: 'Guide Availability', message: 'Tenzing Dorji unavailable Mar 5-12 for personal leave', priority: 'low' },
];

// ─── Notifications ───────────────────────────────────
export const notifications = [
  { id: 1, title: 'New Booking', message: 'Aarav Mehta booked Kedarkantha', time: '2h ago', read: false },
  { id: 2, title: 'Payment Received', message: '₹25,000 from Rahul Gupta', time: '4h ago', read: false },
  { id: 3, title: 'Batch Full', message: 'Kedarkantha DEP-003 is now full', time: '1d ago', read: true },
  { id: 4, title: 'Cancellation', message: 'Karthik Nair canceled booking', time: '1d ago', read: true },
  { id: 5, title: 'Low Seats', message: 'Only 2 seats left on DEP-001', time: '2d ago', read: true },
];
