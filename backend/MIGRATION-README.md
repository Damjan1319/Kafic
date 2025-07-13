# Migracija na MySQL

## Preduvjeti

1. **Instaliraj MySQL Server**
   - Preuzmi sa: https://dev.mysql.com/downloads/mysql/
   - Ili koristi XAMPP: https://www.apachefriends.org/

2. **Instaliraj phpMyAdmin** (opciono)
   - Dolazi sa XAMPP-om
   - Ili instaliraj zasebno

## Koraci za migraciju

### 1. Instaliraj MySQL pakete
```bash
cd backend
npm install mysql2
```

### 2. Konfiguriši bazu podataka

Kreiraj `.env` fajl u `backend` folderu:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=cafe_ordering
DB_PORT=3306

# JWT Secret
JWT_SECRET=your-secret-key-here

# Server Configuration
PORT=3003
```

### 3. Pokreni MySQL server

**Ako koristiš XAMPP:**
1. Otvori XAMPP Control Panel
2. Pokreni Apache i MySQL
3. Klikni "Admin" pored MySQL-a za phpMyAdmin

**Ako koristiš standalone MySQL:**
1. Pokreni MySQL servis
2. Pristupi phpMyAdmin na http://localhost/phpmyadmin

### 4. Pokreni migraciju

```bash
cd backend
node migrate-to-mysql.js
```

### 5. Pokreni server

```bash
node server.js
```

## Struktura baze podataka

### Tabele:
- **waiters** - konobari i admin
- **tables** - stolovi sa QR kodovima
- **menu_items** - stavke menija
- **orders** - porudžbine
- **order_items** - stavke porudžbina

### Relacije:
- `orders.table_id` → `tables.id`
- `orders.waiter_id` → `waiters.id`
- `order_items.order_id` → `orders.id`
- `order_items.item_id` → `menu_items.id`

## Prednosti MySQL-a

✅ **Bolja performansa** za velike količine podataka  
✅ **phpMyAdmin** - vizuelni interfejs za upravljanje  
✅ **Naprednije SQL funkcije**  
✅ **Backup/restore** funkcionalnosti  
✅ **Replikacija** i clustering  
✅ **Profesionalniji** pristup  

## Troubleshooting

### Problem: Connection refused
- Proveri da li je MySQL server pokrenut
- Proveri port (obično 3306)
- Proveri username/password u .env fajlu

### Problem: Access denied
- Proveri da li korisnik ima privilegije za bazu
- Pokušaj sa root korisnikom

### Problem: Database doesn't exist
- Kreiraj bazu ručno u phpMyAdmin
- Ili proveri DB_NAME u .env fajlu

## Pristup phpMyAdmin

1. Otvori browser
2. Idite na: http://localhost/phpmyadmin
3. Uloguj se sa MySQL kredencijalima
4. Selektuj `cafe_ordering` bazu
5. Pregledaj tabele i podatke

## Backup i Restore

### Backup:
```sql
-- U phpMyAdmin: Export → SQL
-- Ili komandna linija:
mysqldump -u root -p cafe_ordering > backup.sql
```

### Restore:
```sql
-- U phpMyAdmin: Import → SQL fajl
-- Ili komandna linija:
mysql -u root -p cafe_ordering < backup.sql
``` 