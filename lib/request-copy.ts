export const requestCopy = {
  vi: {
    title: "Đặt theo nhu cầu",
    summary: "Chọn dịch vụ, chuyên viên phù hợp sẽ nhận.",
    goalPrompt: "Bạn muốn làm gì?",
    noArtist: "Bạn không cần chọn chuyên viên. Người phù hợp nhận trước sẽ làm.",
    privacy: "Chỉ ghi yêu cầu về dịch vụ. Địa chỉ cụ thể và liên hệ được chia sẻ sau khi chuyên viên nhận.",
    bridal: "Makeup cô dâu",
    nails: "Làm nail",
    party: "Makeup dự tiệc",
    board: "Đơn khách đang cần",
    boardHint: "Xem gói, giờ và khu vực. Ai nhận trước được việc.",
  },
  en: {
    title: "Book by service",
    summary: "Choose a service and an eligible professional can accept.",
    goalPrompt: "What would you like to book?",
    noArtist: "You can skip choosing a professional. The first eligible professional to accept gets the booking.",
    privacy: "Describe the service only. Your exact address and contact details are shared after a professional accepts.",
    bridal: "Bridal makeup",
    nails: "Nails",
    party: "Event makeup",
    board: "Open customer requests",
    boardHint: "See the service, time and area. The first professional to accept gets the booking.",
  },
} as const satisfies Record<string, Record<string, string>>

export type RequestLocale = keyof typeof requestCopy
