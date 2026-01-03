// Supabase Edge Function: stripe-webhook
// Reçoit les événements de Stripe (paiement réussi, échoué, etc.)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.11.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") as string;

// Supabase client avec service role pour RLS bypass
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    // Vérifier la signature du webhook (en production)
    if (endpointSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
      } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      // Mode développement - pas de vérification de signature
      event = JSON.parse(body);
    }

    console.log("Received Stripe event:", event.type);

    // Gérer les différents événements
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(paymentIntent);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      case "invoice.paid": {
        // Pour les abonnements
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

// Gérer un checkout complété
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("Processing checkout session:", session.id);

  // Récupérer les line items
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

  // Préparer les données de commande
  const orderData = {
    stripe_session_id: session.id,
    stripe_payment_intent_id: session.payment_intent as string,
    customer_email: session.customer_email || session.customer_details?.email,
    customer_name: session.customer_details?.name || session.metadata?.customerName,
    customer_phone: session.customer_details?.phone || session.metadata?.customerPhone,
    company: session.metadata?.company,
    billing_address: session.customer_details?.address ? {
      line1: session.customer_details.address.line1,
      line2: session.customer_details.address.line2,
      city: session.customer_details.address.city,
      postal_code: session.customer_details.address.postal_code,
      country: session.customer_details.address.country,
    } : null,
    items: lineItems.data.map(item => ({
      name: item.description,
      quantity: item.quantity,
      price: item.amount_total / 100,
      currency: item.currency,
    })),
    subtotal: (session.amount_subtotal || 0) / 100,
    tax: (session.total_details?.amount_tax || 0) / 100,
    discount: (session.total_details?.amount_discount || 0) / 100,
    total: (session.amount_total || 0) / 100,
    currency: session.currency,
    status: session.payment_status === "paid" ? "paid" : "pending",
    payment_method: session.payment_method_types?.[0] || "card",
    metadata: session.metadata,
    paid_at: session.payment_status === "paid" ? new Date().toISOString() : null,
  };

  // Chercher l'utilisateur par email
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const user = users?.users?.find(u => u.email === orderData.customer_email);
  
  if (user) {
    (orderData as any).user_id = user.id;
  }

  // Sauvegarder dans Supabase
  const { data, error } = await supabaseAdmin
    .from("orders")
    .upsert(orderData, { onConflict: "stripe_session_id" })
    .select()
    .single();

  if (error) {
    console.error("Error saving order:", error);
    throw error;
  }

  console.log("Order saved successfully:", data.id);
}

// Gérer un paiement réussi
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log("Payment succeeded:", paymentIntent.id);

  // Mettre à jour la commande existante
  const { error } = await supabaseAdmin
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("stripe_payment_intent_id", paymentIntent.id);

  if (error) {
    console.error("Error updating order:", error);
  }
}

// Gérer un paiement échoué
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log("Payment failed:", paymentIntent.id);

  const { error } = await supabaseAdmin
    .from("orders")
    .update({ status: "failed" })
    .eq("stripe_payment_intent_id", paymentIntent.id);

  if (error) {
    console.error("Error updating order:", error);
  }
}

// Gérer une facture payée (abonnements)
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log("Invoice paid:", invoice.id);

  const orderData = {
    stripe_session_id: `invoice_${invoice.id}`,
    stripe_payment_intent_id: invoice.payment_intent as string,
    customer_email: invoice.customer_email,
    items: invoice.lines.data.map(item => ({
      name: item.description,
      quantity: item.quantity,
      price: item.amount / 100,
    })),
    subtotal: invoice.subtotal / 100,
    tax: invoice.tax || 0,
    total: invoice.total / 100,
    currency: invoice.currency,
    status: "paid",
    payment_method: "card",
    paid_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from("orders")
    .upsert(orderData, { onConflict: "stripe_session_id" });

  if (error) {
    console.error("Error saving invoice order:", error);
  }
}
