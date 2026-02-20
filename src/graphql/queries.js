import { gql } from '@apollo/client';

// ─── Trek Queries ────────────────────────────────────
export const GET_TREKS = gql`
  query GetTreks($region: String, $difficulty: String, $season: String) {
    treks(region: $region, difficulty: $difficulty, season: $season) {
      id
      name
      region
      state
      difficulty
      duration
      altitude
      price
      season
      description
      rating
      totalBookings
      image
    }
  }
`;

export const GET_TREK_BY_ID = gql`
  query GetTrekById($id: ID!) {
    trek(id: $id) {
      id
      name
      region
      state
      difficulty
      duration
      altitude
      price
      season
      description
      rating
      totalBookings
      image
    }
  }
`;

// ─── Departure Queries ───────────────────────────────
export const GET_DEPARTURES = gql`
  query GetDepartures($trekId: ID, $status: String) {
    departures(trekId: $trekId, status: $status) {
      id
      trekId
      trekName
      startDate
      endDate
      capacity
      booked
      guideId
      guideName
      status
      price
      meetingPoint
    }
  }
`;

export const GET_DEPARTURE_BY_ID = gql`
  query GetDepartureById($id: ID!) {
    departure(id: $id) {
      id
      trekId
      trekName
      startDate
      endDate
      capacity
      booked
      guideId
      guideName
      status
      price
      meetingPoint
    }
  }
`;

// ─── Booking Queries ─────────────────────────────────
export const GET_BOOKINGS = gql`
  query GetBookings($paymentStatus: String, $bookingStatus: String) {
    bookings(paymentStatus: $paymentStatus, bookingStatus: $bookingStatus) {
      id
      customerId
      customerName
      trekName
      departureId
      date
      amount
      paymentStatus
      bookingStatus
      bookedOn
      participants {
        name
        age
        medical
      }
    }
  }
`;

export const GET_BOOKING_BY_ID = gql`
  query GetBookingById($id: ID!) {
    booking(id: $id) {
      id
      customerId
      customerName
      trekName
      departureId
      date
      amount
      paymentStatus
      bookingStatus
      bookedOn
      participants {
        name
        age
        medical
      }
    }
  }
`;

// ─── Customer Queries ────────────────────────────────
export const GET_CUSTOMERS = gql`
  query GetCustomers($search: String) {
    customers(search: $search) {
      id
      name
      email
      phone
      totalTreks
      ltv
      tags
      joinDate
      city
    }
  }
`;

export const GET_CUSTOMER_BY_ID = gql`
  query GetCustomerById($id: ID!) {
    customer(id: $id) {
      id
      name
      email
      phone
      totalTreks
      ltv
      tags
      joinDate
      city
    }
  }
`;

// ─── Finance Queries ─────────────────────────────────
export const GET_INVOICES = gql`
  query GetInvoices($status: String) {
    invoices(status: $status) {
      id
      bookingId
      customerName
      date
      amount
      status
      dueDate
    }
  }
`;

export const GET_PAYMENTS = gql`
  query GetPayments {
    payments {
      id
      invoiceId
      customerName
      date
      amount
      method
      reference
    }
  }
`;

export const GET_REFUNDS = gql`
  query GetRefunds {
    refunds {
      id
      bookingId
      customerName
      date
      amount
      reason
      status
      method
    }
  }
`;

// ─── Campaign Queries ────────────────────────────────
export const GET_CAMPAIGNS = gql`
  query GetCampaigns {
    campaigns {
      id
      name
      platform
      spend
      leads
      conversions
      cpl
      roas
      status
      startDate
      endDate
    }
  }
`;

// ─── Dashboard Queries ───────────────────────────────
export const GET_DASHBOARD = gql`
  query GetDashboard {
    dashboardKPIs {
      totalBookings
      revenue
      activeTreks
      conversionRate
      bookingsChange
      revenueChange
      treksChange
      conversionChange
    }
    revenueByMonth {
      month
      revenue
    }
    bookingsByRegion {
      name
      value
      color
    }
    recentActivity {
      id
      type
      message
      time
      status
    }
    alerts {
      id
      type
      title
      message
      priority
    }
  }
`;

// ─── Guides Query ────────────────────────────────────
export const GET_GUIDES = gql`
  query GetGuides {
    guides {
      id
      name
      phone
      experience
      certifications
      rating
      treksLed
      avatar
    }
  }
`;
