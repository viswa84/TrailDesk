import { gql } from '@apollo/client';

// ─── WhatsApp Visual Flow Builder Mutations ──────────
export const SAVE_FLOW_DEFINITION = gql`
  mutation SaveFlowDefinition($nodes: [FlowNodeInput!]!, $edges: [FlowEdgeInput!]!) {
    saveFlowDefinition(nodes: $nodes, edges: $edges) {
      _id
      updatedAt
      nodes {
        id type
        position { x y }
        data {
          label message
          buttons { handle label }
          listButtonLabel sectionTitle
          rows { handle title description }
          dynamicSource dynamicButtonLabel dynamicSectionTitle
          noDataMessage displayMode inputVariable fallbackMessage
        }
      }
      edges { id source sourceHandle target }
    }
  }
`;

export const DELETE_FLOW_DEFINITION = gql`
  mutation DeleteFlowDefinition {
    deleteFlowDefinition
  }
`;

// ─── WhatsApp Flow Config Mutations ─────────────────
export const SET_AI_ENABLED = gql`
  mutation SetAiEnabled($enabled: Boolean!) {
    setAiEnabled(enabled: $enabled) {
      _id
      aiEnabled
    }
  }
`;

export const SAVE_FLOW_CONFIG = gql`
  mutation SaveFlowConfig($input: FlowConfigInput!) {
    saveFlowConfig(input: $input) {
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

export const RESET_FLOW_CONFIG = gql`
  mutation ResetFlowConfig {
    resetFlowConfig {
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

// ─── Auth Mutations ──────────────────────────────────
export const LOGIN = gql`
  mutation Login($companyCode: String!, $username: String!, $password: String!) {
    login(companyCode: $companyCode, username: $username, password: $password) {
      token
      user {
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
  }
`;

// Keep the old name as alias for backward compatibility
export const LOGIN_MUTATION = LOGIN;

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
      shortName
      description
      difficulty
      image
      images
      location
      altitude
      bestSeason
      isActive
      trekCode
      createdAt
    }
  }
