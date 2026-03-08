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
      departureCount
      totalDepartureSeats
      createdAt
      updatedAt
    }
  }
`;

export const GET_TREK = gql`
  query GetTrek($id: ID!) {
    getTrek(id: $id) {
      master {
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
      liveInstances {
        _id
        goLiveDate
        seatsTotal
        seatsAvailable
        isActive
        name
        price
        createdAt
      }
    }
  }
`;

// ─── LiveTrek Queries ────────────────────────────────
export const GET_LIVE_TREKS = gql`
  query GetLiveTreks {
    getLiveTreks {
      _id
      trekMaster
      goLiveDate
      seatsTotal
      seatsAvailable
      isActive
      name
      description
      difficulty
      duration
      price
      startFrom
      itinerary
      thingsToCarry
      contact
      createdAt
      updatedAt
    }
  }
`;

export const GET_LIVE_TREK = gql`
  query GetLiveTrek($id: ID!) {
    getLiveTrek(id: $id) {
      _id
      trekMaster
      goLiveDate
      seatsTotal
      seatsAvailable
      isActive
      name
      description
      difficulty
      duration
      price
      startFrom
      itinerary
      thingsToCarry
      contact
      createdAt
      updatedAt
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
      updatedAt
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

export const GET_BOOKING = gql`
  query GetBooking($id: ID!) {
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

// ─── Dashboard Query ─────────────────────────────────
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

// ─── Customer Queries ────────────────────────────────
export const GET_CUSTOMERS = gql`
  query GetCustomers($search: String) {
    getCustomers(search: $search) {
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

export const GET_CUSTOMER = gql`
  query GetCustomer($id: ID!) {
    getCustomer(id: $id) {
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
      cancellationReason
      createdAt
    }
  }
`;

export const GET_DEPARTURE = gql`
  query GetDeparture($id: ID!) {
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
      cancellationReason
    }
  }
`;

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
      createdAt
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
      createdAt
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
      createdAt
    }
  }
`;

// ─── Campaign Queries ────────────────────────────────
export const GET_CAMPAIGNS = gql`
  query GetCampaigns($status: String) {
    getCampaigns(status: $status) {
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

export const GET_CAMPAIGN = gql`
  query GetCampaign($id: ID!) {
    getCampaign(id: $id) {
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

// ─── Notification Queries ────────────────────────────
export const GET_NOTIFICATIONS = gql`
  query GetNotifications {
    getNotifications {
      _id
      title
      message
      type
      read
      createdAt
    }
  }
`;

export const GET_UNREAD_NOTIFICATION_COUNT = gql`
  query GetUnreadNotificationCount {
    getUnreadNotificationCount
  }
`;

// ─── Auth Queries ────────────────────────────────────
export const ME = gql`
  query Me {
    me {
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
      createdAt
    }
  }
`;

export const MY_ORGANIZATION = gql`
  query MyOrganization {
    myOrganization {
      _id
      name
      slug
      plan
      status
      gst
      address
      website
      logo
    }
  }
`;

// ─── Super Admin Queries ────────────────────────────────
export const SUPER_ADMIN_DASHBOARD = gql`
  query SuperAdminDashboard {
    superAdminDashboard {
      totalTenants
      activeTenants
      suspendedTenants
      trialTenants
      totalUsers
      totalBookingsAcrossPlatform
      totalRevenueAcrossPlatform
      planBreakdown {
        plan
        count
      }
      recentSignups {
        _id
        name
        slug
        plan
        status
        adminEmail
        userCount
        bookingCount
        createdAt
      }
      topTenantsByBookings {
        tenantId
        tenantName
        bookings
        revenue
      }
    }
  }
`;

export const GET_ALL_TENANTS = gql`
  query GetAllTenants($status: String, $plan: String, $search: String) {
    getAllTenants(status: $status, plan: $plan, search: $search) {
      _id
      name
      slug
      plan
      status
      licenseExpiry
      adminEmail
      userCount
      bookingCount
      settings {
        gst
        address
        website
        logo
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_TENANT_BY_ID = gql`
  query GetTenantById($id: ID!) {
    getTenantById(id: $id) {
      _id
      name
      slug
      plan
      status
      licenseExpiry
      adminEmail
      userCount
      bookingCount
      settings {
        gst
        address
        website
      }
      createdAt
    }
  }
`;

export const GET_ALL_USERS_ADMIN = gql`
  query GetAllUsers($tenantId: ID, $role: String, $search: String) {
    getAllUsers(tenantId: $tenantId, role: $role, search: $search) {
      _id
      name
      email
      phone
      role
      tenantId
      tenantName
      createdAt
    }
  }
`;

export const GET_PLATFORM_ACTIVITY_LOG = gql`
  query GetPlatformActivityLog($limit: Int) {
    getPlatformActivityLog(limit: $limit) {
      id
      action
      targetType
      targetId
      targetName
      performedBy
      timestamp
    }
  }
`;
