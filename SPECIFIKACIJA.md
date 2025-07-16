# SPECIFIKACIJA - CAFE ORDERING SYSTEM

## OPIS SISTEMA

Cafe Ordering System je kompleksna web aplikacija za upravljanje porudžbinama u kafiću/restoranu. Sistem omogućava real-time komunikaciju između kupaca, konobara i administracije kroz modernu web aplikaciju.

## ARHITEKTURA

### Backend (Node.js/Express)
- **Server**: Express.js sa Socket.IO za real-time komunikaciju
- **Baza podataka**: MySQL
- **Autentifikacija**: JWT sa HttpOnly cookie-ima
- **Enkripcija**: bcrypt za lozinke
- **Port**: 3003

### Frontend (React)
- **Framework**: React.js
- **Styling**: Tailwind CSS
- **Real-time**: Socket.IO client
- **Port**: 3000

## FUNKCIONALNOSTI

### 1. AUTENTIFIKACIJA I AUTORIZACIJA
- **JWT Token**: 24h validnost, HttpOnly cookie
- **Role**: `admin`, `waiter`
- **Login endpoint**: `/api/login`
- **Logout endpoint**: `/api/logout`
- **Token validacija**: `/api/validate-token`

### 2. KORISNICI
**Testni korisnici:**
- `konobar1` (password: test1234) - waiter
- `konobar2` (password: test1234) - waiter  
- `konobar3` (password: test1234) - waiter
- `admin` (password: test1234) - admin

### 3. STOLOVI
- **Ukupno**: 30 stolova (1-30)
- **Indoor**: Stolovi 1-12
- **Outdoor**: Stolovi 13-30
- **QR kodovi**: Automatski generisani (TABLE_001, TABLE_002, itd.)
- **Pozicioniranje**: Drag & drop interfejs za admina

### 4. MENI SISTEM
- **Kategorije**: coffee, soda, spirits, beer, wine, water, cocktails, tea
- **Polja**: name, category, price, description, stock
- **Upravljanje**: Samo admin može dodavati/uređivati
- **Testni podaci**: Zakomentarisani - meni je prazan na startu

### 5. PORUDŽBINE
- **Statusi**: pending, approved, completed, cancelled
- **Real-time**: Socket.IO notifikacije
- **Pracenje**: Koji konobar je odobrio/završio porudžbinu
- **Inventory**: Automatsko smanjenje zaliha pri odobravanju

### 6. KONOBAR DASHBOARD
- **Prikaz porudžbina**: Pending, approved, completed
- **Akcije**: Odobravanje, završavanje, otkazivanje
- **Real-time**: Automatsko osvežavanje
- **Filteri**: Po statusu, stolu, vremenu

### 7. ADMIN DASHBOARD
- **Upravljanje menijem**: Dodavanje, uređivanje stavki
- **Upravljanje stolovima**: Pozicioniranje, kreiranje
- **Statistike**: Ukupne statistike sistema
- **Inventory**: Upravljanje zalihama

### 8. STATISTIKE KONOBARA
- **Dnevne statistike**: Revenue, broj porudžbina, broj stavki
- **Shift statistike**: Trenutna smena
- **Historijske statistike**: Poslednjih 30 dana
- **Reset**: Mogućnost resetovanja statistika

### 9. KUPAC INTERFEJS
- **QR skeniranje**: Pristup meniju po stolu
- **Porudžbina**: Dodavanje stavki u korpu
- **Real-time**: Status porudžbine
- **Responsive**: Mobilno prilagođen

## BAZA PODATAKA

### Tabele:
1. **waiters** - Konobari i admin
2. **tables** - Stolovi sa pozicijama
3. **menu_items** - Stavke menija
4. **orders** - Porudžbine
5. **order_items** - Stavke porudžbina
6. **inventory** - Zalihe (vezane sa menu_items)
7. **waiter_statistics** - Statistike konobara

