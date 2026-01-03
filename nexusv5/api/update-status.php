<?php
/**
 * API - Update Customer Status
 * 
 * Met à jour le statut d'un customer après le paiement Stripe
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit();
}

define('NEXUS_APP', true);
require_once __DIR__ . '/../database/config.php';

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (empty($data['customerId']) || empty($data['status'])) {
        throw new Exception('customerId et status requis');
    }
    
    $customerId = (int)$data['customerId'];
    $status = $data['status'];
    $stripeSessionId = $data['stripeSessionId'] ?? null;
    
    // Valider le statut
    $validStatuses = ['pending', 'paid', 'cancelled', 'refunded'];
    if (!in_array($status, $validStatuses)) {
        throw new Exception('Statut invalide');
    }
    
    // Mettre à jour
    $sql = "UPDATE customer_info SET status = :status";
    $params = ['status' => $status, 'id' => $customerId];
    
    if ($stripeSessionId) {
        $sql .= ", stripe_session_id = :stripe_session_id";
        $params['stripe_session_id'] = $stripeSessionId;
    }
    
    $sql .= " WHERE id = :id";
    
    $rows = Database::execute($sql, $params);
    
    if ($rows === 0) {
        throw new Exception('Client non trouvé');
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Statut mis à jour'
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
