<?php
/**
 * API - Save Customer Info
 * 
 * Endpoint pour sauvegarder les informations client lors du checkout
 * Stocke les données dans la table customer_info avant redirection Stripe
 */

// Origines autorisées (ajoutez votre domaine de production)
$allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://votre-domaine.com' // Remplacez par votre domaine
];

// Récupérer l'origine de la requête
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

// Vérifier si l'origine est autorisée
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // En développement local sans origine, autoriser
    if (empty($origin) && (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false || strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false)) {
        header('Access-Control-Allow-Origin: *');
    }
}

// Headers CORS et JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Max-Age: 86400'); // Cache preflight 24h

// Gérer les requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit();
}

// Définir la constante pour autoriser l'accès au config
define('NEXUS_APP', true);

// Inclure la configuration de la base de données
require_once __DIR__ . '/../database/config.php';

try {
    // Récupérer les données JSON
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        throw new Exception('Données invalides');
    }
    
    // Valider les champs requis
    $required = ['customer', 'billing'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            throw new Exception("Champ requis manquant: {$field}");
        }
    }
    
    // Extraire les données
    $customer = $data['customer'];
    $billing = $data['billing'];
    
    // Préparer les données pour l'insertion
    $insertData = [
        'first_name' => trim($customer['firstName'] ?? ''),
        'last_name' => trim($customer['lastName'] ?? ''),
        'email' => trim($customer['email'] ?? ''),
        'phone' => trim($customer['phone'] ?? ''),
        'company' => trim($customer['company'] ?? ''),
        'address' => trim($billing['address'] ?? ''),
        'postal_code' => trim($billing['postalCode'] ?? ''),
        'city' => trim($billing['city'] ?? ''),
        'country' => trim($billing['country'] ?? 'FR'),
        'project_details' => trim($data['projectDetails'] ?? ''),
        'newsletter' => !empty($data['newsletter']) ? 1 : 0,
        'payment_method' => trim($data['payment']['method'] ?? 'card'),
        'order_items' => json_encode($data['items'] ?? []),
        'subtotal' => floatval($data['subtotal'] ?? 0),
        'discount' => floatval($data['discount'] ?? 0),
        'tax' => floatval($data['tax'] ?? 0),
        'total' => floatval($data['total'] ?? 0),
        'promo_code' => trim($data['promoCode'] ?? ''),
        'status' => 'pending',
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? '',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? ''
    ];
    
    // Valider l'email
    if (!filter_var($insertData['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Email invalide');
    }
    
    // Valider les champs obligatoires
    if (empty($insertData['first_name']) || empty($insertData['last_name'])) {
        throw new Exception('Prénom et nom sont requis');
    }
    
    if (empty($insertData['address']) || empty($insertData['city']) || empty($insertData['postal_code'])) {
        throw new Exception('Adresse complète requise');
    }
    
    // Insérer en base de données
    $sql = "INSERT INTO customer_info (
        first_name, last_name, email, phone, company,
        address, postal_code, city, country,
        project_details, newsletter, payment_method,
        order_items, subtotal, discount, tax, total,
        promo_code, status, ip_address, user_agent
    ) VALUES (
        :first_name, :last_name, :email, :phone, :company,
        :address, :postal_code, :city, :country,
        :project_details, :newsletter, :payment_method,
        :order_items, :subtotal, :discount, :tax, :total,
        :promo_code, :status, :ip_address, :user_agent
    )";
    
    Database::execute($sql, $insertData);
    $customerId = Database::lastInsertId();
    
    // Réponse de succès
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'customerId' => (int)$customerId,
        'message' => 'Informations client enregistrées'
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
