// Questions and answers for the homepage FAQ, one group for renters and one
// for owners. Edit the text here; the page renders them in this order. Keep
// answers short and true: renters never pay RentLoop (SRS 1.3), RentLoop never
// holds rental money (2.4), and the booking fee is 0% during the launch (3.1).

export type Faq = { question: string; answer: string };

export const RENTER_FAQ: Faq[] = [
  {
    question: "Do I pay anything to rent?",
    answer:
      "No. Sending a request is free and renters never pay RentLoop. You pay the rent and the deposit to the owner, usually when you collect.",
  },
  {
    question: "Why can't I see the owner's number yet?",
    answer:
      "Names, phone numbers and the collection address stay private until the owner accepts your request. Then you both see each other's details.",
  },
  {
    question: "What if several people want the same item?",
    answer:
      "Everyone can send a request. The owner picks one and accepts it; the others hear the dates are taken, and their details are never shown.",
  },
  {
    question: "What happens with the deposit?",
    answer:
      "You pay it to the owner when you collect and get it back when you return the item as you got it. The owner records the count and condition at handover and you confirm it, so there's a record if something is damaged or missing.",
  },
];

export const OWNER_FAQ: Faq[] = [
  {
    question: "Is it free to list?",
    answer:
      "Yes. Listing is free on the Free plan, with no monthly fee and no card needed. Pro and Business plans add more items, staff and reports for a yearly price.",
  },
  {
    question: "Do you take a cut of my rental money?",
    answer:
      "No. Renters pay you directly by cash, EFT, eWallet or card, and the app only records what was paid. We never hold your rental money.",
  },
  {
    question: "How does RentLoop make money?",
    answer:
      "From optional yearly plans, and from a booking fee owners pay when they accept a renter from the marketplace. The fee depends on your plan and is 0% during the launch.",
  },
  {
    question: "Can my hire business use it?",
    answer:
      "Yes. Add your business name and logo, invite staff, send quotes on WhatsApp, and keep stock, bookings, deposits and checkout records in one place.",
  },
  {
    question: "Which towns can I rent in?",
    answer: "Windhoek and Erongo (Swakopmund and Walvis Bay) first, with more towns after the launch. Prices are in N$.",
  },
];
