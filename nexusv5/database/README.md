# Nexus Web Shop - Base de Données

## Structure

Ce dossier contient les fichiers de configuration et le schéma de la base de données.

## Fichiers

| Fichier | Description |
|---------|-------------|
| `schema.sql` | Schéma complet de la base de données MySQL/MariaDB |
| `config.php` | Configuration PHP et classe de connexion PDO |

## Installation

### 1. Créer la base de données

```bash
# Connexion à MySQL
mysql -u root -p

# Exécuter le schéma
source /chemin/vers/schema.sql
```

Ou via phpMyAdmin :
1. Importer le fichier `schema.sql`
2. Les tables et données initiales seront créées automatiquement

### 2. Configurer la connexion

Modifier `config.php` avec vos identifiants :

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'nexus_webshop');
define('DB_USER', 'votre_utilisateur');
define('DB_PASS', 'votre_mot_de_passe');
```

### 3. Utilisation dans le code

```php
define('NEXUS_APP', true);
require_once 'database/config.php';

// Exemple: récupérer tous les services actifs
$services = Database::query(
    "SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order"
);

// Exemple: créer une nouvelle commande
Database::beginTransaction();
try {
    Database::execute(
        "INSERT INTO orders (user_id, order_number, total_amount) VALUES (?, ?, ?)",
        [$userId, generateOrderNumber(), $total]
    );
    $orderId = Database::lastInsertId();
    Database::commit();
} catch (Exception $e) {
    Database::rollback();
    throw $e;
}
```

## Tables

| Table | Description |
|-------|-------------|
| `users` | Utilisateurs et administrateurs |
| `services` | Offres et services (Vitrine, E-commerce, Sur-mesure) |
| `orders` | Commandes clients |
| `order_items` | Détail des articles commandés |
| `contacts` | Messages de contact |
| `testimonials` | Témoignages clients |
| `projects` | Projets et portfolio |
| `invoices` | Factures |
| `newsletter_subscribers` | Abonnés newsletter |
| `settings` | Paramètres de l'application |
| `activity_logs` | Journal d'activité |

## Compte Admin par défaut

- **Email**: admin@nexus-agency.fr
- **Mot de passe**: Admin123!

⚠️ **Changez ce mot de passe en production !**
