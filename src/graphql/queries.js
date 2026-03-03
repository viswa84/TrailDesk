import { gql } from '@apollo/client';

// ─── City Queries ─────────────────────────────────────
export const GET_CITIES = gql`
  query GetCities($isActive: Boolean) {
    getCities(isActive: $isActive) {
      _id
      name
      state
      isActive
      createdAt
      updatedAt
    }
  }
`;

// ─── Trek Queries ────────────────────────────────────
export const GET_TREKS = gql`
  query GetTreks($isActive: Boolean) {
    getTreks(isActive: $isActive) {
      _id
      name
      image
      location
      description
      altitude
      bestSeason
      difficulty
      isActive
      createdAt
    }
  }
`;

export const GET_TREK_BY_ID = gql`
  query GetTrekById($id: ID!) {
    getTrek(id: $id) {
      _id
      name
      image
      location
      description
      altitude
      bestSeason
      difficulty
      isActive
    }
  }
`;

// ─── Departure Queries ───────────────────────────────
export const GET_DEPARTURES = gql`
  query GetDepartures($trekId: ID, $cityId: ID, $status: String) {
    getDepartures(trekId: $trekId, cityId: $cityId, status: $status) {
      _id
      uniqueId
      trekId
      trekName
      cityId
      cityName
      startDate
      endDate
      duration
      nights
      days
      price
      capacity
      booked
      itinerary
      thingsToCarry
      contact
      meetingPoint
      guideId
      guideName
      status
    }
  }
`;

export const GET_DEPARTURE_BY_ID = gql`
  query GetDepartureById($id: ID!) {
    getDeparture(id: $id) {
      _id
      uniqueId
      trekId
      trekName
      cityId
      cityName
      startDate
      endDate
      duration
      nights
      days
      price
      capacity
      booked
      itinerary
      thingsToCarry
      contact
      meetingPoint
      guideId
      guideName
      status
    }
  }
`;

export const GET_DEPARTURES_BY_CITY = gql`
  query GetDeparturesByCity($cityId: ID!) {
    getDeparturesByCity(cityId: $cityId) {
      _id
      trekId
      trekName
      cityId
      cityName
      startDate
      endDate
      duration
      price
      capacity
      booked
      status
    }
  }
`;

// ─── Booking Queries ─────────────────────────────────
export const GET_BOOKINGS = gql`
  query GetBookings($status: String) {
    getBookings(status: $status) {
      _id
      txnid
      trek
      trekName
      departureId
      cityName
      phone
      peopleCount
      amount
      status
      paymentLink
      createdAt
    }
  }
`;

export const GET_BOOKING_BY_ID = gql`
  query GetBookingById($id: ID!) {
    getBooking(id: $id) {
      _id
      txnid
      trek
      trekName
      departureId
      cityName
      phone
      peopleCount
      amount
      status
      paymentLink
      createdAt
    }
  }
`;

// ─── Customer Queries ────────────────────────────────
export const GET_CUSTOMERS = gql`
  query GetCustomers($search: String) {
    getCustomers(search: $search) {
      _id
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
    getInvoices(status: $status) {
      _id
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
    getPayments {
      _id
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
    getRefunds {
      _id
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
    getCampaigns {
      _id
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
    getDashboard {
      kpis {
        totalBookings
        revenue
        activeTreks
        totalChats
        bookingsChange
        revenueChange
        treksChange
        conversionRate
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
  }
`;

// ─── Guides Query ────────────────────────────────────
export const GET_GUIDES = gql`
  query GetGuides {
    getGuides {
      _id
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

// ─── Chat Queries ────────────────────────────────────
export const GET_CHATS = gql`
  query GetChats {
    getChats {
      phone
      lastMessage
      lastMessageTime
      messageCount
      source
      step
    }
  }
`;

export const GET_MESSAGES = gql`
  query GetMessages($phone: String!) {
    getMessages(phone: $phone) {
      _id
      phone
      direction
      message
      raw
      createdAt
    }
  }
`;
