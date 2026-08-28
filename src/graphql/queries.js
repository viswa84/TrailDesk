import { gql } from '@apollo/client';

// ─── WhatsApp Visual Flow Builder Query ──────────────
export const GET_FLOW_DEFINITION = gql`
  query GetFlowDefinition {
    getFlowDefinition {
      _id
      updatedAt
      nodes {
        id
        type
        position { x y }
        data {
          label
          message
          buttons { handle label }
          listButtonLabel
          sectionTitle
          rows { handle title description }
          dynamicSource
          dynamicButtonLabel
          dynamicSectionTitle
          noDataMessage
          displayMode
          inputVariable
          fallbackMessage
        }
      }
      edges {
        id
        source
        sourceHandle
        target
      }
    }
  }
`;

// ─── WhatsApp Flow Config Query ──────────────────────
export const GET_FLOW_CONFIG = gql`
  query GetFlowConfig {
    getFlowConfig {
      _id
      aiEnabled
      greetingKeywords
      cityStepMessage
      cityStepButtonLabel
      cityStepSectionTitle
      browseTypeMessage
      browseTreksLabel
      browseDatesLabel
      trekListMessage
      trekListButtonLabel
      trekListSectionTitle
      dateListMessage
      dateListButtonLabel
      dateListSectionTitle
      departureDateListMessage
      departureDateListButtonLabel
      departureDateListSectionTitle
      trekOnDateListMessage
      trekOnDateListButtonLabel
      trekOnDateListSectionTitle
      groupSizeMessage
      discountTiers {
        id
        label
        min
        max
        discount
      }
      exactCountPrompt
      supportMessage
      noCitiesMessage
      noTreksMessage
      noDatesMessage
      noTreksOnDateMessage
      fallbackMessage
      updatedAt
    }
  }
`;

// ─── Guide Queries ───────────────────────────────────
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

export const GET_GUIDE = gql`
  query GetGuide($id: ID!) {
    getGuide(id: $id) {
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

// ─── City Queries ─────────────────────────────────────
export const GET_CITIES = gql`
  query GetCities($isActive: Boolean) {
    getCities(isActive: $isActive) {
    _id
    name
    state
    isActive
    sortOrder
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
    shortName
    description
    difficulty
    duration
    price
    startFrom
    itinerary
    thingsToCarry
    contact
    image
    images
    location
    altitude
    bestSeason
    isActive
    goLiveDate
    seatsTotal
    seatsAvailable
    departureCount
    totalDepartureSeats
    trekCode
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
      name
      lastMessage
      lastMessageTime
      messageCount
      unreadCount
      source
      step
      aiEnabled
      assignedGuideId
      assignedGuideName
      leadStatus
      followUpAt
      lastRepliedAt
      lastInboundAt
      leadNote
    }
  }
`;

export const GET_MESSAGES = gql`
  query GetMessages($phone: String!, $limit: Int, $before: String) {
    getMessages(phone: $phone, limit: $limit, before: $before) {
      messages {
        _id
        phone
        direction
        message
        messageType
        raw
        waMessageId
        deliveryStatus
        deliveryFailureReason
        mediaUrl
        mediaType
        fileName
        createdAt
        updatedAt
      }
      hasMore
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
    departureDate
    departureEndDate
    cityName
    name
    email
    phone
    peopleCount
    amount
    paidAmount
    pendingAmount
    status
    paymentType
    paymentLink
    balanceReminderSentAt
    balanceTxnid
    couponCode
    couponDiscount
    referralCode
    referralDiscount
    packageBreakdown {
      packageName
      pricePerPerson
      count
      subtotal
    }
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
    departureDate
    departureEndDate
    cityName
    name
    email
    phone
    peopleCount
    amount
    paidAmount
    pendingAmount
    status
    paymentType
    paymentLink
    balanceReminderSentAt
    balanceTxnid
    couponCode
    couponDiscount
    referralCode
    referralDiscount
    packageBreakdown {
      packageName
      pricePerPerson
      count
      subtotal
    }
    createdAt
  }
}
`;

// ─── Conversion Funnel Query ─────────────────────────
export const GET_CONVERSION_FUNNEL = gql`
  query GetConversionFunnel($days: Int) {
    getConversionFunnel(days: $days) {
      overall { stage count }
      byDeparture { depUniqueId trekName stages { stage count } }
    }
  }
