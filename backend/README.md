# Cafe Ordering System - Backend

Backend aplikacija za sistem poručivanja u kafiću sa QR kodovima.

## Instalacija

```bash
npm install
```

## Pokretanje

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Autentifikacija
- `POST /api/login` - Login konobara/admin

### Meni
- `GET /api/menu` - Dobavi sve stavke menija

### Stolovi
- `GET /api/table/:qrCode` - Dobavi informacije o stolu po QR kodu
- `GET /api/tables` - Dobavi sve stolove (zahtevan token)

### Porudžbine
- `POST /api/orders` - Kreiraj novu porudžbinu
- `GET /api/orders` - Dobavi porudžbine (zahtevan token)
- `PUT /api/orders/:id` - Ažuriraj status porudžbine (zahtevan token)

## Test nalozi

- **Admin**: username: `admin`, password: `admin123`
- **Konobar**: username: `konobar1`, password: `konobar123`

## Socket.io Events

- `new_order` - Nova porudžbina
- `order_updated` - Porudžbina ažurirana 