// Supabase Edge Function: create-checkout-session
// Cette fonction crée une session Stripe Checkout et retourne l'URL de redirection

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.11.0?target=deno";

// Récupérer la clé secrète Stripe depuis les variables d'environnement
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") as string, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

// Headers CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Gérer les requêtes OPTIONS (CORS preflight)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { lineItems, customerEmail, successUrl, cancelUrl, metadata } =
      await req.json();

    // Valider les données
    if (!lineItems || lineItems.length === 0) {
      throw new Error("Aucun produit dans le panier");
    }

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: lineItems.some((item: any) => 
        item.price.includes("recurring") || 
        item.recurring
      ) ? "subscription" : "payment",
      line_items: lineItems,
      customer_email: customerEmail,
      success_url: successUrl || `${req.headers.get("origin")}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/cancel.html`,
      metadata: metadata || {},
      billing_address_collection: "required",
      locale: "fr",
    });

    // Retourner l'URL de redirection
    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erreur Stripe:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