`;

// ─── Scheduled Messages Query ────────────────────────
export const GET_SCHEDULED_MESSAGES = gql`
  query GetScheduledMessages($bookingId: ID!) {
    getScheduledMessages(bookingId: $bookingId) {
      _id
      type
      sendAt
      status
      sentAt
    }
  }
`;

// ─── Waitlist Query ──────────────────────────────────
export const GET_WAITLIST = gql`
  query GetWaitlist($departureId: ID!) {
    getWaitlist(departureId: $departureId) {
      _id
      departureId
      depUniqueId
      trekName
      phone
      name
      peopleCount
      notified
      notifiedAt
      createdAt
    }
  }
`;

// ─── Referrals Query ─────────────────────────────────
export const GET_REFERRALS = gql`
  query GetReferrals {
    getReferrals {
      _id
      referrerPhone
      code
      discountAmount
      totalUses
      maxUses
      active
      usedBy { phone bookingId usedAt }
      createdAt
    }
  }
`;

export const GET_REFERRAL_SETTINGS = gql`
  query GetReferralSettings {
    getReferralSettings {
      enabled
      discountAmount
      maxUsesPerCode
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
    departureCode
    trekId
    trekName
    cityPickups {
      cityId
      cityName
      boardingPoints {
        _id
        name
      }
    }
    cityId
    cityName
    startDate
    endDate
    duration
    nights
    days
    price
    packages {
      name
      price
      inclusions
      cityIds
    }
    capacity
    booked
    itinerary
    thingsToCarry
    contact
    meetingPoint
    pickupTime
    transport
    imageUrl
    brochureUrl
    whatsappGroupInviteLink
    whatsappGroupName
    guideId
    guideName
    status
    boardingPointIds
    sortOrder
    acceptPartialPayment
    partialPaymentAmount
    acceptsCoupons
    maxDiscountPerPerson
    cancellationReason
    createdAt
  }
}
`;

// Soft-deleted departures, newest-deleted first. Fetches everything the
// Deleted tab displays plus everything needed to "Copy" into a fresh create form.
export const GET_DELETED_DEPARTURES = gql`
  query GetDeletedDepartures {
  getDeletedDepartures {
    _id
    uniqueId
    departureCode
    trekId
    trekName
    cityPickups {
      cityId
      cityName
      boardingPoints {
        _id
        name
      }
    }
    cityId
    cityName
    startDate
    endDate
    duration
    nights
    days
    price
    packages {
      name
      price
      inclusions
      cityIds
    }
    capacity
    booked
    itinerary
    thingsToCarry
    contact
    meetingPoint
    pickupTime
    transport
    imageUrl
    brochureUrl
    whatsappGroupInviteLink
    whatsappGroupName
    guideId
    guideName
    status
    boardingPointIds
    acceptPartialPayment
    partialPaymentAmount
    acceptsCoupons
    maxDiscountPerPerson
    cancellationReason
    isDeleted
    deletedAt
    createdAt
  }
}
`;

export const GET_DEPARTURE = gql`
  query GetDeparture($id: ID!) {
  getDeparture(id: $id) {
    _id
    uniqueId
    departureCode
    trekId
    trekName
    cityPickups {
      cityId
      cityName
      boardingPoints {
        _id
        name
      }
    }
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
    pickupTime
    transport
    imageUrl
    brochureUrl
    galleryUrls {
      url
      uploadedAt
    }
    whatsappGroupInviteLink
    whatsappGroupName
    guideId
    guideName
    status
    boardingPointIds
    acceptPartialPayment
    partialPaymentAmount
    acceptsCoupons
    maxDiscountPerPerson
    cancellationReason
    packages {
      name
      price
      inclusions
      cityIds
    }
  }
}
`;

export const GET_PARTICIPANTS_BY_DEPARTURE = gql`
  query GetParticipantsByDeparture($departureId: ID!) {
  getParticipantsByDeparture(departureId: $departureId) {
    bookingId
    txnid
    phone
    peopleCount
    amount
    paidAmount
    pendingAmount
    refundDue
    status
    createdAt
      participants {
      _id
      name
      phone
      boardingPointId
      boardingPointName
      bloodGroup
      weight
      createdAt
    }
  }
}
`;

export const GET_BOARDING_POINTS = gql`
  query GetBoardingPoints($cityId: ID) {
  getBoardingPoints(cityId: $cityId) {
    _id
    cityId
    name
    googleMapLink
    latitude
    longitude
    isActive
    sortOrder
    createdAt
    updatedAt
  }
}
`;
// ─── Finance Queries ─────────────────────────────────
export const GET_INVOICES = gql`
  query GetInvoices {
    getInvoices {
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
    username
    name
    email
    phone
    role
    avatar
    companyCode
    companyName
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
    code
    name
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
      code
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

export const GET_ALL_COMPANIES = gql`
  query GetAllCompanies($status: String, $plan: String, $search: String) {
  getAllCompanies(status: $status, plan: $plan, search: $search) {
    _id
    code
    name
    slug
    plan
    status
    licenseExpiry
    adminEmail
    adminUsername
    userCount
    bookingCount
    trekCount
    hasWhatsappConfig
    hasPaymentGateway
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

export const GET_COMPANY_BY_CODE = gql`
  query GetCompanyByCode($code: String!) {
  getCompanyByCode(code: $code) {
    _id
    code
    name
    slug
    plan
    status
    licenseExpiry
    adminEmail
    adminUsername
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

// ─── Company Profile Query ──────────────────────────────
export const GET_COMPANY_PROFILE = gql`
  query GetCompanyProfile {
    getCompanyProfile {
      _id
      companyName
      tagline
      logoUrl
      signatureUrl
      establishedYear
      registrationNumber
      gstNumber
      panNumber
      email
      phone
      altPhone
      businessWhatsappNumber
      website
      addressLine1
      addressLine2
      city
      state
      country
      pincode
      bankName
      accountNumber
      ifscCode
      branchName
      accountHolderName
      pdfFooterText
      termsAndConditions
      cancellationPolicy
      aboutUs
      themeColor
      primaryColor
      secondaryColor
      createdAt
      updatedAt
    }
  }
`;

export const GET_ALL_USERS_ADMIN = gql`
  query GetAllUsers($tenantId: ID, $role: String, $search: String) {
  getAllUsers(tenantId: $tenantId, role: $role, search: $search) {
    _id
    username
    name
    email
    phone
    role
    companyCode
    companyName
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

export const GET_COMPANY_DETAILS = gql`
  query GetCompanyDetails($code: String!) {
    getCompanyByCode(code: $code) {
      _id code name slug plan status licenseExpiry
      adminEmail adminUsername userCount bookingCount trekCount
      hasWhatsappConfig hasPaymentGateway
      adminUsers {
        _id username name email phone role companyCode companyName createdAt
      }
      settings { gst address website logo }
      createdAt updatedAt
    }
  }
`;

export const GET_COMPANY_USERS = gql`
  query GetCompanyUsers($companyCode: String!) {
    getCompanyUsers(companyCode: $companyCode) {
      _id username name email phone role companyCode companyName createdAt
    }
  }
`;

export const GET_ALL_PARTICIPANTS = gql`
  query GetAllParticipants {
    getAllParticipants {
    _id
    bookingId
    departureId
    name
    phone
    createdAt
  }
}
`;

// ─── Contact Inquiry Queries ─────────────────────────
export const GET_CONTACT_INQUIRIES = gql`
  query GetContactInquiries($status: String, $search: String) {
    getContactInquiries(status: $status, search: $search) {
      _id
      name
      email
      phone
      message
      status
      createdAt
      updatedAt
    }
  }
`;

// ─── Staff Users Query ────────────────────────────────
export const GET_STAFF_USERS = gql`
  query GetStaffUsers {
    getStaffUsers {
      _id
      name
      email
      phone
      role
    }
  }
`;

// ─── Conversations ─────────────────────────────────────
export const GET_CONVERSATIONS = gql`
  query GetConversations($filter: String, $search: String) {
    getConversations(filter: $filter, search: $search) {
      phone
      customerName
      step
      aiEnabled
      assignedGuideId
      assignedGuideName
      assignedAt
      assignedByName
      lastMessageAt
      tenantId
    }
  }
`;

export const GET_CONVERSATION_MESSAGES = gql`
  query GetConversationMessages($phone: String!, $limit: Int) {
    getConversationMessages(phone: $phone, limit: $limit) {
      id
      phone
      direction
      message
      deliveryStatus
      createdAt
    }
  }
`;

export const GET_CONVERSATION_LOGS = gql`
  query GetConversationLogs($phone: String!) {
    getConversationLogs(phone: $phone) {
      id
      phone
      action
      performedByName
      guideName
      note
      createdAt
    }
  }
`;

export const ASSIGN_GUIDE = gql`
  mutation AssignGuide($phone: String!, $guideId: ID!) {
    assignGuide(phone: $phone, guideId: $guideId) {
      phone
      customerName
      step
      aiEnabled
      assignedGuideId
      assignedGuideName
      assignedAt
      assignedByName
      lastMessageAt
      tenantId
    }
  }
`;

export const UNASSIGN_GUIDE = gql`
  mutation UnassignGuide($phone: String!) {
    unassignGuide(phone: $phone) {
      phone
      customerName
      step
      aiEnabled
      assignedGuideId
      assignedGuideName
      assignedAt
      assignedByName
      lastMessageAt
      tenantId
    }
  }
`;

export const TOGGLE_AI = gql`
  mutation ToggleAI($phone: String!, $enabled: Boolean!) {
    toggleAI(phone: $phone, enabled: $enabled) {
      phone
      customerName
      step
      aiEnabled
      assignedGuideId
      assignedGuideName
      assignedAt
      assignedByName
      lastMessageAt
      tenantId
    }
  }
`;

export const SEND_GUIDE_MESSAGE = gql`
  mutation SendGuideMessage($phone: String!, $message: String!) {
    sendGuideMessage(phone: $phone, message: $message)
  }
`;

// ─── Payment Gateways ──────────────────────────────────
export const LIST_SUPPORTED_PROVIDERS = gql`
  query ListSupportedProviders {
    listSupportedProviders {
      name
      displayName
      kind
      requiredFields {
        key
        label
        type
        required
      }
      settingsFields {
        key
        label
        type
        required
      }
    }
  }
`;

export const LIST_PAYMENT_GATEWAYS = gql`
  query ListPaymentGateways {
    listPaymentGateways {
      _id
      tenantId
      provider
      enabled
      isDefault
      env
      maskedCredentials
      settings
      createdAt
      updatedAt
    }
  }
`;

// ─── Manual UPI payment verification ───────────────────
export const MANUAL_PAYMENTS = gql`
  query ManualPayments($state: String, $limit: Int, $offset: Int) {
    manualPayments(state: $state, limit: $limit, offset: $offset) {
      total
      pendingCount
      items {
        bookingId
        txnid
        state
        amountExpected
        amountClaimed
        utr
        screenshotUrl
        submittedAt
        submitCount
        reviewedAt
        reviewedByName
        reviewNote
        customerName
        phone
        email
        trekName
        departureId
        departureDate
        peopleCount
        bookingAmount
        paidAmount
        pendingAmount
        bookingStatus
        paymentType
        seatsAvailable
        createdAt
      }
    }
  }
`;

export const MANUAL_PAYMENT_PENDING_COUNT = gql`
  query ManualPaymentPendingCount {
    manualPaymentPendingCount
  }
`;

// ─── Integrations ──────────────────────────────────────
export const LIST_SUPPORTED_INTEGRATIONS = gql`
  query ListSupportedIntegrations {
    listSupportedIntegrations {
      name
      displayName
      description
      requiredFields {
        key
        label
        type
        required
        secret
        placeholder
      }
      metaFields {
        key
        label
        type
        required
        secret
        placeholder
      }
    }
  }
`;

export const LIST_INTEGRATIONS = gql`
  query ListIntegrations {
    listIntegrations {
      _id
      tenantId
      provider
      enabled
      meta
      hasCredentials
      maskedCredentials
      createdAt
      updatedAt
    }
  }
`;

export const GET_INTEGRATION = gql`
  query GetIntegration($provider: String!) {
    getIntegration(provider: $provider) {
      _id
      tenantId
      provider
      enabled
      meta
      hasCredentials
      maskedCredentials
      createdAt
      updatedAt
    }
  }
`;

// ─── Follow-up Rules ───────────────────────────────────
export const GET_FOLLOW_UP_RULES = gql`
  query GetFollowUpRules {
    getFollowUpRules {
      _id
      name
      condition
      delayHours
      message
      enabled
      createdAt
      updatedAt
    }
  }
`;

export const GET_TRAFFIC_OVERVIEW = gql`
  query GetTrafficOverview($days: Int) {
    getTrafficOverview(days: $days) {
      totalVisits
      trekPageVisits
      depPageVisits
      trend {
        date
        visits
      }
      hourlyTrend {
        hour
        visits
      }
      whatsappVisitors {
        phone
        visits
      }
      treks {
        trekId
        trekName
        totalVisits
        trekPageVisits
        depPageVisits
        trend {
          date
          visits
        }
        departures {
          depUniqueId
          trekName
          totalVisits
        }
      }
    }
  }
`;

// ─── Growth (Acquisition & Engagement) queries ───────────────────────────────
export const GET_ACQUISITION_OVERVIEW = gql`
  query GetAcquisitionOverview($days: Int) {
    getAcquisitionOverview(days: $days) {
      totalUnique
      totalNew
      totalReturning
      adConversations
      adBookings
      adConversionRate
      organicConversations
      daily {
        date
        unique
        newCustomers
        returning
      }
      adAttribution {
        key
        adId
        conversations
        bookings
        conversionRate
        revenue
      }
      reengagement {
        reactivatedAfter24h
        returnedAfter7d
        returnedAfter30d
      }
    }
  }
`;

export const GET_META_ADS = gql`
  query GetMetaAds($days: Int) {
    getMetaAds(days: $days) {
      configured
      error
      totalSpend
      totalClicks
      ads {
        campaign
        spend
        impressions
        clicks
        cpc
        ctr
      }
    }
  }
`;

// ─── Coupon queries ──────────────────────────────────────────────────────────
export const GET_COUPONS = gql`
  query GetCoupons {
    getCoupons {
      _id
      code
      description
      discountType
      discountValue
      minPeople
      maxUses
      usedCount
      validFrom
      validTo
      isActive
      isPublic
      createdAt
      updatedAt
    }
  }
`;

export const GET_COUPON = gql`
  query GetCoupon($id: ID!) {
    getCoupon(id: $id) {
      _id
      code
      description
      discountType
      discountValue
      minPeople
      maxUses
      usedCount
      validFrom
      validTo
      isActive
      isPublic
      createdAt
      updatedAt
    }
  }
`;

// ─── Reviews (post-trek social proof / moderation) ──────────────
export const GET_REVIEWS = gql`
  query GetReviews($trekId: ID, $status: String) {
    getReviews(trekId: $trekId, status: $status) {
      _id
      trekId
      departureId
      bookingId
      phone
      customerName
      rating
      comment
      status
      createdAt
    }
  }
`;

// ─── Fill Nudge ("filling up" visitor nudge) ──────────────
export const GET_FILL_NUDGE_STATS = gql`
  query GetFillNudgeStats($departureId: ID) {
    getFillNudgeStats(departureId: $departureId) {
      departureId
      depUniqueId
      trekName
      nudgesSent
      converted
      conversionRate
    }
  }
`;

// ─── AI Token Usage (analytics) ───────────────────────────
export const GET_AI_TOKEN_USAGE = gql`
  query GetAiTokenUsage($from: String, $to: String) {
    getAiTokenUsage(from: $from, to: $to) {
      total { calls promptTokens completionTokens totalTokens costUsd costInr }
      byModel { model provider calls promptTokens completionTokens totalTokens costUsd costInr }
      daily   { period calls totalTokens costUsd costInr }
      weekly  { period calls totalTokens costUsd costInr }
      monthly { period calls totalTokens costUsd costInr }
    }
  }
`;

export const GET_AI_TOKEN_USAGE_PLATFORM = gql`
  query GetAiTokenUsagePlatform($from: String, $to: String) {
    getAiTokenUsagePlatform(from: $from, to: $to) {
      total { calls totalTokens costUsd costInr }
      byModel { model provider calls totalTokens costUsd costInr }
      daily   { period totalTokens costUsd costInr }
      weekly  { period totalTokens costUsd costInr }
      monthly { period totalTokens costUsd costInr }
      byCompany {
        companyCode companyName calls totalTokens costUsd costInr
        byModel { model provider calls totalTokens costUsd costInr }
      }
    }
  }
`;

// ─── Group-share deep-link click tracking (analytics) ─────────────────
// Identified pre-booking clicks on Click-to-WhatsApp group-share links.
export const GET_GROUP_LINK_CLICKS = gql`
  query GetGroupLinkClicks($groupCode: String, $limit: Int) {
    getGroupLinkClicks(groupCode: $groupCode, limit: $limit) {
      _id
      phone
      customerName
      groupCode
      trekId
      trekName
      departureId
      departureCode
      matchedCode
      at
    }
  }
`;

export const GET_GROUP_LINK_STATS = gql`
  query GetGroupLinkStats {
    getGroupLinkStats {
      groupCode
      clicks
      uniquePhones
      lastClickAt
    }
  }
`;
