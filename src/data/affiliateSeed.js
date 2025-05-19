const affiliateSeed = [
  {
    name: 'Park City Hostel',
    code: 'PCH',
    description: 'Park City Hostel affiliate partner',
    companyName: 'Park City Hostel',
    companyEmail: 'contact@parkcityhostel.com',
    commissionPercentage: 15,
    isActive: true,
    redirectPath: '/booking-time',
    defaultPickupLocation: {
      address: 'Salt Lake City International Airport, Salt Lake City, UT, USA',
      coordinates: { lat: 40.7899, lng: -111.9791 },
      isCustom: false,
      isCottonwood: false,
    },
    defaultDropoffLocation: {
      address: 'Park City Hostel, Park City, UT, USA',
      coordinates: { lat: 40.6609, lng: -111.4988 },
      isCustom: false,
      isCottonwood: false,
    },
    preferredService: 'per-person',
    trackingData: {
      visits: 0,
      bookings: 0,
      totalRevenue: 0,
    },
  },
  {
    name: 'Sample Hotel',
    code: 'HOTEL1',
    description: 'Sample Hotel affiliate partner',
    companyName: 'Sample Hotel Company',
    companyEmail: 'partners@samplehotel.com',
    commissionPercentage: 10,
    isActive: true,
    redirectPath: '/booking-time',
    defaultPickupLocation: {
      address: 'Salt Lake City International Airport, Salt Lake City, UT, USA',
      coordinates: { lat: 40.7899, lng: -111.9791 },
      isCustom: false,
      isCottonwood: false,
    },
    defaultDropoffLocation: null,
    preferredService: null,
    trackingData: {
      visits: 0,
      bookings: 0,
      totalRevenue: 0,
    },
  },
];

module.exports = affiliateSeed;