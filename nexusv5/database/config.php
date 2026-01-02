<?php
/**
 * Nexus Web Shop - Database Configuration
 * 
 * Configuration de connexion à la base de données MySQL/MariaDB
 */

// Empêcher l'accès direct
if (!defined('NEXUS_APP')) {
    die('Accès interdit');
}

// Configuration de la base de données
define('DB_HOST', 'localhost');
define('DB_PORT', 3306);
define('DB_NAME', 'nexus_webshop');
define('DB_USER', 'root');
define('DB_PASS', ''); // À modifier en production !
define('DB_CHARSET', 'utf8mb4');

// Options PDO
define('DB_OPTIONS', [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
]);

/**
 * Classe de connexion à la base de données (Singleton)
 */
class Database {
    private static ?PDO $instance = null;
    
    /**
     * Obtenir l'instance de connexion
     */
    public static function getInstance(): PDO {
        if (self::$instance === null) {
            try {
                $dsn = sprintf(
                    'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                    DB_HOST,
                    DB_PORT,
                    DB_NAME,
                    DB_CHARSET
                );
                
                self::$instance = new PDO($dsn, DB_USER, DB_PASS, DB_OPTIONS);
                
            } catch (PDOException $e) {
                // En production, logger l'erreur et afficher un message générique
                error_log('Database connection failed: ' . $e->getMessage());
                die('Erreur de connexion à la base de données. Veuillez réessayer plus tard.');
            }
        }
        
        return self::$instance;
    }
    
    /**
     * Exécuter une requête SELECT
     */
    public static function query(string $sql, array $params = []): array {
        $stmt = self::getInstance()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
    
    /**
     * Exécuter une requête SELECT et retourner une seule ligne
     */
    public static function queryOne(string $sql, array $params = []): ?array {
        $stmt = self::getInstance()->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetch();
        return $result ?: null;
    }
    
    /**
     * Exécuter une requête INSERT/UPDATE/DELETE
     */
    public static function execute(string $sql, array $params = []): int {
        $stmt = self::getInstance()->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount();
    }
    
    /**
     * Obtenir le dernier ID inséré
     */
    public static function lastInsertId(): string {
        return self::getInstance()->lastInsertId();
    }
    
    /**
     * Démarrer une transaction
     */
    public static function beginTransaction(): bool {
        return self::getInstance()->beginTransaction();
    }
    
    /**
     * Valider une transaction
     */
    public static function commit(): bool {
        return self::getInstance()->commit();
    }
    
    /**
     * Annuler une transaction
     */
    public static function rollback(): bool {
        return self::getInstance()->rollBack();
    }
}

/**
 * Fonctions helper pour les opérations courantes
 */

/**
 * Générer un numéro de commande unique
 */
function generateOrderNumber(): string {
    $prefix = 'CMD';
    $date = date('Ymd');
    $random = strtoupper(substr(uniqid(), -4));
    return "{$prefix}-{$date}-{$random}";
}

/**
 * Générer un numéro de facture unique
 */
function generateInvoiceNumber(): string {
    $prefix = 'NX';
    $year = date('Y');
    
    // Trouver le dernier numéro de l'année
    $sql = "SELECT MAX(CAST(SUBSTRING(invoice_number, 8) AS UNSIGNED)) as last_num 
            FROM invoices 
            WHERE invoice_number LIKE ?";
    $result = Database::queryOne($sql, ["{$prefix}-{$year}-%"]);
    
    $nextNum = ($result['last_num'] ?? 0) + 1;
    return sprintf('%s-%s-%04d', $prefix, $year, $nextNum);
}

/**
 * Hash un mot de passe
 */
function hashPassword(string $password): string {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
}

/**
 * Vérifier un mot de passe
 */
function verifyPassword(string $password, string $hash): bool {
    return password_verify($password, $hash);
}
