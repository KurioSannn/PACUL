import {
  DEMO_BATCH_IDS,
  DEMO_NEGOTIATION_THREAD_IDS,
  DEMO_ORDER_IDS,
  DEMO_TRANSACTION_ID,
} from './demo-seed.constants';
import {
  assertDemoSeedEnabled,
  createSeedSupabase,
  getDemoUser,
  insertIfNotExists,
} from './demo-seed.utils';

export async function seedOrdersNegotiation(): Promise<void> {
  assertDemoSeedEnabled();

  const supabase = createSeedSupabase();
  const collector1 = getDemoUser('collector1');
  const industry1 = getDemoUser('industry1');
  const industry2 = getDemoUser('industry2');
  let inserted = 0;

  const completedOrderResult = await insertIfNotExists(
    supabase,
    'orders',
    { id: DEMO_ORDER_IDS.metalCompleted },
    {
      id: DEMO_ORDER_IDS.metalCompleted,
      industry_id: industry1.id,
      collector_id: collector1.id,
      batch_id: DEMO_BATCH_IDS.metalSold,
      requested_weight_kg: 14.5,
      final_weight_kg: 14.5,
      offered_price_per_kg: 4000,
      final_price_per_kg: 4100,
      total_amount: 59450,
      status: 'completed',
      notes: 'Order demo kaleng aluminium — deal selesai.',
      accepted_at: '2026-06-19T10:00:00.000Z',
      rejected_at: null,
      cancelled_at: null,
      completed_at: '2026-06-20T15:00:00.000Z',
      cancel_reason: null,
    },
  );

  if (completedOrderResult === 'inserted') {
    inserted += 1;
  }

  const negotiatingOrderResult = await insertIfNotExists(
    supabase,
    'orders',
    { id: DEMO_ORDER_IDS.petNegotiating },
    {
      id: DEMO_ORDER_IDS.petNegotiating,
      industry_id: industry2.id,
      collector_id: collector1.id,
      batch_id: DEMO_BATCH_IDS.petAvailable,
      requested_weight_kg: 10,
      final_weight_kg: null,
      offered_price_per_kg: 2500,
      final_price_per_kg: null,
      total_amount: null,
      status: 'negotiating',
      notes: 'Order demo PET — masih negosiasi harga.',
      accepted_at: null,
      rejected_at: null,
      cancelled_at: null,
      completed_at: null,
      cancel_reason: null,
    },
  );

  if (negotiatingOrderResult === 'inserted') {
    inserted += 1;
  }

  const completedThreadResult = await insertIfNotExists(
    supabase,
    'negotiation_threads',
    { id: DEMO_NEGOTIATION_THREAD_IDS.metalCompleted },
    {
      id: DEMO_NEGOTIATION_THREAD_IDS.metalCompleted,
      order_id: DEMO_ORDER_IDS.metalCompleted,
      industry_id: industry1.id,
      collector_id: collector1.id,
      status: 'accepted',
      last_offer_by: collector1.id,
      last_offer_price_per_kg: 4100,
      last_offer_weight_kg: 14.5,
      agreed_price_per_kg: 4100,
      agreed_weight_kg: 14.5,
      expires_at: '2026-06-25T23:59:59.000Z',
    },
  );

  if (completedThreadResult === 'inserted') {
    inserted += 1;
  }

  const negotiatingThreadResult = await insertIfNotExists(
    supabase,
    'negotiation_threads',
    { id: DEMO_NEGOTIATION_THREAD_IDS.petNegotiating },
    {
      id: DEMO_NEGOTIATION_THREAD_IDS.petNegotiating,
      order_id: DEMO_ORDER_IDS.petNegotiating,
      industry_id: industry2.id,
      collector_id: collector1.id,
      status: 'countered',
      last_offer_by: collector1.id,
      last_offer_price_per_kg: 2650,
      last_offer_weight_kg: 10,
      agreed_price_per_kg: null,
      agreed_weight_kg: null,
      expires_at: '2026-06-30T23:59:59.000Z',
    },
  );

  if (negotiatingThreadResult === 'inserted') {
    inserted += 1;
  }

  const completedMessages = [
    {
      senderId: industry1.id,
      messageType: 'offer',
      content: 'Kami tawar Rp 4.000/kg untuk 14,5 kg kaleng.',
      offerPrice: 4000,
      offerWeight: 14.5,
      createdAt: '2026-06-18T14:00:00.000Z',
    },
    {
      senderId: collector1.id,
      messageType: 'counter_offer',
      content: 'Bisa naik ke Rp 4.100/kg karena sudah disortir bersih.',
      offerPrice: 4100,
      offerWeight: 14.5,
      createdAt: '2026-06-19T09:30:00.000Z',
    },
    {
      senderId: industry1.id,
      messageType: 'accepted',
      content: 'Deal diterima di Rp 4.100/kg.',
      offerPrice: 4100,
      offerWeight: 14.5,
      createdAt: '2026-06-19T10:00:00.000Z',
    },
  ] as const;

  for (const [index, message] of completedMessages.entries()) {
    const result = await insertIfNotExists(
      supabase,
      'negotiation_messages',
      {
        thread_id: DEMO_NEGOTIATION_THREAD_IDS.metalCompleted,
        sender_id: message.senderId,
        message_type: message.messageType,
        created_at: message.createdAt,
      },
      {
        thread_id: DEMO_NEGOTIATION_THREAD_IDS.metalCompleted,
        sender_id: message.senderId,
        message_type: message.messageType,
        content: message.content,
        offer_price_per_kg: message.offerPrice,
        offer_weight_kg: message.offerWeight,
        metadata: { seed_index: index },
        created_at: message.createdAt,
      },
    );

    if (result === 'inserted') {
      inserted += 1;
    }
  }

  const negotiatingMessages = [
    {
      senderId: industry2.id,
      messageType: 'offer',
      content: 'Tawaran awal Rp 2.500/kg untuk 10 kg PET.',
      offerPrice: 2500,
      offerWeight: 10,
      createdAt: '2026-06-21T11:00:00.000Z',
    },
    {
      senderId: collector1.id,
      messageType: 'counter_offer',
      content: 'Counter Rp 2.650/kg — botol sudah bersih.',
      offerPrice: 2650,
      offerWeight: 10,
      createdAt: '2026-06-21T15:30:00.000Z',
    },
  ] as const;

  for (const [index, message] of negotiatingMessages.entries()) {
    const result = await insertIfNotExists(
      supabase,
      'negotiation_messages',
      {
        thread_id: DEMO_NEGOTIATION_THREAD_IDS.petNegotiating,
        sender_id: message.senderId,
        message_type: message.messageType,
        created_at: message.createdAt,
      },
      {
        thread_id: DEMO_NEGOTIATION_THREAD_IDS.petNegotiating,
        sender_id: message.senderId,
        message_type: message.messageType,
        content: message.content,
        offer_price_per_kg: message.offerPrice,
        offer_weight_kg: message.offerWeight,
        metadata: { seed_index: index },
        created_at: message.createdAt,
      },
    );

    if (result === 'inserted') {
      inserted += 1;
    }
  }

  const completedOffers = [
    {
      offeredBy: industry1.id,
      price: 4000,
      weight: 14.5,
      status: 'countered',
      createdAt: '2026-06-18T14:00:00.000Z',
    },
    {
      offeredBy: collector1.id,
      price: 4100,
      weight: 14.5,
      status: 'accepted',
      createdAt: '2026-06-19T09:30:00.000Z',
    },
  ] as const;

  for (const offer of completedOffers) {
    const result = await insertIfNotExists(
      supabase,
      'negotiation_offers',
      {
        thread_id: DEMO_NEGOTIATION_THREAD_IDS.metalCompleted,
        offered_by: offer.offeredBy,
        price_per_kg: offer.price,
        created_at: offer.createdAt,
      },
      {
        thread_id: DEMO_NEGOTIATION_THREAD_IDS.metalCompleted,
        message_id: null,
        offered_by: offer.offeredBy,
        price_per_kg: offer.price,
        weight_kg: offer.weight,
        status: offer.status,
        created_at: offer.createdAt,
      },
    );

    if (result === 'inserted') {
      inserted += 1;
    }
  }

  const negotiatingOfferResult = await insertIfNotExists(
    supabase,
    'negotiation_offers',
    {
      thread_id: DEMO_NEGOTIATION_THREAD_IDS.petNegotiating,
      offered_by: collector1.id,
      price_per_kg: 2650,
      created_at: '2026-06-21T15:30:00.000Z',
    },
    {
      thread_id: DEMO_NEGOTIATION_THREAD_IDS.petNegotiating,
      message_id: null,
      offered_by: collector1.id,
      price_per_kg: 2650,
      weight_kg: 10,
      status: 'pending',
      created_at: '2026-06-21T15:30:00.000Z',
    },
  );

  if (negotiatingOfferResult === 'inserted') {
    inserted += 1;
  }

  const transactionResult = await insertIfNotExists(
    supabase,
    'transactions',
    { id: DEMO_TRANSACTION_ID },
    {
      id: DEMO_TRANSACTION_ID,
      order_id: DEMO_ORDER_IDS.metalCompleted,
      industry_id: industry1.id,
      collector_id: collector1.id,
      batch_id: DEMO_BATCH_IDS.metalSold,
      amount: 59450,
      status: 'completed',
      payment_method: 'simulation',
      payment_reference: 'DEMO-TXN-20260620-001',
      notes: 'Simulated payment for hackathon demo.',
      simulated_at: '2026-06-20T14:30:00.000Z',
      completed_at: '2026-06-20T15:00:00.000Z',
      cancelled_at: null,
    },
  );

  if (transactionResult === 'inserted') {
    inserted += 1;
  }

  console.log(`Orders and negotiation ready (inserted ${inserted} new rows).`);
}
