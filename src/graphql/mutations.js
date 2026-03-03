import { gql } from '@apollo/client';

// ─── Auth Mutations ──────────────────────────────────
export const LOGIN_MUTATION = gql`
  mutation Login($phone: String!, $password: String!) {
    login(phone: $phone, password: $password) {
      token
      user {
        _id
        name
        email
        phone
        role
        avatar
        tenantId
        tenantName
      }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        _id
        name
        email
        phone
        role
        tenantId
        tenantName
      }
    }
  }
`;

// ─── City Mutations ──────────────────────────────────
export const CREATE_CITY = gql`
  mutation CreateCity($input: CreateCityInput!) {
    createCity(input: $input) {
      _id
      name
      state
      isActive
    }
  }
`;

export const UPDATE_CITY = gql`
  mutation UpdateCity($id: ID!, $input: UpdateCityInput!) {
    updateCity(id: $id, input: $input) {
      _id
      name
      state
      isActive
    }
  }
`;

export const DELETE_CITY = gql`
  mutation DeleteCity($id: ID!) {
    deleteCity(id: $id) {
      message
    }
  }
`;

// ─── Trek Mutations ──────────────────────────────────
export const CREATE_TREK = gql`
  mutation CreateTrek($input: CreateTrekInput!) {
    createTrek(input: $input) {
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

export const UPDATE_TREK = gql`
  mutation UpdateTrek($id: ID!, $input: UpdateTrekInput!) {
    updateTrek(id: $id, input: $input) {
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

export const DELETE_TREK = gql`
  mutation DeleteTrek($id: ID!) {
    deleteTrek(id: $id) {
      message
    }
  }
`;

// ─── Departure Mutations ─────────────────────────────
export const CREATE_DEPARTURE = gql`
  mutation CreateDeparture($input: CreateDepartureInput!) {
    createDeparture(input: $input) {
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

export const UPDATE_DEPARTURE = gql`
  mutation UpdateDeparture($id: ID!, $input: UpdateDepartureInput!) {
    updateDeparture(id: $id, input: $input) {
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

export const DELETE_DEPARTURE = gql`
  mutation DeleteDeparture($id: ID!) {
    deleteDeparture(id: $id) {
      message
    }
  }
`;

// ─── Campaign Mutations ──────────────────────────────
export const CREATE_CAMPAIGN = gql`
  mutation CreateCampaign($input: CampaignInput!) {
    createCampaign(input: $input) {
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

export const UPDATE_CAMPAIGN = gql`
  mutation UpdateCampaign($id: ID!, $input: CampaignInput!) {
    updateCampaign(id: $id, input: $input) {
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

export const DELETE_CAMPAIGN = gql`
  mutation DeleteCampaign($id: ID!) {
    deleteCampaign(id: $id)
  }
`;

// ─── Booking Mutations ───────────────────────────────
export const CREATE_BOOKING = gql`
  mutation CreateBooking($input: BookingInput!) {
    createBooking(input: $input) {
      _id
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
      _id
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
    deleteBooking(id: $id) {
      message
    }
  }
`;

// ─── Customer Mutations ──────────────────────────────
export const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CustomerInput!) {
    createCustomer(input: $input) {
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

export const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($id: ID!, $input: CustomerInput!) {
    updateCustomer(id: $id, input: $input) {
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

export const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: ID!) {
    deleteCustomer(id: $id) {
      message
    }
  }
`;

// ─── Invoice Mutations ───────────────────────────────
export const CREATE_INVOICE = gql`
  mutation CreateInvoice($input: InvoiceInput!) {
    createInvoice(input: $input) {
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

export const UPDATE_INVOICE = gql`
  mutation UpdateInvoice($id: ID!, $input: InvoiceInput!) {
    updateInvoice(id: $id, input: $input) {
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

export const DELETE_INVOICE = gql`
  mutation DeleteInvoice($id: ID!) {
    deleteInvoice(id: $id) {
      message
    }
  }
`;

// ─── Chat Mutations ──────────────────────────────────
export const SEND_MESSAGE = gql`
  mutation SendMessage($phone: String!, $text: String!) {
    sendMessage(phone: $phone, text: $text) {
      status
    }
  }
`;
