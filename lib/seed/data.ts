import {
  CUSTOMER_IDS,
  ORDER_IDS,
  ORDER_ITEM_IDS,
  PRODUCT_IDS,
  SELLER_IDS,
  SUPPORT_USER_ID,
  TICKET_IDS,
  TICKET_MESSAGE_IDS,
} from "@/lib/seed/ids";

export const seedSellers = [
  {
    id: SELLER_IDS.sam,
    name: "Sam Seller",
    emailId: "sam@sellers.example",
  },
  {
    id: SELLER_IDS.rita,
    name: "Rita Retail",
    emailId: "rita@sellers.example",
  },
] as const;

export const seedCustomers = [
  {
    id: CUSTOMER_IDS.ava,
    name: "Ava Customer",
    emailId: "ava@customers.example",
  },
  {
    id: CUSTOMER_IDS.ben,
    name: "Ben Buyer",
    emailId: "ben@customers.example",
  },
] as const;

export const seedSupportUsers = [
  {
    id: SUPPORT_USER_ID,
    name: "Casey Support",
  },
] as const;

export const seedProducts = [
  {
    id: PRODUCT_IDS.tote,
    sellerId: SELLER_IDS.sam,
    name: "Canvas Tote",
    category: "bags",
    quantity: 24,
    metadata: { color: "olive" },
  },
  {
    id: PRODUCT_IDS.mug,
    sellerId: SELLER_IDS.sam,
    name: "Stoneware Mug",
    category: "kitchen",
    quantity: 40,
    metadata: { capacityMl: 350 },
  },
  {
    id: PRODUCT_IDS.lamp,
    sellerId: SELLER_IDS.sam,
    name: "Desk Lamp",
    category: "home",
    quantity: 12,
    metadata: { finish: "brass" },
  },
  {
    id: PRODUCT_IDS.notebook,
    sellerId: SELLER_IDS.sam,
    name: "Linen Notebook",
    category: "stationery",
    quantity: 60,
    metadata: { pages: 192 },
  },
  {
    id: PRODUCT_IDS.plant,
    sellerId: SELLER_IDS.sam,
    name: "Potted Fern",
    category: "plants",
    quantity: 18,
    metadata: { potSize: "medium" },
  },
  {
    id: PRODUCT_IDS.scarf,
    sellerId: SELLER_IDS.rita,
    name: "Wool Scarf",
    category: "apparel",
    quantity: 30,
    metadata: { color: "indigo" },
  },
  {
    id: PRODUCT_IDS.candle,
    sellerId: SELLER_IDS.rita,
    name: "Soy Candle",
    category: "home",
    quantity: 50,
    metadata: { scent: "cedar" },
  },
  {
    id: PRODUCT_IDS.tray,
    sellerId: SELLER_IDS.rita,
    name: "Serving Tray",
    category: "kitchen",
    quantity: 22,
    metadata: { material: "oak" },
  },
  {
    id: PRODUCT_IDS.vase,
    sellerId: SELLER_IDS.rita,
    name: "Ceramic Vase",
    category: "home",
    quantity: 16,
    metadata: { glaze: "matte white" },
  },
] as const;

export const seedOrders = [
  {
    id: ORDER_IDS.ava1,
    customerId: CUSTOMER_IDS.ava,
    date: "2026-08-12",
    totalCost: "42.00",
    status: "shipped" as const,
  },
  {
    id: ORDER_IDS.ava2,
    customerId: CUSTOMER_IDS.ava,
    date: "2026-08-20",
    totalCost: "68.50",
    status: "processing" as const,
  },
  {
    id: ORDER_IDS.ava3,
    customerId: CUSTOMER_IDS.ava,
    date: "2026-09-01",
    totalCost: "24.00",
    status: "delivered" as const,
  },
  {
    id: ORDER_IDS.ben1,
    customerId: CUSTOMER_IDS.ben,
    date: "2026-08-05",
    totalCost: "55.00",
    status: "delivered" as const,
  },
  {
    id: ORDER_IDS.ben2,
    customerId: CUSTOMER_IDS.ben,
    date: "2026-08-18",
    totalCost: "18.00",
    status: "confirmed" as const,
  },
  {
    id: ORDER_IDS.ben3,
    customerId: CUSTOMER_IDS.ben,
    date: "2026-08-28",
    totalCost: "79.00",
    status: "shipped" as const,
  },
  {
    id: ORDER_IDS.ben4,
    customerId: CUSTOMER_IDS.ben,
    date: "2026-09-03",
    totalCost: "36.00",
    status: "processing" as const,
  },
] as const;

