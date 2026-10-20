// Questions and answers for the homepage FAQ. Edit the text here; the page
// renders them in this order. Keep answers short and true to what the app
// does today (see README.md). The platform never holds rental money.

export type Faq = { question: string; answer: string };

export const FAQ: Faq[] = [
  {
    question: "Is it free to start?",
    answer:
      "Yes. The Free plan costs nothing for as long as you use it, and you don't need a card to sign up. See Plans for what each plan includes, and move to Pro or Business when you outgrow Free.",
  },
  {
    question: "Do you take a cut of my rental money?",
    answer:
      "No. Your customers pay you directly by cash, EFT, eWallet or card, and the app only records what was paid. We never hold your rental money. The only thing you pay us is a plan, if you choose a paid one. When the public marketplace opens later, bookings that come through it will carry a booking fee that depends on your plan (see Plans).",
  },
  {
    question: "How do my customers book?",
    answer:
      "You add the booking for them when they phone, walk in or message you. Or send a quote on WhatsApp: they open the link without an account, see each item's photo, the total, the deposit and your terms, and tap Accept. That turns the quote into a booking request for you to confirm.",
  },
  {
    question: "Does it work on my phone?",
    answer:
      "Yes. It was built for phones first, with large buttons, and you can take condition photos with your camera when items go out and come back. It works on a computer too.",
  },
  {
    question: "Can it stop double bookings?",
    answer:
      "Yes. Before you accept a booking you see how many of each item are free for those dates. The system refuses a booking that would leave you short on any day, even if two staff accept at the same moment. Requests don't hold stock until you accept them.",
  },
  {
    question: "What about deposits and damaged items?",
    answer:
      "Record deposits received, returned or kept, with a reason when you keep one. When items come back, count how many are fine, damaged or missing. Your customer sees these records on their booking link and can confirm them or say what's wrong.",
  },
  {
    question: "Can I rent out packages like \"Wedding 100\"?",
    answer:
      "Yes. Group items you rent together, like a tent with 100 chairs and 10 tables, and give the package one price per day. Stock is still checked item by item, so a package can't be booked if one of its items is out.",
  },
  {
    question: "How do I pay for a plan?",
    answer:
      "By bank deposit or eWallet. Upload your proof of payment in the app; once we've checked it, your plan runs for 12 months and you get an invoice. If you don't renew, you go back to Free and keep all your data.",
  },
  {
    question: "Is my data safe?",
    answer:
      "Each business can only see its own items, bookings and customers, and the database enforces that, not just the screens. Customers only see their own quote or booking, through its link. Handover photos and payment proofs are private; item photos are public so they can appear on your quotes.",
  },
  {
    question: "Which towns does it work in?",
    answer:
      "Anywhere in Namibia. You choose the towns you serve when you set up your business. Prices are in N$ and dates follow Namibian time.",
  },
];
