// ─── Cities ──────────────────────────────────────────
export const cities = [
  { id: 1, name: 'Pune', state: 'Maharashtra', isActive: true },
  { id: 2, name: 'Mumbai', state: 'Maharashtra', isActive: true },
  { id: 3, name: 'Nashik', state: 'Maharashtra', isActive: true },
  { id: 4, name: 'Delhi', state: 'Delhi', isActive: true },
  { id: 5, name: 'Bangalore', state: 'Karnataka', isActive: true },
  { id: 6, name: 'Dehradun', state: 'Uttarakhand', isActive: true },
];

// ─── Treks (Simplified Catalog) ──────────────────────
export const treks = [
  { id: 1, name: 'Kedarkantha', image: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=400&h=250&fit=crop', location: 'Uttarakhand', description: 'A classic winter trek through dense pine forests with stunning summit views of the Himalayan peaks.', altitude: '12,500 ft', bestSeason: 'Dec-Apr', difficulty: 'Moderate', isActive: true },
  { id: 2, name: 'Rajmachi Fort', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop', location: 'Maharashtra', description: 'Historic twin forts - Shrivardhan and Manaranjan - amidst the Sahyadri ranges.', altitude: '2,710 ft', bestSeason: 'Oct-Feb', difficulty: 'Easy', isActive: true },
  { id: 3, name: 'Hampta Pass', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=250&fit=crop', location: 'Himachal Pradesh', description: 'A dramatic crossover trek from the lush Kullu valley to the barren Spiti desert.', altitude: '14,000 ft', bestSeason: 'Jun-Sep', difficulty: 'Moderate', isActive: true },
  { id: 4, name: 'Valley of Flowers', image: 'https://images.unsplash.com/photo-1490682143684-14369e18dce8?w=400&h=250&fit=crop', location: 'Uttarakhand', description: 'UNESCO World Heritage Site — vibrant alpine meadow with 600+ wildflower species.', altitude: '12,000 ft', bestSeason: 'Jul-Sep', difficulty: 'Moderate', isActive: true },
  { id: 5, name: 'Kalsubai Peak', image: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=400&h=250&fit=crop', location: 'Maharashtra', description: 'Highest peak in Maharashtra with iron ladders and stunning sunrise views.', altitude: '5,400 ft', bestSeason: 'Sep-Feb', difficulty: 'Easy', isActive: true },
  { id: 6, name: 'Roopkund', image: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=400&h=250&fit=crop', location: 'Uttarakhand', description: 'The mysterious Skeleton Lake trek through meadows and glaciers.', altitude: '15,696 ft', bestSeason: 'May-Jun, Sep-Oct', difficulty: 'Difficult', isActive: true },
  { id: 7, name: 'Sandhan Valley', image: 'https://images.unsplash.com/photo-1445363692815-ebcd599af580?w=400&h=250&fit=crop', location: 'Maharashtra', description: 'Valley of Shadows — narrow canyon trek with rappelling and water traverses.', altitude: '3,000 ft', bestSeason: 'Oct-May', difficulty: 'Moderate', isActive: true },
  { id: 8, name: 'Harishchandragad', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=250&fit=crop', location: 'Maharashtra', description: 'Ancient hill fortress with iconic Konkan Kada cliff and Kedareshwar cave temple.', altitude: '4,670 ft', bestSeason: 'Sep-Feb', difficulty: 'Moderate', isActive: true },
];

// ─── Guides ──────────────────────────────────────────
export const guides = [
  { id: 1, name: 'Ravi Sharma', phone: '+91 98765 43210', experience: '8 years', certifications: ['WFA', 'Mountain Rescue'], rating: 4.9, treksLed: 245, avatar: 'RS' },
  { id: 2, name: 'Priya Negi', phone: '+91 87654 32109', experience: '5 years', certifications: ['WFA'], rating: 4.8, treksLed: 142, avatar: 'PN' },
  { id: 3, name: 'Tenzing Dorji', phone: '+91 76543 21098', experience: '12 years', certifications: ['WFA', 'Mountain Rescue', 'Alpine Guide'], rating: 5.0, treksLed: 380, avatar: 'TD' },
  { id: 4, name: 'Ankit Rawat', phone: '+91 65432 10987', experience: '4 years', certifications: ['WFA'], rating: 4.6, treksLed: 98, avatar: 'AR' },
  { id: 5, name: 'Kavita Bisht', phone: '+91 54321 09876', experience: '6 years', certifications: ['WFA', 'Rock Climbing'], rating: 4.7, treksLed: 167, avatar: 'KB' },
];

// ─── Departures (Live Entity — links Trek + City) ────
export const departures = [
  { id: 'DEP-001', trekId: 2, trekName: 'Rajmachi Fort', cityId: 1, cityName: 'Pune', startDate: '2026-03-15', endDate: '2026-03-16', duration: '1 Night / 2 Days', price: 2500, capacity: 30, booked: 22, guideId: 1, guideName: 'Ravi Sharma', status: 'Open', itinerary: 'Day 1: Meet at Pune station → Drive to base → Night trek → Camping\nDay 2: Sunrise → Explore → Descend → Return', thingsToCarry: 'Torch, 2L water, raincoat, snacks, comfortable shoes', contact: '9876543210', meetingPoint: 'Pune Railway Station' },
  { id: 'DEP-002', trekId: 2, trekName: 'Rajmachi Fort', cityId: 2, cityName: 'Mumbai', startDate: '2026-03-15', endDate: '2026-03-16', duration: '1 Night / 2 Days', price: 3000, capacity: 25, booked: 18, guideId: 2, guideName: 'Priya Negi', status: 'Open', itinerary: 'Day 1: Meet at Dadar → Drive to Lonavala → Trek → Camping\nDay 2: Sunrise → Explore → Return to Mumbai', thingsToCarry: 'Torch, 2L water, raincoat, snacks, comfortable shoes', contact: '8765432109', meetingPoint: 'Dadar Station (East)' },
  { id: 'DEP-003', trekId: 1, trekName: 'Kedarkantha', cityId: 6, cityName: 'Dehradun', startDate: '2026-03-10', endDate: '2026-03-14', duration: '4 Nights / 5 Days', price: 8500, capacity: 20, booked: 8, guideId: 3, guideName: 'Tenzing Dorji', status: 'Open', itinerary: 'Day 1: Dehradun → Sankri\nDay 2: Sankri → Juda Ka Talab\nDay 3: → Base Camp\nDay 4: Summit → Return\nDay 5: → Dehradun', thingsToCarry: 'Warm layers, trekking shoes, sunscreen, headlamp', contact: '7654321098', meetingPoint: 'Dehradun Railway Station' },
  { id: 'DEP-004', trekId: 1, trekName: 'Kedarkantha', cityId: 4, cityName: 'Delhi', startDate: '2026-03-09', endDate: '2026-03-14', duration: '5 Nights / 6 Days', price: 9500, capacity: 15, booked: 12, guideId: 3, guideName: 'Tenzing Dorji', status: 'Almost Full', itinerary: 'Day 1: Delhi → Dehradun\nDay 2: → Sankri\nDay 3: → Juda Ka Talab\nDay 4: → Base Camp\nDay 5: Summit → Return\nDay 6: → Delhi', thingsToCarry: 'Warm layers, trekking shoes, sunscreen, headlamp, trekking pole', contact: '7654321098', meetingPoint: 'ISBT Kashmere Gate, Delhi' },
  { id: 'DEP-005', trekId: 5, trekName: 'Kalsubai Peak', cityId: 1, cityName: 'Pune', startDate: '2026-03-22', endDate: '2026-03-23', duration: '1 Night / 2 Days', price: 1800, capacity: 40, booked: 15, guideId: 4, guideName: 'Ankit Rawat', status: 'Open', itinerary: 'Day 1: Pune → Bari village → Night trek → Sunrise\nDay 2: Descend → Breakfast → Return', thingsToCarry: 'Torch, 2L water, sports shoes, warm layer', contact: '6543210987', meetingPoint: 'Shivajinagar Bus Stand, Pune' },
  { id: 'DEP-006', trekId: 7, trekName: 'Sandhan Valley', cityId: 2, cityName: 'Mumbai', startDate: '2026-04-05', endDate: '2026-04-07', duration: '2 Nights / 3 Days', price: 4500, capacity: 20, booked: 5, guideId: 5, guideName: 'Kavita Bisht', status: 'Open', itinerary: 'Day 1: Mumbai → Samrad → Descent → Camping\nDay 2: Valley exploration → Rappelling → Camping\nDay 3: Exit valley → Drive to Mumbai', thingsToCarry: 'Quick-dry clothes, 3L water, headlamp, sandals, energy bars', contact: '5432109876', meetingPoint: 'Dadar Station (East)' },
  { id: 'DEP-007', trekId: 3, trekName: 'Hampta Pass', cityId: 4, cityName: 'Delhi', startDate: '2026-06-20', endDate: '2026-06-25', duration: '5 Nights / 6 Days', price: 11000, capacity: 18, booked: 3, guideId: 1, guideName: 'Ravi Sharma', status: 'Open', itinerary: 'Day 1: Delhi → Manali\nDay 2: Manali → Jobra → Chika\nDay 3: → Balu Ka Ghera\nDay 4: Cross Hampta Pass → Shea Goru\nDay 5: → Chandratal Lake\nDay 6: → Manali → Delhi', thingsToCarry: 'Layered clothing, rain gear, trekking poles, sunscreen', contact: '9876543210', meetingPoint: 'ISBT Kashmere Gate, Delhi' },
  { id: 'DEP-008', trekId: 8, trekName: 'Harishchandragad', cityId: 1, cityName: 'Pune', startDate: '2026-03-29', endDate: '2026-03-30', duration: '1 Night / 2 Days', price: 2200, capacity: 35, booked: 20, guideId: 2, guideName: 'Priya Negi', status: 'Open', itinerary: 'Day 1: Pune → Khireshwar → Trek via Pachnai → Camping\nDay 2: Sunrise at Konkan Kada → Explore → Return', thingsToCarry: 'Torch, 2L water, sturdy shoes, light jacket, camera', contact: '8765432109', meetingPoint: 'Shivajinagar Bus Stand, Pune' },
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
  { id: 'BK-2601', customerId: 1, customerName: 'Aarav Mehta', trekName: 'Rajmachi Fort', departureId: 'DEP-001', date: '2026-03-15', amount: 5000, paymentStatus: 'Paid', bookingStatus: 'Confirmed', participants: [{ name: 'Aarav Mehta', age: 28, medical: 'None' }, { name: 'Riya Mehta', age: 26, medical: 'None' }], bookedOn: '2026-01-05' },
  { id: 'BK-2602', customerId: 2, customerName: 'Sneha Iyer', trekName: 'Kedarkantha', departureId: 'DEP-003', date: '2026-03-10', amount: 8500, paymentStatus: 'Partial', bookingStatus: 'Confirmed', participants: [{ name: 'Sneha Iyer', age: 31, medical: 'None' }], bookedOn: '2026-01-12' },
  { id: 'BK-2603', customerId: 3, customerName: 'Rohan Kapoor', trekName: 'Kedarkantha', departureId: 'DEP-004', date: '2026-03-09', amount: 9500, paymentStatus: 'Paid', bookingStatus: 'Confirmed', participants: [{ name: 'Rohan Kapoor', age: 25, medical: 'None' }], bookedOn: '2026-01-08' },
  { id: 'BK-2604', customerId: 4, customerName: 'Priya Deshmukh', trekName: 'Kalsubai Peak', departureId: 'DEP-005', date: '2026-03-22', amount: 3600, paymentStatus: 'Paid', bookingStatus: 'Confirmed', participants: [{ name: 'Priya Deshmukh', age: 34, medical: 'None' }, { name: 'Anand Deshmukh', age: 36, medical: 'None' }], bookedOn: '2025-12-01' },
  { id: 'BK-2605', customerId: 5, customerName: 'Vikram Singh', trekName: 'Hampta Pass', departureId: 'DEP-007', date: '2026-06-20', amount: 11000, paymentStatus: 'Unpaid', bookingStatus: 'Pending', participants: [{ name: 'Vikram Singh', age: 29, medical: 'Knee brace recommended' }], bookedOn: '2026-01-20' },
  { id: 'BK-2606', customerId: 6, customerName: 'Ananya Sharma', trekName: 'Rajmachi Fort', departureId: 'DEP-002', date: '2026-03-15', amount: 6000, paymentStatus: 'Paid', bookingStatus: 'Confirmed', participants: [{ name: 'Ananya Sharma', age: 27, medical: 'None' }, { name: 'Neha Sharma', age: 24, medical: 'None' }], bookedOn: '2026-01-10' },
  { id: 'BK-2607', customerId: 7, customerName: 'Karthik Nair', trekName: 'Sandhan Valley', departureId: 'DEP-006', date: '2026-04-05', amount: 4500, paymentStatus: 'Unpaid', bookingStatus: 'Canceled', participants: [{ name: 'Karthik Nair', age: 33, medical: 'None' }], bookedOn: '2026-01-15' },
  { id: 'BK-2608', customerId: 8, customerName: 'Meera Joshi', trekName: 'Harishchandragad', departureId: 'DEP-008', date: '2026-03-29', amount: 6600, paymentStatus: 'Partial', bookingStatus: 'Confirmed', participants: [{ name: 'Meera Joshi', age: 30, medical: 'None' }, { name: 'Raj Joshi', age: 32, medical: 'None' }, { name: 'Tara Joshi', age: 55, medical: 'BP medication' }], bookedOn: '2026-01-02' },
  { id: 'BK-2609', customerId: 9, customerName: 'Arjun Reddy', trekName: 'Rajmachi Fort', departureId: 'DEP-001', date: '2026-03-15', amount: 5000, paymentStatus: 'Paid', bookingStatus: 'Confirmed', participants: [{ name: 'Arjun Reddy', age: 26, medical: 'None' }, { name: 'Suresh Reddy', age: 28, medical: 'None' }], bookedOn: '2026-02-01' },
  { id: 'BK-2610', customerId: 10, customerName: 'Divya Pillai', trekName: 'Kedarkantha', departureId: 'DEP-003', date: '2026-03-10', amount: 8500, paymentStatus: 'Partial', bookingStatus: 'Confirmed', participants: [{ name: 'Divya Pillai', age: 29, medical: 'None' }], bookedOn: '2026-02-05' },
  { id: 'BK-2611', customerId: 11, customerName: 'Rahul Gupta', trekName: 'Hampta Pass', departureId: 'DEP-007', date: '2026-06-20', amount: 22000, paymentStatus: 'Paid', bookingStatus: 'Confirmed', participants: [{ name: 'Rahul Gupta', age: 35, medical: 'None' }, { name: 'Sunita Gupta', age: 33, medical: 'None' }], bookedOn: '2026-01-25' },
  { id: 'BK-2612', customerId: 12, customerName: 'Nisha Patel', trekName: 'Kalsubai Peak', departureId: 'DEP-005', date: '2026-03-22', amount: 1800, paymentStatus: 'Unpaid', bookingStatus: 'Pending', participants: [{ name: 'Nisha Patel', age: 24, medical: 'None' }], bookedOn: '2026-02-08' },
  { id: 'BK-2613', customerId: 13, customerName: 'Siddharth Rao', trekName: 'Harishchandragad', departureId: 'DEP-008', date: '2026-03-29', amount: 2200, paymentStatus: 'Paid', bookingStatus: 'Confirmed', participants: [{ name: 'Siddharth Rao', age: 31, medical: 'None' }], bookedOn: '2026-01-14' },
  { id: 'BK-2614', customerId: 14, customerName: 'Pooja Verma', trekName: 'Sandhan Valley', departureId: 'DEP-006', date: '2026-04-05', amount: 4500, paymentStatus: 'Paid', bookingStatus: 'Confirmed', participants: [{ name: 'Pooja Verma', age: 27, medical: 'None' }], bookedOn: '2026-01-22' },
  { id: 'BK-2615', customerId: 15, customerName: 'Amit Thakur', trekName: 'Kedarkantha', departureId: 'DEP-004', date: '2026-03-09', amount: 9500, paymentStatus: 'Paid', bookingStatus: 'Confirmed', participants: [{ name: 'Amit Thakur', age: 38, medical: 'None' }], bookedOn: '2026-01-03' },
];

// ─── Invoices ────────────────────────────────────────
export const invoices = [
  { id: 'INV-3001', bookingId: 'BK-2601', customerName: 'Aarav Mehta', date: '2026-01-05', amount: 5000, status: 'Paid', dueDate: '2026-01-20' },
  { id: 'INV-3002', bookingId: 'BK-2602', customerName: 'Sneha Iyer', date: '2026-01-12', amount: 8500, status: 'Partial', dueDate: '2026-02-12' },
  { id: 'INV-3003', bookingId: 'BK-2603', customerName: 'Rohan Kapoor', date: '2026-01-08', amount: 9500, status: 'Paid', dueDate: '2026-01-23' },
  { id: 'INV-3004', bookingId: 'BK-2604', customerName: 'Priya Deshmukh', date: '2025-12-01', amount: 3600, status: 'Paid', dueDate: '2025-12-15' },
  { id: 'INV-3005', bookingId: 'BK-2605', customerName: 'Vikram Singh', date: '2026-01-20', amount: 11000, status: 'Sent', dueDate: '2026-02-20' },
  { id: 'INV-3006', bookingId: 'BK-2606', customerName: 'Ananya Sharma', date: '2026-01-10', amount: 6000, status: 'Paid', dueDate: '2026-01-25' },
  { id: 'INV-3007', bookingId: 'BK-2608', customerName: 'Meera Joshi', date: '2026-01-02', amount: 6600, status: 'Partial', dueDate: '2026-02-02' },
  { id: 'INV-3008', bookingId: 'BK-2609', customerName: 'Arjun Reddy', date: '2026-02-01', amount: 5000, status: 'Paid', dueDate: '2026-02-15' },
  { id: 'INV-3009', bookingId: 'BK-2611', customerName: 'Rahul Gupta', date: '2026-01-25', amount: 22000, status: 'Paid', dueDate: '2026-02-10' },
  { id: 'INV-3010', bookingId: 'BK-2612', customerName: 'Nisha Patel', date: '2026-02-08', amount: 1800, status: 'Sent', dueDate: '2026-03-08' },
];

// ─── Payments ────────────────────────────────────────
export const payments = [
  { id: 'PAY-4001', invoiceId: 'INV-3001', customerName: 'Aarav Mehta', date: '2026-01-06', amount: 5000, method: 'UPI', reference: 'UPI-2026010612345' },
  { id: 'PAY-4002', invoiceId: 'INV-3002', customerName: 'Sneha Iyer', date: '2026-01-13', amount: 5000, method: 'Bank Transfer', reference: 'NEFT-20260113001' },
  { id: 'PAY-4003', invoiceId: 'INV-3003', customerName: 'Rohan Kapoor', date: '2026-01-09', amount: 9500, method: 'UPI', reference: 'UPI-2026010923456' },
  { id: 'PAY-4004', invoiceId: 'INV-3004', customerName: 'Priya Deshmukh', date: '2025-12-02', amount: 3600, method: 'Credit Card', reference: 'CC-2025120234567' },
  { id: 'PAY-4005', invoiceId: 'INV-3006', customerName: 'Ananya Sharma', date: '2026-01-11', amount: 6000, method: 'UPI', reference: 'UPI-2026011134567' },
  { id: 'PAY-4006', invoiceId: 'INV-3007', customerName: 'Meera Joshi', date: '2026-01-03', amount: 3000, method: 'Bank Transfer', reference: 'NEFT-20260103002' },
  { id: 'PAY-4007', invoiceId: 'INV-3008', customerName: 'Arjun Reddy', date: '2026-02-02', amount: 5000, method: 'UPI', reference: 'UPI-2026020245678' },
  { id: 'PAY-4008', invoiceId: 'INV-3009', customerName: 'Rahul Gupta', date: '2026-01-26', amount: 22000, method: 'Credit Card', reference: 'CC-2026012656789' },
];

// ─── Refunds ─────────────────────────────────────────
export const refunds = [
  { id: 'REF-5001', bookingId: 'BK-2607', customerName: 'Karthik Nair', date: '2026-01-18', amount: 4500, reason: 'Trek canceled by customer', status: 'Processed', method: 'Original Payment Method' },
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
  { name: 'Pune', value: 35, color: '#059669' },
  { name: 'Mumbai', value: 25, color: '#0891b2' },
  { name: 'Delhi', value: 22, color: '#7c3aed' },
  { name: 'Dehradun', value: 12, color: '#ea580c' },
  { name: 'Bangalore', value: 6, color: '#dc2626' },
];

export const recentActivity = [
  { id: 1, type: 'booking', message: 'Aarav Mehta booked Rajmachi Fort from Pune', time: '2 hours ago', status: 'Confirmed' },
  { id: 2, type: 'payment', message: 'Payment received from Rahul Gupta - ₹22,000', time: '4 hours ago', status: 'Paid' },
  { id: 3, type: 'booking', message: 'Nisha Patel booked Kalsubai Peak from Pune', time: '6 hours ago', status: 'Pending' },
  { id: 4, type: 'cancellation', message: 'Karthik Nair canceled Sandhan Valley booking', time: '1 day ago', status: 'Canceled' },
  { id: 5, type: 'booking', message: 'Ananya Sharma booked Rajmachi Fort from Mumbai', time: '1 day ago', status: 'Confirmed' },
];

export const alerts = [
  { id: 1, type: 'warning', title: 'Low Seats Alert', message: 'Kedarkantha (Delhi) DEP-004 has only 3 seats left', priority: 'high' },
  { id: 2, type: 'info', title: 'New City Added', message: 'Bangalore added as departure city', priority: 'medium' },
  { id: 3, type: 'warning', title: 'Payment Overdue', message: 'Vikram Singh - ₹11,000 payment overdue for Hampta Pass', priority: 'high' },
  { id: 4, type: 'info', title: 'Guide Availability', message: 'Tenzing Dorji unavailable Mar 5-12 for personal leave', priority: 'low' },
];

// ─── Notifications ───────────────────────────────────
export const notifications = [
  { id: 1, title: 'New Booking', message: 'Aarav Mehta booked Rajmachi Fort', time: '2h ago', read: false },
  { id: 2, title: 'Payment Received', message: '₹22,000 from Rahul Gupta', time: '4h ago', read: false },
  { id: 3, title: 'Batch Full', message: 'Kedarkantha DEP-004 almost full', time: '1d ago', read: true },
  { id: 4, title: 'Cancellation', message: 'Karthik Nair canceled booking', time: '1d ago', read: true },
  { id: 5, title: 'Low Seats', message: 'Only 3 seats left on DEP-004', time: '2d ago', read: true },
];