export const seedOrderItems = [
  {
    id: ORDER_ITEM_IDS.ava1a,
    orderId: ORDER_IDS.ava1,
    itemName: "Canvas Tote",
    price: "42.00",
    quantity: 1,
  },
  {
    id: ORDER_ITEM_IDS.ava2a,
    orderId: ORDER_IDS.ava2,
    itemName: "Stoneware Mug",
    price: "18.50",
    quantity: 2,
  },
  {
    id: ORDER_ITEM_IDS.ava2b,
    orderId: ORDER_IDS.ava2,
    itemName: "Linen Notebook",
    price: "31.50",
    quantity: 1,
  },
  {
    id: ORDER_ITEM_IDS.ava3a,
    orderId: ORDER_IDS.ava3,
    itemName: "Soy Candle",
    price: "24.00",
    quantity: 1,
  },
  {
    id: ORDER_ITEM_IDS.ben1a,
    orderId: ORDER_IDS.ben1,
    itemName: "Wool Scarf",
    price: "55.00",
    quantity: 1,
  },
  {
    id: ORDER_ITEM_IDS.ben2a,
    orderId: ORDER_IDS.ben2,
    itemName: "Soy Candle",
    price: "18.00",
    quantity: 1,
  },
  {
    id: ORDER_ITEM_IDS.ben3a,
    orderId: ORDER_IDS.ben3,
    itemName: "Desk Lamp",
    price: "64.00",
    quantity: 1,
  },
  {
    id: ORDER_ITEM_IDS.ben3b,
    orderId: ORDER_IDS.ben3,
    itemName: "Serving Tray",
    price: "15.00",
    quantity: 1,
  },
  {
    id: ORDER_ITEM_IDS.ben4a,
    orderId: ORDER_IDS.ben4,
    itemName: "Ceramic Vase",
    price: "36.00",
    quantity: 1,
  },
] as const;

export const seedTickets = [
  {
    id: TICKET_IDS.avaMissing,
    customerId: CUSTOMER_IDS.ava,
    orderId: ORDER_IDS.ava1,
    status: "in-progress" as const,
  },
  {
    id: TICKET_IDS.avaLate,
    customerId: CUSTOMER_IDS.ava,
    orderId: ORDER_IDS.ava2,
    status: "open" as const,
  },
  {
    id: TICKET_IDS.benWrong,
    customerId: CUSTOMER_IDS.ben,
    orderId: ORDER_IDS.ben1,
    status: "in-progress" as const,
  },
  {
    id: TICKET_IDS.benDamaged,
    customerId: CUSTOMER_IDS.ben,
    orderId: ORDER_IDS.ben3,
    status: "open" as const,
  },
  {
    id: TICKET_IDS.benRefund,
    customerId: CUSTOMER_IDS.ben,
    orderId: ORDER_IDS.ben2,
    status: "resolved" as const,
  },
] as const;

export const seedTicketMessages = [
  {
    id: TICKET_MESSAGE_IDS.avaMissing1,
    ticketId: TICKET_IDS.avaMissing,
    from: "customer" as const,
    body: "My tote never arrived.",
  },
  {
    id: TICKET_MESSAGE_IDS.avaMissing2,
    ticketId: TICKET_IDS.avaMissing,
    from: "support" as const,
    body: "Looking into the shipment now.",
  },
  {
    id: TICKET_MESSAGE_IDS.avaLate1,
    ticketId: TICKET_IDS.avaLate,
    from: "customer" as const,
    body: "This order is taking longer than expected.",
  },
  {
    id: TICKET_MESSAGE_IDS.benWrong1,
    ticketId: TICKET_IDS.benWrong,
    from: "customer" as const,
    body: "I received the wrong scarf color.",
  },
  {
    id: TICKET_MESSAGE_IDS.benWrong2,
    ticketId: TICKET_IDS.benWrong,
    from: "support" as const,
    body: "Sorry about that — we can arrange an exchange.",
  },
  {
    id: TICKET_MESSAGE_IDS.benDamaged1,
    ticketId: TICKET_IDS.benDamaged,
    from: "customer" as const,
    body: "The lamp shade arrived cracked.",
  },
  {
    id: TICKET_MESSAGE_IDS.benRefund1,
    ticketId: TICKET_IDS.benRefund,
    from: "customer" as const,
    body: "Please refund the candle; I no longer need it.",
  },
  {
    id: TICKET_MESSAGE_IDS.benRefund2,
    ticketId: TICKET_IDS.benRefund,
    from: "support" as const,
    body: "Refund issued. Thanks for your patience.",
  },
] as const;