`;

export const UPDATE_TREK = gql`
  mutation UpdateTrek($id: ID!, $input: UpdateTrekInput!) {
    updateTrek(id: $id, input: $input) {
      _id
      name
      shortName
      description
      difficulty
      image
      images
      location
      altitude
      bestSeason
      isActive
      trekCode
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
  mutation PublishTrek($id: ID!) {
    publishTrek(id: $id) {
      _id
      name
      isActive
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

// ─── Departure Mutations ─────────────────────────────
export const CREATE_DEPARTURE = gql`
  mutation CreateDeparture($input: CreateDepartureInput!) {
    createDeparture(input: $input) {
      _id
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
      departureCode
    }
  }
`;

export const UPDATE_DEPARTURE = gql`
  mutation UpdateDeparture($id: ID!, $input: UpdateDepartureInput!) {
    updateDeparture(id: $id, input: $input) {
      _id
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
      departureCode
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

export const CANCEL_DEPARTURE = gql`
  mutation CancelDeparture($id: ID!, $reason: String!) {
    cancelDeparture(id: $id, reason: $reason) {
      _id
      status
      cancellationReason
    }
  }
`;

export const REORDER_DEPARTURES = gql`
  mutation ReorderDepartures($ids: [ID!]!) {
    reorderDepartures(ids: $ids) {
      _id
      sortOrder
    }
  }
`;

export const REORDER_CITIES = gql`
  mutation ReorderCities($ids: [ID!]!) {
    reorderCities(ids: $ids) {
      _id
      sortOrder
    }
  }
`;

export const REORDER_BOARDING_POINTS = gql`
  mutation ReorderBoardingPoints($ids: [ID!]!) {
    reorderBoardingPoints(ids: $ids) {
      _id
      sortOrder
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

// ─── Super Admin / Company Mutations ────────────────────
export const COMPANY_DETAIL_FIELDS = `
  _id code name plan status licenseExpiry
  settings { gst address website logo }
  userCount adminEmail adminUsername bookingCount trekCount
  hasWhatsappConfig hasPaymentGateway
  createdAt updatedAt slug
`;

export const UPDATE_COMPANY = gql`
  mutation UpdateCompany($code: String!, $input: UpdateCompanyInput!) {
    updateCompany(code: $code, input: $input) {
      _id
      code
      name
      plan
      status
      licenseExpiry
      settings { gst address website logo }
      updatedAt
    }
  }
`;

export const SUSPEND_COMPANY = gql`
  mutation SuspendCompany($code: String!, $reason: String) {
    suspendCompany(code: $code, reason: $reason) {
      _id
      code
      name
      status
    }
  }
`;

export const ACTIVATE_COMPANY = gql`
  mutation ActivateCompany($code: String!) {
    activateCompany(code: $code) {
      _id
      code
      name
      status
    }
  }
`;

export const DELETE_COMPANY = gql`
  mutation DeleteCompany($code: String!) {
    deleteCompany(code: $code)
  }
`;

export const CREATE_COMPANY_WITH_ADMIN = gql`
  mutation CreateCompanyWithAdmin($input: CreateCompanyWithAdminInput!) {
    createCompanyWithAdmin(input: $input) {
      company {
        _id code name slug plan status
        adminEmail adminUsername userCount bookingCount trekCount
        hasWhatsappConfig hasPaymentGateway
        createdAt
      }
      adminUser { _id username name email phone role companyCode companyName createdAt }
      temporaryPassword
    }
  }
`;

// ─── Per-Company User Management ────────────────────────
export const CREATE_COMPANY_USER = gql`
  mutation CreateCompanyUser($companyCode: String!, $input: CreateUserInput!) {
    createCompanyUser(companyCode: $companyCode, input: $input) {
      user { _id username name email phone role companyCode companyName createdAt }
      temporaryPassword
    }
  }
`;

export const UPDATE_COMPANY_USER = gql`
  mutation UpdateCompanyUser($companyCode: String!, $userId: ID!, $input: UpdateAdminUserInput!) {
    updateCompanyUser(companyCode: $companyCode, userId: $userId, input: $input) {
      _id username name email phone role companyCode companyName createdAt
    }
  }
`;

export const DELETE_COMPANY_USER = gql`
  mutation DeleteCompanyUser($companyCode: String!, $userId: ID!) {
    deleteCompanyUser(companyCode: $companyCode, userId: $userId)
  }
`;

export const RESET_COMPANY_USER_PASSWORD = gql`
  mutation ResetCompanyUserPassword($companyCode: String!, $userId: ID!) {
    resetCompanyUserPassword(companyCode: $companyCode, userId: $userId) {
      user { _id username name email phone role companyCode companyName createdAt }
      temporaryPassword
    }
  }
`;

// ─── Participant Mutations ──────────────────────────────────
export const CREATE_PARTICIPANT = gql`
  mutation CreateParticipant($departureId: ID!, $bookingId: ID!, $name: String!, $phone: String!, $amount: Float, $paidAmount: Float, $peopleCount: Int, $boardingPointId: ID, $boardingPointName: String, $bloodGroup: String, $weight: Float) {
    createParticipant(departureId: $departureId, bookingId: $bookingId, name: $name, phone: $phone, amount: $amount, paidAmount: $paidAmount, peopleCount: $peopleCount, boardingPointId: $boardingPointId, boardingPointName: $boardingPointName, bloodGroup: $bloodGroup, weight: $weight) {
      _id
      bookingId
      departureId
      name
      phone
      boardingPointId
      boardingPointName
      bloodGroup
      weight
      createdAt
    }
  }
`;

export const COLLECT_PENDING_PAYMENT = gql`
  mutation CollectPendingPayment($bookingId: ID!, $amount: Float!) {
    collectPendingPayment(bookingId: $bookingId, amount: $amount) {
      bookingId
      txnid
      amount
      paidAmount
      pendingAmount
      refundDue
      status
    }
  }
`;

export const MARK_REFUNDED = gql`
  mutation MarkRefunded($bookingId: ID!) {
    markRefunded(bookingId: $bookingId) {
      bookingId
      txnid
      amount
      paidAmount
      pendingAmount
      refundDue
      status
    }
  }
`;

export const DELETE_PARTICIPANT = gql`
  mutation DeleteParticipant($id: ID!) {
    deleteParticipant(id: $id) {
      _id
    }
  }
`;

// ─── Boarding Point Mutations ──────────────────────────────────
export const CREATE_BOARDING_POINT = gql`
  mutation CreateBoardingPoint($input: CreateBoardingPointInput!) {
    createBoardingPoint(input: $input) {
      _id
      cityId
      name
      googleMapLink
      latitude
      longitude
      isActive
    }
  }
`;

export const UPDATE_BOARDING_POINT = gql`
  mutation UpdateBoardingPoint($id: ID!, $input: UpdateBoardingPointInput!) {
    updateBoardingPoint(id: $id, input: $input) {
      _id
      cityId
      name
      googleMapLink
      latitude
      longitude
      isActive
    }
  }
`;

export const DELETE_BOARDING_POINT = gql`
  mutation DeleteBoardingPoint($id: ID!) {
    deleteBoardingPoint(id: $id) {
      message
    }
  }
`;

// ─── Guide Mutations ───────────────────────────────────────
export const CREATE_GUIDE = gql`
  mutation CreateGuide($input: GuideInput!) {
    createGuide(input: $input) {
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

export const UPDATE_GUIDE = gql`
  mutation UpdateGuide($id: ID!, $input: GuideInput!) {
    updateGuide(id: $id, input: $input) {
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

export const DELETE_GUIDE = gql`
  mutation DeleteGuide($id: ID!) {
    deleteGuide(id: $id)
  }
`;

// ─── Company Profile Mutations ───────────────────────────────
export const SAVE_COMPANY_PROFILE = gql`
  mutation SaveCompanyProfile($input: CompanyProfileInput!) {
    saveCompanyProfile(input: $input) {
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
      updatedAt
    }
  }
`;

export const UPDATE_COMPANY_PROFILE = gql`
  mutation UpdateCompanyProfile($input: UpdateCompanyProfileInput!) {
    updateCompanyProfile(input: $input) {
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
      updatedAt
    }
  }
`;

// ─── Contact Inquiry Mutations ───────────────────────
export const CREATE_CONTACT_INQUIRY = gql`
  mutation CreateContactInquiry($input: CreateContactInput!) {
    createContactInquiry(input: $input) {
      _id
      name
      email
      phone
      message
      status
      createdAt
    }
  }
`;

export const UPDATE_CONTACT_STATUS = gql`
  mutation UpdateContactStatus($id: ID!, $status: String!) {
    updateContactStatus(id: $id, status: $status) {
      _id
      status
      updatedAt
    }
  }
`;

export const DELETE_CONTACT_INQUIRY = gql`
  mutation DeleteContactInquiry($id: ID!) {
    deleteContactInquiry(id: $id)
  }
`;

// ─── Payment Gateways ──────────────────────────────────
export const UPSERT_PAYMENT_GATEWAY = gql`
  mutation UpsertPaymentGateway($input: PaymentGatewayInput!) {
    upsertPaymentGateway(input: $input) {
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

export const DELETE_PAYMENT_GATEWAY = gql`
  mutation DeletePaymentGateway($provider: String!) {
    deletePaymentGateway(provider: $provider)
  }
`;

export const SET_DEFAULT_PAYMENT_GATEWAY = gql`
  mutation SetDefaultPaymentGateway($provider: String!) {
    setDefaultPaymentGateway(provider: $provider)
  }
`;

// ─── Manual UPI payment verification ───────────────────
export const APPROVE_MANUAL_PAYMENT = gql`
  mutation ApproveManualPayment($bookingId: ID!, $amountReceived: Float, $note: String) {
    approveManualPayment(bookingId: $bookingId, amountReceived: $amountReceived, note: $note) {
      success
      message
      bookingId
      bookingStatus
      paidAmount
      pendingAmount
      participantLink
    }
  }
`;

export const REJECT_MANUAL_PAYMENT = gql`
  mutation RejectManualPayment($bookingId: ID!, $reason: String!) {
    rejectManualPayment(bookingId: $bookingId, reason: $reason) {
      success
      message
      bookingId
      bookingStatus
    }
  }
`;

// ─── Integrations ──────────────────────────────────────
export const UPSERT_INTEGRATION = gql`
  mutation UpsertIntegration(
    $provider: String!
    $credentials: JSON
    $meta: JSON
    $enabled: Boolean
  ) {
    upsertIntegration(provider: $provider, credentials: $credentials, meta: $meta, enabled: $enabled) {
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

export const DELETE_INTEGRATION = gql`
  mutation DeleteIntegration($provider: String!) {
    deleteIntegration(provider: $provider)
  }
`;

export const TEST_INTEGRATION = gql`
  mutation TestIntegration($provider: String!) {
    testIntegration(provider: $provider) {
      success
      message
    }
  }
`;

// ─── Follow-up Rules ───────────────────────────────────
export const SAVE_FOLLOW_UP_RULE = gql`
  mutation SaveFollowUpRule($id: ID, $input: FollowUpRuleInput!) {
    saveFollowUpRule(id: $id, input: $input) {
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

export const DELETE_FOLLOW_UP_RULE = gql`
  mutation DeleteFollowUpRule($id: ID!) {
    deleteFollowUpRule(id: $id)
  }
`;

export const SET_FOLLOW_UP_RULE_ENABLED = gql`
  mutation SetFollowUpRuleEnabled($id: ID!, $enabled: Boolean!) {
    setFollowUpRuleEnabled(id: $id, enabled: $enabled) {
      _id
      enabled
    }
  }
`;

// ─── Coupon mutations ────────────────────────────────────────────────────────
export const CREATE_COUPON = gql`
  mutation CreateCoupon($input: CouponInput!) {
    createCoupon(input: $input) {
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
    }
  }
`;

export const UPDATE_COUPON = gql`
  mutation UpdateCoupon($id: ID!, $input: CouponInput!) {
    updateCoupon(id: $id, input: $input) {
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
      updatedAt
    }
  }
`;

export const DELETE_COUPON = gql`
  mutation DeleteCoupon($id: ID!) {
    deleteCoupon(id: $id)
  }
`;

export const TOGGLE_COUPON = gql`
  mutation ToggleCoupon($id: ID!) {
    toggleCoupon(id: $id) {
      _id
      code
      isActive
      isPublic
    }
  }
`;

// ─── Waitlist Mutations ──────────────────────────────
export const REMOVE_FROM_WAITLIST = gql`
  mutation RemoveFromWaitlist($departureId: ID!, $phone: String!) {
    removeFromWaitlist(departureId: $departureId, phone: $phone)
  }
`;

// ─── Referral Mutations ──────────────────────────────
export const UPDATE_REFERRAL = gql`
  mutation UpdateReferral($id: ID!, $input: UpdateReferralInput!) {
    updateReferral(id: $id, input: $input) {
      _id
      discountAmount
      maxUses
      active
    }
  }
`;

export const UPDATE_REFERRAL_SETTINGS = gql`
  mutation UpdateReferralSettings($input: ReferralSettingsInput!) {
    updateReferralSettings(input: $input)
  }
`;

// ─── Reviews (moderation) ──────────────────────────────
export const SET_REVIEW_STATUS = gql`
  mutation SetReviewStatus($id: ID!, $status: String!) {
    setReviewStatus(id: $id, status: $status) {
      _id
      status
    }
  }
`;

// ─── Fill Nudge Mutations ──────────────────────────────
export const TRIGGER_FILL_NUDGE = gql`
  mutation TriggerFillNudge($departureId: ID!) {
    triggerFillNudge(departureId: $departureId)
  }
`;