### Ključne veze:
- `orders.waiter_id` → `waiters.id`
- `orders.table_id` → `tables.id`
- `order_items.order_id` → `orders.id`
- `order_items.menu_item_id` → `menu_items.id`
- `inventory.menu_item_id` → `menu_items.id`

## API ENDPOINTS

### Autentifikacija
- `POST /api/login` - Login
- `POST /api/logout` - Logout
- `GET /api/validate-token` - Validacija tokena
- `GET /api/me` - Trenutni korisnik

### Porudžbine
- `POST /api/orders` - Kreiranje porudžbine (public)
- `GET /api/orders` - Lista porudžbina (auth)
- `PUT /api/orders/:id` - Ažuriranje statusa (auth)
- `DELETE /api/orders/:id` - Brisanje porudžbine (auth)

### Meni
- `GET /api/menu` - Public meni
- `GET /api/menu-items` - Admin meni (auth)
- `POST /api/menu-items` - Dodavanje stavke (auth)

### Stolovi
- `GET /api/table/:qrCode` - Info o stolu (public)
- `GET /api/tables-positions` - Pozicije stolova (auth)
- `PUT /api/tables/:id/position` - Ažuriranje pozicije (auth)
- `POST /api/tables` - Kreiranje stola (auth)

### Statistike
- `GET /api/statistics` - Ukupne statistike (auth)
- `GET /api/waiter-today-stats` - Dnevne statistike konobara (auth)
- `GET /api/waiter-shift-stats` - Shift statistike (auth)
- `POST /api/waiter-reset-stats` - Reset statistika (auth)

### Inventory
- `GET /api/inventory` - Zalihe (auth)
- `PUT /api/inventory/:id` - Ažuriranje zaliha (auth)

## SOCKET.IO EVENTS

### Server → Client
- `new_order` - Nova porudžbina
- `order_updated` - Ažurirana porudžbina
- `order_deleted` - Obrisana porudžbina
- `waiter_stats_updated` - Ažurirane statistike
- `table_position_updated` - Ažurirana pozicija stola
- `table_layout_updated` - Ažuriran layout stolova

## BEZBEDNOST

### Autentifikacija
- JWT tokeni sa 24h validnošću
- HttpOnly cookie-ji za sprečavanje XSS
- bcrypt enkripcija lozinki

### Validacija
- Input validacija na backend-u
- SQL injection zaštita kroz parametrizovane upite
- CORS konfiguracija

### Logging
- Strukturirani logovi (info, warn, error)
- Logovanje korisničkih akcija
- Logovanje grešaka

## POKRETANJE

### Backend
```bash
cd backend
npm install
node server.js
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## KONFIGURACIJA

### Environment Variables
- `JWT_SECRET` - Secret za JWT
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - MySQL konfiguracija
- `FRONTEND_URL` - CORS origin
- `NODE_ENV` - Environment (development/production)

## ČIŠĆENJE

### Obrisani nepotrebni fajlovi:
- Sve test skripte (*.js)
- SQL fajlovi
- JSON test podaci
- Stara SQLite baza (cafe.db)

### Zadržani fajlovi:
- `server.js` - Glavni server
- `database-mysql.js` - Baza podataka
- `package.json` - Dependencies
- `utils/` - Utility funkcije
- `logs/` - Log fajlovi
- `public/` - Static fajlovi

## RAZVOJ

### Dodavanje novih funkcionalnosti:
1. Backend: Dodaj endpoint u `server.js`
2. Database: Dodaj funkciju u `database-mysql.js`
3. Frontend: Dodaj komponentu u `src/components/`
4. Validacija: Dodaj u `utils/validation.js`

### Testiranje:
- API testiranje: Postman/Insomnia
- Frontend testiranje: Browser dev tools
- Database testiranje: MySQL Workbench

## PODRŠKA

Sistem je spreman za produkciju sa:
- Kompletna autentifikacija
- Real-time funkcionalnosti
- Responsive dizajn
- Strukturirani logovi
- Bezbednosne mere 