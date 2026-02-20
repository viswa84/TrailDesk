import { gql } from '@apollo/client';

// ─── Trek Mutations ──────────────────────────────────
export const CREATE_TREK = gql`
  mutation CreateTrek($input: TrekInput!) {
    createTrek(input: $input) {
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

export const UPDATE_TREK = gql`
  mutation UpdateTrek($id: ID!, $input: TrekInput!) {
    updateTrek(id: $id, input: $input) {
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

export const DELETE_TREK = gql`
  mutation DeleteTrek($id: ID!) {
    deleteTrek(id: $id)
  }
`;

// ─── Departure Mutations ─────────────────────────────
export const CREATE_DEPARTURE = gql`
  mutation CreateDeparture($input: DepartureInput!) {
    createDeparture(input: $input) {
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

export const UPDATE_DEPARTURE = gql`
  mutation UpdateDeparture($id: ID!, $input: DepartureInput!) {
    updateDeparture(id: $id, input: $input) {
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

export const DELETE_DEPARTURE = gql`
  mutation DeleteDeparture($id: ID!) {
    deleteDeparture(id: $id)
  }
`;

// ─── Booking Mutations ───────────────────────────────
export const CREATE_BOOKING = gql`
  mutation CreateBooking($input: BookingInput!) {
    createBooking(input: $input) {
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

export const UPDATE_BOOKING = gql`
  mutation UpdateBooking($id: ID!, $input: BookingInput!) {
    updateBooking(id: $id, input: $input) {
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

export const DELETE_BOOKING = gql`
  mutation DeleteBooking($id: ID!) {
    deleteBooking(id: $id)
  }
`;

// ─── Customer Mutations ──────────────────────────────
export const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CustomerInput!) {
    createCustomer(input: $input) {
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

export const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($id: ID!, $input: CustomerInput!) {
    updateCustomer(id: $id, input: $input) {
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

export const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: ID!) {
    deleteCustomer(id: $id)
  }
`;

// ─── Invoice Mutations ───────────────────────────────
export const CREATE_INVOICE = gql`
  mutation CreateInvoice($input: InvoiceInput!) {
    createInvoice(input: $input) {
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

export const UPDATE_INVOICE = gql`
  mutation UpdateInvoice($id: ID!, $input: InvoiceInput!) {
    updateInvoice(id: $id, input: $input) {
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

export const DELETE_INVOICE = gql`
  mutation DeleteInvoice($id: ID!) {
    deleteInvoice(id: $id)
  }
`;

// ─── Campaign Mutations ──────────────────────────────
export const CREATE_CAMPAIGN = gql`
  mutation CreateCampaign($input: CampaignInput!) {
    createCampaign(input: $input) {
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

export const UPDATE_CAMPAIGN = gql`
  mutation UpdateCampaign($id: ID!, $input: CampaignInput!) {
    updateCampaign(id: $id, input: $input) {
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

export const DELETE_CAMPAIGN = gql`
  mutation DeleteCampaign($id: ID!) {
    deleteCampaign(id: $id)
  }
`;
