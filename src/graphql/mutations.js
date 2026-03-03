import { gql } from '@apollo/client';

// ─── Trek Mutations ──────────────────────────────────
export const CREATE_TREK = gql`
  mutation CreateTrek($input: CreateTrekInput!) {
    createTrek(input: $input) {
      _id
      name
      description
      difficulty
      duration
      price
      startFrom
      itinerary
      thingsToCarry
      contact
      image
      location
      altitude
      bestSeason
      isActive
      createdAt
    }
  }
`;

export const UPDATE_TREK = gql`
  mutation UpdateTrek($id: ID!, $input: UpdateTrekInput!) {
    updateTrek(id: $id, input: $input) {
      _id
      name
      description
      difficulty
      duration
      price
      startFrom
      itinerary
      thingsToCarry
      contact
      image
      location
      altitude
      bestSeason
      isActive
      goLiveDate
      seatsTotal
      seatsAvailable
    }
  }
`;

export const DELETE_TREK = gql`
  mutation DeleteTrek($id: ID!) {
    deleteTrek(id: $id) {
      message
      trek {
        _id
        name
      }
    }
  }
`;

export const PUBLISH_TREK = gql`
  mutation PublishTrek($id: ID!, $input: PublishTrekInput!) {
    publishTrek(id: $id, input: $input) {
      _id
      trekMaster
      goLiveDate
      seatsTotal
      seatsAvailable
      name
      price
    }
  }
`;

export const UPDATE_TREK_SEATS = gql`
  mutation UpdateTrekSeats($id: ID!, $seatsAvailable: Int!) {
    updateTrekSeats(id: $id, seatsAvailable: $seatsAvailable) {
      _id
      seatsAvailable
    }
  }
`;

export const UNPUBLISH_TREK = gql`
  mutation UnpublishTrek($id: ID!) {
    unpublishTrek(id: $id) {
      _id
      isActive
    }
  }
`;

// ─── LiveTrek Mutations ──────────────────────────────
export const UPDATE_LIVE_TREK_SEATS = gql`
  mutation UpdateLiveTrekSeats($id: ID!, $seatsAvailable: Int!) {
    updateLiveTrekSeats(id: $id, seatsAvailable: $seatsAvailable) {
      _id
      seatsAvailable
    }
  }
`;

// ─── Departure Cancellation ──────────────────────────
export const CANCEL_DEPARTURE = gql`
  mutation CancelDeparture($id: ID!, $reason: String!) {
    cancelDeparture(id: $id, reason: $reason) {
      _id
      status
      cancellationReason
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

// ─── Customer Mutations ──────────────────────────────
export const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($input: CreateCustomerInput!) {
    createCustomer(input: $input) {
      _id
      name
      email
      phone
      city
      totalTreks
      ltv
      tags
      joinDate
      createdAt
    }
  }
`;

export const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($id: ID!, $input: UpdateCustomerInput!) {
    updateCustomer(id: $id, input: $input) {
      _id
      name
      email
      phone
      city
      totalTreks
      ltv
      tags
    }
  }
`;

export const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: ID!) {
    deleteCustomer(id: $id) {
      message
      customer {
        _id
        name
      }
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
  mutation UpdateDeparture($id: ID!, $input: UpdateDepartureInput!) {
    updateDeparture(id: $id, input: $input) {
      _id
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
    deleteDeparture(id: $id) {
      message
      departure {
        _id
        trekName
      }
    }
  }
`;

// ─── Invoice Mutations ───────────────────────────────
export const CREATE_INVOICE = gql`
  mutation CreateInvoice($input: CreateInvoiceInput!) {
    createInvoice(input: $input) {
      _id
      bookingId
      customerName
      date
      amount
      status
      dueDate
      createdAt
    }
  }
`;

export const UPDATE_INVOICE = gql`
  mutation UpdateInvoice($id: ID!, $input: UpdateInvoiceInput!) {
    updateInvoice(id: $id, input: $input) {
      _id
      bookingId
      customerName
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
      invoice {
        _id
        bookingId
      }
    }
  }
`;

// ─── Campaign Mutations ──────────────────────────────
export const CREATE_CAMPAIGN = gql`
  mutation CreateCampaign($input: CreateCampaignInput!) {
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
      createdAt
    }
  }
`;

export const UPDATE_CAMPAIGN = gql`
  mutation UpdateCampaign($id: ID!, $input: UpdateCampaignInput!) {
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
    deleteCampaign(id: $id) {
      message
      campaign {
        _id
        name
      }
    }
  }
`;

// ─── Notification Mutations ──────────────────────────
export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id) {
      _id
      read
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;

// ─── Auth Mutations ──────────────────────────────────
export const LOGIN = gql`
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
        notificationPrefs {
          newBooking
          paymentReceived
          batchFull
          cancelation
          lowSeats
          marketing
        }
      }
    }
  }
`;

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
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

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      _id
      name
      email
      phone
      avatar
    }
  }
`;

export const UPDATE_ORGANIZATION = gql`
  mutation UpdateOrganization($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      _id
      name
      gst
      address
      website
    }
  }
`;

export const UPDATE_NOTIFICATION_PREFS = gql`
  mutation UpdateNotificationPrefs($input: UpdateNotificationPrefsInput!) {
    updateNotificationPrefs(input: $input) {
      _id
      notificationPrefs {
        newBooking
        paymentReceived
        batchFull
        cancelation
        lowSeats
        marketing
      }
    }
  }
`;

// ─── Super Admin Mutations ──────────────────────────────
export const CREATE_TENANT = gql`
  mutation CreateTenant($input: CreateTenantInput!) {
    createTenant(input: $input) {
      _id
      name
      slug
      plan
      status
      adminEmail
      userCount
      createdAt
    }
  }
`;

export const UPDATE_TENANT = gql`
  mutation UpdateTenant($id: ID!, $input: UpdateTenantInput!) {
    updateTenant(id: $id, input: $input) {
      _id
      name
      slug
      plan
      status
      licenseExpiry
      settings { gst address website logo }
      updatedAt
    }
  }
`;

export const SUSPEND_TENANT = gql`
  mutation SuspendTenant($id: ID!, $reason: String) {
    suspendTenant(id: $id, reason: $reason) {
      _id
      name
      status
    }
  }
`;

export const ACTIVATE_TENANT = gql`
  mutation ActivateTenant($id: ID!) {
    activateTenant(id: $id) {
      _id
      name
      status
    }
  }
`;

export const DELETE_TENANT = gql`
  mutation DeleteTenant($id: ID!) {
    deleteTenant(id: $id)
  }
`;

export const UPDATE_TENANT_PLAN = gql`
  mutation UpdateTenantPlan($id: ID!, $plan: String!, $licenseExpiry: String) {
    updateTenantPlan(id: $id, plan: $plan, licenseExpiry: $licenseExpiry) {
      _id
      name
      plan
      status
      licenseExpiry
    }
  }
`;

export const CREATE_ADMIN_USER = gql`
  mutation CreateAdminUser($tenantId: ID!, $input: CreateAdminUserInput!) {
    createAdminUser(tenantId: $tenantId, input: $input) {
      _id
      name
      email
      phone
      role
      tenantName
      createdAt
    }
  }
`;

export const DELETE_USER_ADMIN = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;

export const RESET_USER_PASSWORD = gql`
  mutation ResetUserPassword($userId: ID!, $newPassword: String!) {
    resetUserPassword(userId: $userId, newPassword: $newPassword)
  }
`;

