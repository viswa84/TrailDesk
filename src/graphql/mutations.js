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
export const SAVE_FLOW_CONFIG = gql`
  mutation SaveFlowConfig($input: FlowConfigInput!) {
    saveFlowConfig(input: $input) {
      _id
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

// Keep the old name as alias for backward compatibility
export const LOGIN_MUTATION = LOGIN;

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

export const REGISTER_MUTATION = REGISTER;

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
      description
      difficulty
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
      image
      location
      altitude
      bestSeason
      isActive
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
      }
      capacity
      booked
      itinerary
      thingsToCarry
      contact
      meetingPoint
      whatsappGroupInviteLink
      whatsappGroupName
      guideId
      guideName
      status
      boardingPointIds
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
      packages {
        name
        price
        inclusions
      }
      capacity
      booked
      itinerary
      thingsToCarry
      contact
      meetingPoint
      whatsappGroupInviteLink
      whatsappGroupName
      guideId
      guideName
      status
      boardingPointIds
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
